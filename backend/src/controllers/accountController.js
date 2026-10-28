import { z } from 'zod';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Order } from '../models/Order.js';
import { AuditLog } from '../models/AuditLog.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { AppError } from '../utils/AppError.js';
import { createSession,revokeAllSessions } from '../services/tokenService.js';
import { syncNewsletterContact } from '../services/newsletterService.js';
import { customerPasswordSchema,customerPreferencesSchema,customerProfileSchema } from '../schemas/account.js';

function requireCustomer(req){if(req.user.role!=='CUSTOMER')throw new AppError('Customer account access is required.',403,'FORBIDDEN')}

export async function getCustomerAccount(req,res){
  requireCustomer(req);
  const user=await User.findById(req.user.sub).lean();
  if(!user)throw new AppError('Account not found.',404,'ACCOUNT_NOT_FOUND');
  const [sessions,subscriber]=await Promise.all([
    Session.find({user:req.user.sub,revokedAt:null,expiresAt:{$gt:new Date()}}).select('createdAt lastUsedAt expiresAt').sort({createdAt:-1}).lean(),
    NewsletterSubscriber.findOne({email:user.email}).select('status').lean()
  ]);
  res.json({success:true,data:{profile:profileView(user,subscriber?.status==='ACTIVE'),security:securityView(user,sessions,req.session?.id)}});
}

export async function updateCustomerProfile(req,res){
  requireCustomer(req);
  const data=customerProfileSchema.parse(req.body);const now=new Date();
  const update={firstName:data.firstName,lastName:data.lastName,preferredName:data.preferredName,phone:data.phone,registrationProfile:data.registrationProfile,profileUpdatedAt:now};
  if(data.defaultShippingAddress)update.defaultShippingAddress=data.defaultShippingAddress;
  const operation=data.defaultShippingAddress?{$set:update}:{$set:update,$unset:{defaultShippingAddress:1}};
  const user=await User.findOneAndUpdate({_id:req.user.sub,role:'CUSTOMER'},operation,{new:true,runValidators:true}).lean();
  if(!user)throw new AppError('Account not found.',404,'ACCOUNT_NOT_FOUND');
  await Promise.all([NewsletterSubscriber.updateOne({email:user.email},{$set:{fullName:`${user.firstName} ${user.lastName}`.trim()}}),AuditLog.create({actor:req.user.sub,action:'CUSTOMER_PROFILE_UPDATED',resourceType:'User',resourceId:req.user.sub,requestId:req.id,metadata:{addressSaved:Boolean(data.defaultShippingAddress)}})]);
  res.json({success:true,data:{profile:profileView(user),user:safeUser(user)},message:'Your profile was updated.'});
}

export async function updateCustomerPreferences(req,res){
  requireCustomer(req);
  const {marketingEmail}=customerPreferencesSchema.parse(req.body);const now=new Date();
  const update=marketingEmail?{$set:{marketingConsentAt:now},$unset:{marketingRevokedAt:1}}:{$set:{marketingRevokedAt:now},$unset:{marketingConsentAt:1}};
  const user=await User.findOneAndUpdate({_id:req.user.sub,role:'CUSTOMER'},update,{new:true,runValidators:true}).lean();
  if(!user)throw new AppError('Account not found.',404,'ACCOUNT_NOT_FOUND');
  if(marketingEmail){
    const subscriber=await NewsletterSubscriber.findOneAndUpdate({email:user.email},{$set:{fullName:`${user.firstName} ${user.lastName}`.trim(),status:'ACTIVE',lastSubscribedAt:now,unsubscribedAt:null,'brevoSync.status':'PENDING','brevoSync.lastAttemptAt':now},$setOnInsert:{consentedAt:now,consentVersion:'2026-10-14',consentMethod:'SUBSCRIBE_BUTTON',source:'STOREFRONT'}},{returnDocument:'after',upsert:true,runValidators:true,setDefaultsOnInsert:true});
    try{const result=await syncNewsletterContact(subscriber);subscriber.brevoSync.status=result.status;if(result.syncedAt)subscriber.brevoSync.syncedAt=result.syncedAt;await subscriber.save()}catch(error){await NewsletterSubscriber.updateOne({_id:subscriber._id},{$set:{'brevoSync.status':'FAILED'}});req.log?.warn({err:error,subscriberId:String(subscriber._id)},'Customer newsletter preference sync failed')}
  }else await NewsletterSubscriber.updateOne({email:user.email},{$set:{status:'UNSUBSCRIBED',unsubscribedAt:now}});
  await AuditLog.create({actor:req.user.sub,action:marketingEmail?'MARKETING_EMAIL_ENABLED':'MARKETING_EMAIL_DISABLED',resourceType:'User',resourceId:req.user.sub,requestId:req.id});
  res.json({success:true,data:{marketingEmail:Boolean(user.marketingConsentAt)},message:'Communication preferences saved.'});
}

