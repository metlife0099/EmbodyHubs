import mongoose from 'mongoose';
import { PRESCRIPTION_STATES } from '../constants/workflow.js';

const historySchema=new mongoose.Schema({from:String,to:{type:String,enum:PRESCRIPTION_STATES,required:true},event:{type:String,required:true,maxLength:100},actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},actorType:{type:String,enum:['CUSTOMER','EMBODY_ADMIN','PHARMACY','SYSTEM'],required:true},reasonCode:{type:String,trim:true,maxLength:100},createdAt:{type:Date,default:Date.now,immutable:true}},{_id:true});
const clarificationSchema=new mongoose.Schema({requestedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},messageEncrypted:{type:String,required:true,select:false},responseEncrypted:{type:String,select:false},status:{type:String,enum:['OPEN','RESPONDED','CLOSED'],default:'OPEN'},createdAt:{type:Date,default:Date.now},respondedAt:Date},{_id:true});
const schema=new mongoose.Schema({
  reference:{type:String,required:true,unique:true,index:true},
  customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  status:{type:String,enum:PRESCRIPTION_STATES,default:'UPLOADED',index:true},
  customerState:{type:String,required:true,match:/^[A-Z]{2}$/,index:true},
  prescriptionType:{type:String,enum:['NEW','REFILL','TRANSFER','OTHER'],required:true},
  controlledSubstanceDeclared:{type:Boolean,default:false},
  productSlugs:{type:[String],default:[]},
  consent:{acceptedAt:{type:Date,required:true},noticeVersion:{type:String,required:true},customerAttestation:{type:Boolean,required:true}},
  document:{originalNameEncrypted:{type:String,required:true,select:false},mimeType:{type:String,enum:['application/pdf','image/jpeg','image/png'],required:true},bytes:{type:Number,required:true},storagePublicId:{type:String,required:true,select:false},integrityHmac:{type:String,required:true,select:false},contentFingerprint:{type:String,required:true,index:true},scanStatus:{type:String,enum:['PENDING','CLEAN','REJECTED'],required:true},uploadedAt:{type:Date,default:Date.now}},
  eligibility:{status:{type:String,enum:['PENDING','ELIGIBLE','BLOCKED','MANUAL_REVIEW'],default:'PENDING'},checkedAt:Date,reasonCodes:{type:[String],default:[]},controlVersions:{type:[mongoose.Schema.Types.ObjectId],ref:'PlatformControl',default:[]}},
  assignedPartner:{type:mongoose.Schema.Types.ObjectId,ref:'PartnerApplication',index:true},
  assignment:{assignedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},assignedAt:Date,handoffAt:Date,receiptConfirmedAt:Date,responseDueAt:Date},
  operationalHold:{active:{type:Boolean,default:false},previousStatus:String,reasonCode:String,noteEncrypted:{type:String,select:false},placedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},placedAt:Date,releasedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},releasedAt:Date},
  professionalReview:{reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},decision:{type:String,enum:['ACCEPT','REJECT','HOLD','REQUEST_INFORMATION']},reasonCategory:{type:String,maxLength:100},noteEncrypted:{type:String,select:false},decidedAt:Date},
  clarifications:{type:[clarificationSchema],default:[]},
  order:{type:mongoose.Schema.Types.ObjectId,ref:'Order'},
  history:{type:[historySchema],default:[]},
  closedAt:Date,
  expiresAt:{type:Date,index:true}
},{timestamps:true});
schema.index({assignedPartner:1,status:1,createdAt:-1});schema.index({customer:1,createdAt:-1});schema.index({'assignment.responseDueAt':1,status:1});
export const PrescriptionSubmission=mongoose.model('PrescriptionSubmission',schema);
