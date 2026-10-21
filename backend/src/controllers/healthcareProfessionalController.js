import { z } from 'zod';
import { HealthcareProfessional } from '../models/HealthcareProfessional.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { healthcareProfessionalApplicationSchema,healthcareProfessionalReviewSchema,HCP_STATUSES } from '../schemas/healthcareProfessional.js';
import { lookupNpi } from '../services/npiRegistryService.js';
import { sendHcpApplicationNotificationEmail,sendHcpReviewEmail } from '../services/emailService.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);

export async function getMyProfessionalApplication(req,res){
  const application=await HealthcareProfessional.findOne({user:req.user.sub}).lean();
  res.json({success:true,data:application?customerView(application):null});
}

export async function submitProfessionalApplication(req,res){
  const data=healthcareProfessionalApplicationSchema.parse(req.body);
  const existing=await HealthcareProfessional.findOne({user:req.user.sub});
  if(existing&&['PENDING_REVIEW','APPROVED','SUSPENDED'].includes(existing.status))throw new AppError(existing.status==='APPROVED'?'Your professional account is already approved.':'This application cannot be changed while it is under review.',409,'HCP_APPLICATION_LOCKED');
  const duplicate=await HealthcareProfessional.exists({npi:data.npi,user:{$ne:req.user.sub}});
  if(duplicate)throw new AppError('That NPI is already associated with another professional application.',409,'NPI_ALREADY_USED');
  const registry=await lookupNpi(data.npi);
  const now=new Date();
  const payload={...data,credentialAttestedAt:now,noPatientDataAttestedAt:now,termsAcceptedAt:now,privacyAcknowledgedAt:now,submittedAt:now,status:'PENDING_REVIEW',registry,reviewedAt:null,reviewedBy:null,reviewNote:''};
  delete payload.credentialAttestation;delete payload.noPatientDataAttestation;delete payload.termsAccepted;delete payload.privacyAcknowledged;
  let application;
  try{application=existing?await HealthcareProfessional.findByIdAndUpdate(existing._id,{$set:payload},{new:true,runValidators:true}):await HealthcareProfessional.create({...payload,user:req.user.sub})}
  catch(error){if(error?.code===11000)throw new AppError('That NPI is already associated with another professional application.',409,'NPI_ALREADY_USED');throw error}
  await AuditLog.create({actor:req.user.sub,action:existing?'HCP_APPLICATION_RESUBMITTED':'HCP_APPLICATION_SUBMITTED',resourceType:'HealthcareProfessional',resourceId:String(application._id),requestId:req.id,metadata:{registryOutcome:registry.outcome}});
  sendHcpApplicationNotificationEmail({applicationId:String(application._id)}).catch(error=>req.log?.warn({err:error,applicationId:String(application._id)},'HCP application notification failed'));
  res.status(existing?200:201).json({success:true,data:customerView(application.toObject()),message:'Your professional application was submitted for credential review.'});
}

export async function listProfessionalApplications(req,res){
  const page=Math.max(1,Number(req.query.page)||1);const limit=Math.min(50,Math.max(1,Number(req.query.limit)||20));
  const status=String(req.query.status||'ALL').toUpperCase();const q=String(req.query.q||'').trim().slice(0,100);
  const filter={};if(status!=='ALL'){if(!HCP_STATUSES.includes(status))throw new AppError('Invalid professional status filter.',422,'INVALID_FILTER');filter.status=status}
  if(q){const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{professionalEmail:{$regex:escaped,$options:'i'}},{practiceName:{$regex:escaped,$options:'i'}},{npi:{$regex:escaped}},{licenseNumber:{$regex:escaped,$options:'i'}},{'registry.providerName':{$regex:escaped,$options:'i'}}]}
  const[items,total,counts]=await Promise.all([
    HealthcareProfessional.find(filter).populate('user','firstName lastName email').sort({submittedAt:-1}).skip((page-1)*limit).limit(limit).lean(),
    HealthcareProfessional.countDocuments(filter),
    HealthcareProfessional.aggregate([{$group:{_id:'$status',count:{$sum:1}}}])
  ]);
  res.json({success:true,data:items.map(adminView),meta:{page,limit,total,pages:Math.ceil(total/limit),counts:Object.fromEntries(counts.map(item=>[item._id,item.count]))}});
}

export async function reviewProfessionalApplication(req,res){
  const id=objectId.parse(req.params.id);const data=healthcareProfessionalReviewSchema.parse(req.body);
  const application=await HealthcareProfessional.findByIdAndUpdate(id,{$set:{status:data.status,reviewNote:data.note,reviewedAt:new Date(),reviewedBy:req.user.sub}},{new:true,runValidators:true}).populate('user','firstName lastName email');
  if(!application)throw new AppError('Professional application not found.',404,'HCP_APPLICATION_NOT_FOUND');
  await AuditLog.create({actor:req.user.sub,action:`HCP_APPLICATION_${data.status}`,resourceType:'HealthcareProfessional',resourceId:id,requestId:req.id,metadata:{status:data.status}});
  let notificationDelivered=true;
  try{await sendHcpReviewEmail({email:application.user.email,name:application.user.firstName,status:data.status,note:data.note,applicationId:id})}catch(error){notificationDelivered=false;req.log?.warn({err:error,applicationId:id},'HCP review notification failed')}
  res.json({success:true,data:adminView(application.toObject()),message:`Application marked ${data.status.toLowerCase().replaceAll('_',' ')}.`,notificationDelivered});
}

function customerView(application){return{id:String(application._id),status:application.status,professionType:application.professionType,specialty:application.specialty,npi:application.npi,licenseState:application.licenseState,practiceName:application.practiceName,professionalEmail:application.professionalEmail,practicePhone:application.practicePhone,practiceAddress:application.practiceAddress,intendedUse:application.intendedUse,registry:application.registry,submittedAt:application.submittedAt,reviewedAt:application.reviewedAt,reviewNote:application.reviewNote||'',updatedAt:application.updatedAt}}
function adminView(application){const user=application.user&&typeof application.user==='object'?application.user:null;return{...customerView(application),licenseNumber:application.licenseNumber,applicant:user?{id:String(user._id),name:`${user.firstName} ${user.lastName}`.trim(),email:user.email}:null,reviewedBy:application.reviewedBy?String(application.reviewedBy):null,createdAt:application.createdAt}}
