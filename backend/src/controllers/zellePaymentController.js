import { z } from 'zod';
import { AuditLog } from '../models/AuditLog.js';
import { Order } from '../models/Order.js';
import { ZelleConfiguration } from '../models/ZelleConfiguration.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { blindIndex,decryptText,encryptText } from '../services/partnerCryptoService.js';
import { customerReportDecision,customerZellePayment,expireStaleZellePayments,reconcileDecision,releasePendingZelleOrder,zelleAvailability,ZELLE_PENDING_STATUSES } from '../services/zellePaymentService.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const configSchema=z.object({
  enabled:z.boolean(),businessUseConfirmed:z.boolean(),businessDisplayName:z.string().trim().max(120),
  recipientType:z.enum(['EMAIL','PHONE','TAG']),recipient:z.string().trim().max(160),
  qrImageUrl:z.union([z.literal(''),z.string().url().max(500)]),qrBankProvided:z.boolean(),
  instructions:z.string().trim().min(20).max(1200),expiresMinutes:z.number().int().min(15).max(1440)
}).strict().superRefine((data,ctx)=>{
  if(data.recipientType==='EMAIL'&&!z.string().email().safeParse(data.recipient).success)ctx.addIssue({code:'custom',path:['recipient'],message:'Enter a valid enrolled business email.'});
  if(data.recipientType==='PHONE'&&!/^\+?1?\d{10}$/.test(data.recipient.replace(/[^+\d]/g,'')))ctx.addIssue({code:'custom',path:['recipient'],message:'Enter a valid enrolled U.S. mobile number.'});
  if(data.recipientType==='TAG'&&!/^[A-Za-z0-9._-]{3,80}$/.test(data.recipient))ctx.addIssue({code:'custom',path:['recipient'],message:'Enter the exact bank-approved Zelle tag.'});
  if(data.qrImageUrl&&!data.qrBankProvided)ctx.addIssue({code:'custom',path:['qrBankProvided'],message:'A QR image cannot be published until its bank-provided origin is attested.'});
  if(data.qrImageUrl&&!/^https:\/\/res\.cloudinary\.com\//i.test(data.qrImageUrl))ctx.addIssue({code:'custom',path:['qrImageUrl'],message:'Store the verified QR asset in the approved Cloudinary account before publishing it.'});
  if(data.enabled&&(!data.businessUseConfirmed||!data.businessDisplayName||!data.recipient))ctx.addIssue({code:'custom',path:['enabled'],message:'Business-account eligibility, display name, and enrolled recipient must be verified before enabling Zelle.'});
});
const submitSchema=z.object({customerConfirmation:z.string().trim().max(100).optional().default('')}).strict();
const reconcileSchema=z.object({outcome:z.enum(['VERIFIED','AMOUNT_DISCREPANCY','FAILED','CANCELLED']),verifiedAmountCents:z.number().int().min(0).max(100_000_000),bankTransactionReference:z.string().trim().min(3).max(120),note:z.string().trim().min(3).max(1000)}).strict();

export async function getZelleAvailability(_req,res){res.set('Cache-Control','no-store').json({success:true,data:await zelleAvailability()})}

export async function getMyZellePayment(req,res){
  const id=objectId.parse(req.params.id);let order=await Order.findOne({_id:id,user:req.user.sub,'payment.provider':'zelle'}).select('+payment.recipientEncrypted');
  if(!order)throw new AppError('Zelle payment request not found.',404,'PAYMENT_NOT_FOUND');
  if(order.paymentStatus==='PENDING_PAYMENT'&&order.payment.expiresAt<=new Date()){await releasePendingZelleOrder(order._id,{requestId:req.id});order=await Order.findOne({_id:id,user:req.user.sub}).select('+payment.recipientEncrypted')}
  res.set('Cache-Control','no-store, private').json({success:true,data:customerZellePayment(order)});
}

export async function submitMyZellePayment(req,res){
  const id=objectId.parse(req.params.id);const data=submitSchema.parse(req.body);const order=await Order.findOne({_id:id,user:req.user.sub,'payment.provider':'zelle'}).select('+payment.customerConfirmationEncrypted');
  if(!order)throw new AppError('Zelle payment request not found.',404,'PAYMENT_NOT_FOUND');
  if(order.paymentStatus==='PENDING_PAYMENT'&&order.payment.expiresAt<=new Date()){await releasePendingZelleOrder(order._id,{requestId:req.id});throw new AppError('This payment request expired. Return to checkout to create a current order.',409,'PAYMENT_EXPIRED')}
  if(order.paymentStatus==='PAYMENT_UNDER_REVIEW')return res.json({success:true,data:{paymentStatus:order.paymentStatus},message:'Payment is already queued for independent verification.'});
  if(order.paymentStatus!=='PENDING_PAYMENT')throw new AppError('This payment request can no longer be submitted.',409,'PAYMENT_NOT_PENDING');
  order.paymentStatus=customerReportDecision(order.paymentStatus);order.payment.customerSubmittedAt=new Date();if(data.customerConfirmation)order.payment.customerConfirmationEncrypted=encryptText(data.customerConfirmation,{aad:`zelle-customer-confirmation:${order._id}`});order.payment.history.push({from:'PENDING_PAYMENT',to:'PAYMENT_UNDER_REVIEW',event:'CUSTOMER_REPORTED_TRANSFER',actor:req.user.sub});await order.save();
  await AuditLog.create({actor:req.user.sub,action:'ZELLE_CUSTOMER_REPORTED_TRANSFER',resourceType:'Order',resourceId:String(order._id),requestId:req.id,metadata:{orderNumber:order.number,paymentReference:order.payment.paymentReference}});
  res.json({success:true,data:{paymentStatus:order.paymentStatus},message:'Transfer reported for review. This does not confirm payment.'});
}

export async function getZelleConfiguration(req,res){
  const config=await ZelleConfiguration.findOne({key:'PRIMARY'}).select('+recipientEncrypted');const recipient=config?.recipientEncrypted?decryptText(config.recipientEncrypted,{aad:'zelle-config:PRIMARY'}):'';
  await AuditLog.create({actor:req.user.sub,action:'ZELLE_CONFIGURATION_ACCESSED',resourceType:'ZelleConfiguration',resourceId:String(config?._id||'PRIMARY'),requestId:req.id,metadata:{configured:Boolean(config)}});
  res.set('Cache-Control','no-store, private').json({success:true,data:{environmentEnabled:env.ZELLE_PAYMENTS_ENABLED,enabled:Boolean(config?.enabled),businessUseConfirmed:Boolean(config?.businessUseConfirmed),businessDisplayName:config?.businessDisplayName||'',recipientType:config?.recipientType||'EMAIL',recipient,recipientMasked:config?.recipientLast4?`••••${config.recipientLast4}`:'',qrImageUrl:config?.qrImageUrl||'',qrBankProvided:Boolean(config?.qrBankProvided),qrVerifiedAt:config?.qrVerifiedAt||null,instructions:config?.instructions||'Open Zelle in your eligible banking app, confirm the business recipient, and enter the exact amount shown on this order.',verificationMode:'MANUAL_BANK_RECONCILIATION',expiresMinutes:config?.expiresMinutes||60,updatedAt:config?.updatedAt||null}})
}

export async function updateZelleConfiguration(req,res){
  const data=configSchema.parse(req.body);const recipient=data.recipient.trim();const now=new Date();
  const update={enabled:data.enabled,demoOnly:false,businessUseConfirmed:data.businessUseConfirmed,businessDisplayName:data.businessDisplayName,recipientType:data.recipientType,recipientEncrypted:encryptText(recipient,{aad:'zelle-config:PRIMARY'}),recipientFingerprint:blindIndex(recipient,'zelle-recipient'),recipientLast4:recipient.slice(-4),qrImageUrl:data.qrImageUrl,qrBankProvided:data.qrBankProvided,qrVerifiedAt:data.qrImageUrl&&data.qrBankProvided?now:undefined,instructions:data.instructions,verificationMode:'MANUAL_BANK_RECONCILIATION',expiresMinutes:data.expiresMinutes,updatedBy:req.user.sub};
  const mutation={$set:update,$setOnInsert:{key:'PRIMARY'}};if(!data.qrImageUrl)mutation.$unset={qrVerifiedAt:1};
  const config=await ZelleConfiguration.findOneAndUpdate({key:'PRIMARY'},mutation,{new:true,upsert:true,runValidators:true});
  await AuditLog.create({actor:req.user.sub,action:'ZELLE_CONFIGURATION_UPDATED',resourceType:'ZelleConfiguration',resourceId:String(config._id),requestId:req.id,metadata:{enabled:config.enabled,businessUseConfirmed:config.businessUseConfirmed,recipientType:config.recipientType,qrPublished:Boolean(config.qrVerifiedAt),expiresMinutes:config.expiresMinutes}});
  res.json({success:true,data:{enabled:config.enabled,environmentEnabled:env.ZELLE_PAYMENTS_ENABLED},message:config.enabled&&!env.ZELLE_PAYMENTS_ENABLED?'Configuration saved, but the environment kill switch remains disabled.':'Zelle configuration saved.'});
}

export async function listZellePayments(req,res){
  await expireStaleZellePayments();const query=z.object({status:z.enum(['ALL','PENDING_PAYMENT','PAYMENT_UNDER_REVIEW','SUCCEEDED','FAILED','CANCELLED','EXPIRED']).default('ALL'),q:z.string().trim().max(100).default('')}).parse(req.query);const filter={'payment.provider':'zelle'};if(query.status!=='ALL')filter.paymentStatus=query.status;if(query.q){const escaped=query.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.number={$regex:escaped,$options:'i'}}
  const orders=await Order.find(filter).populate('user','firstName lastName email').sort({createdAt:-1}).limit(200).lean();const counts=await Order.aggregate([{$match:{'payment.provider':'zelle'}},{$group:{_id:'$paymentStatus',count:{$sum:1}}}]);
  res.json({success:true,data:orders.map(adminPayment),meta:{counts:Object.fromEntries(counts.map(item=>[item._id,item.count])),total:orders.length}});
}

export async function reconcileZellePayment(req,res){
  const id=objectId.parse(req.params.id);const data=reconcileSchema.parse(req.body);const referenceFingerprint=blindIndex(data.bankTransactionReference,'zelle-bank-transaction');const order=await Order.findOne({_id:id,'payment.provider':'zelle'}).select('+payment.reviewNoteEncrypted +payment.bankTransactionReferenceFingerprint');if(!order)throw new AppError('Zelle payment request not found.',404,'PAYMENT_NOT_FOUND');
  const existingReference=await Order.findOne({_id:{$ne:order._id},'payment.bankTransactionReferenceFingerprint':referenceFingerprint}).select('number').lean();if(existingReference)throw new AppError(`That bank transaction is already assigned to order ${existingReference.number}.`,409,'BANK_TRANSACTION_ALREADY_USED');
  if(order.paymentStatus==='SUCCEEDED'){if(order.payment.bankTransactionReferenceFingerprint===referenceFingerprint&&order.payment.verifiedAmountCents===data.verifiedAmountCents)return res.json({success:true,data:adminPayment(order.toObject()),message:'This bank transaction was already reconciled.'});throw new AppError('A completed payment cannot be replaced with another bank record.',409,'PAYMENT_ALREADY_VERIFIED')}
  if(!ZELLE_PENDING_STATUSES.includes(order.paymentStatus))throw new AppError('This payment request is no longer eligible for reconciliation.',409,'PAYMENT_NOT_RECONCILABLE');
  const decision=reconcileDecision({expectedAmountCents:order.payment.expectedAmountCents,verifiedAmountCents:data.verifiedAmountCents,outcome:data.outcome});
  if(['FAILED','CANCELLED'].includes(decision.paymentStatus)){await releasePendingZelleOrder(order._id,{paymentStatus:decision.paymentStatus,orderStatus:decision.orderStatus,actor:req.user.sub,requestId:req.id,action:`ZELLE_${decision.event}`});const released=await Order.findById(order._id).populate('user','firstName lastName email').lean();return res.json({success:true,data:adminPayment(released),message:'Payment request closed and reserved inventory released.'})}
  const previous=order.paymentStatus;const verifiedAt=new Date();const referenceLast4=data.bankTransactionReference.slice(-4);const set={'paymentStatus':decision.paymentStatus,'status':decision.orderStatus,'payment.verifiedAmountCents':data.verifiedAmountCents,'payment.bankTransactionReferenceEncrypted':encryptText(data.bankTransactionReference,{aad:`zelle-bank-transaction:${order._id}`}),'payment.bankTransactionReferenceFingerprint':referenceFingerprint,'payment.bankTransactionReferenceLast4':referenceLast4,'payment.reviewNoteEncrypted':encryptText(data.note,{aad:`zelle-review-note:${order._id}`}),'payment.verifiedBy':req.user.sub,'payment.verifiedAt':verifiedAt};if(decision.paymentStatus==='SUCCEEDED'){set['payment.externalId']=`zelle-bank-••••${referenceLast4}`;set['payment.confirmedAt']=verifiedAt}
  let updated;try{updated=await Order.findOneAndUpdate({_id:order._id,paymentStatus:previous,updatedAt:order.updatedAt},{$set:set,$push:{'payment.history':{from:previous,to:decision.paymentStatus,event:decision.event,actor:req.user.sub}}},{new:true,runValidators:true})}catch(error){if(error?.code===11000)throw new AppError('That bank transaction is already assigned to another order.',409,'BANK_TRANSACTION_ALREADY_USED');throw error}
  if(!updated)throw new AppError('This payment changed during review. Reload the queue before recording a decision.',409,'PAYMENT_RECONCILIATION_CONFLICT');
  await AuditLog.create({actor:req.user.sub,action:`ZELLE_${decision.event}`,resourceType:'Order',resourceId:String(updated._id),requestId:req.id,metadata:{orderNumber:updated.number,paymentReference:updated.payment.paymentReference,expectedAmountCents:updated.payment.expectedAmountCents,verifiedAmountCents:data.verifiedAmountCents}});
  res.json({success:true,data:adminPayment(updated.toObject()),message:decision.paymentStatus==='SUCCEEDED'?'Payment independently verified. Fulfillment gates remain separate.':'Amount discrepancy recorded for manual review.'});
}

function adminPayment(order){return{id:String(order._id),number:order.number,status:order.status,paymentStatus:order.paymentStatus,customer:order.user&&{name:`${order.user.firstName||''} ${order.user.lastName||''}`.trim(),email:order.user.email},expectedAmountCents:order.payment?.expectedAmountCents??order.totalCents,verifiedAmountCents:order.payment?.verifiedAmountCents,paymentReference:order.payment?.paymentReference,bankTransactionReferenceMasked:order.payment?.bankTransactionReferenceLast4?`••••${order.payment.bankTransactionReferenceLast4}`:null,customerSubmittedAt:order.payment?.customerSubmittedAt,verifiedAt:order.payment?.verifiedAt,verifiedBy:order.payment?.verifiedBy,expiresAt:order.payment?.expiresAt,history:order.payment?.history||[],createdAt:order.createdAt}}