export async function changeCustomerPassword(req,res){
  requireCustomer(req);
  const data=customerPasswordSchema.parse(req.body);const user=await User.findById(req.user.sub).select('+passwordHash');
  if(!user||!(await user.verifyPassword(data.currentPassword)))throw new AppError('Current password is incorrect.',400,'CURRENT_PASSWORD_INVALID');
  user.passwordHash=await User.hashPassword(data.newPassword);user.passwordChangedAt=new Date();user.sessionVersion+=1;await user.save();
  await revokeAllSessions(user.id);const session=await createSession(req,res,user);
  await AuditLog.create({actor:user.id,action:'CUSTOMER_PASSWORD_CHANGED',resourceType:'User',resourceId:user.id,requestId:req.id});
  res.json({success:true,data:{sessionExpiresAt:session.expiresAt},message:'Password updated. Other sessions were signed out.'});
}

export async function revokeOtherCustomerSessions(req,res){
  requireCustomer(req);
  const result=await Session.updateMany({user:req.user.sub,_id:{$ne:req.session.id},revokedAt:null},{$set:{revokedAt:new Date()}});
  await AuditLog.create({actor:req.user.sub,action:'CUSTOMER_OTHER_SESSIONS_REVOKED',resourceType:'User',resourceId:req.user.sub,requestId:req.id,metadata:{revokedCount:result.modifiedCount}});
  res.json({success:true,data:{revokedCount:result.modifiedCount},message:result.modifiedCount?'Other sessions were signed out.':'No other active sessions were found.'});
}

export async function listCustomerOrders(req,res){
  requireCustomer(req);
  const query=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(25).default(10)}).parse(req.query);
  const filter={user:req.user.sub};const [orders,total]=await Promise.all([
    Order.find(filter).select('number items.name items.quantity items.variantLabel items.dosage items.form items.packSize items.sku items.planSelection status paymentStatus subtotalCents shippingCents taxCents discountCents totalCents priceBreakdown currency shipment.status shipment.trackingNumber createdAt').sort({createdAt:-1}).skip((query.page-1)*query.limit).limit(query.limit).lean(),
    Order.countDocuments(filter)
  ]);
  res.json({success:true,data:orders.map(orderView),meta:{page:query.page,limit:query.limit,total,pages:Math.ceil(total/query.limit)}});
}

function profileView(user,marketingEmail=Boolean(user.marketingConsentAt)){return{id:String(user._id),email:user.email,emailVerified:Boolean(user.emailVerifiedAt),firstName:user.firstName,lastName:user.lastName,preferredName:user.preferredName||'',phone:user.phone||'',defaultShippingAddress:user.defaultShippingAddress||null,registrationProfile:user.registrationProfile||null,marketingEmail,createdAt:user.createdAt,lastLoginAt:user.lastLoginAt||null,profileUpdatedAt:user.profileUpdatedAt||null}}
function securityView(user,sessions,currentId){return{passwordChangedAt:user.passwordChangedAt||null,activeSessionCount:sessions.length,currentSession:sessions.find(session=>String(session._id)===String(currentId))||null,otherSessionCount:sessions.filter(session=>String(session._id)!==String(currentId)).length}}
function safeUser(user){return{id:String(user._id),email:user.email,firstName:user.firstName,lastName:user.lastName,role:user.role,emailVerified:Boolean(user.emailVerifiedAt),registrationProfile:user.registrationProfile}}
function orderView(order){return{id:String(order._id),number:order.number,status:order.status,paymentStatus:order.paymentStatus,totalCents:order.totalCents,currency:order.currency,priceBreakdown:order.priceBreakdown?{quoteReference:order.priceBreakdown.quoteReference,pricingType:order.priceBreakdown.pricingType,certainty:order.priceBreakdown.certainty,medicineCents:order.priceBreakdown.medicineCents,deliveryCents:order.priceBreakdown.deliveryCents,taxCents:order.priceBreakdown.taxCents,otherFeesCents:order.priceBreakdown.otherFeesCents,membershipSavingsCents:order.priceBreakdown.membershipSavingsCents,confirmedAt:order.priceBreakdown.confirmedAt,insuranceSupported:false}:null,items:order.items.map(item=>({name:item.name,variantLabel:item.variantLabel||[item.dosage,item.form,item.packSize].filter(Boolean).join(' · '),sku:item.sku,quantity:item.quantity,planSelection:item.planSelection?.sourceProductSlug?item.planSelection:null})),shipment:order.shipment?{status:order.shipment.status||null,trackingNumber:order.shipment.trackingNumber||null}:null,createdAt:order.createdAt}}
