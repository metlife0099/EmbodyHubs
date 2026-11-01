import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { ZelleConfiguration } from '../models/ZelleConfiguration.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { decryptText,encryptText } from './partnerCryptoService.js';

export const ZELLE_PENDING_STATUSES=['PENDING_PAYMENT','PAYMENT_UNDER_REVIEW'];
export function customerReportDecision(currentStatus){return currentStatus==='PENDING_PAYMENT'?'PAYMENT_UNDER_REVIEW':currentStatus}

export async function enabledZelleConfiguration(){
  if(!env.ZELLE_PAYMENTS_ENABLED)throw new AppError('Zelle payments are not enabled for this environment.',503,'ZELLE_DISABLED');
  const config=await ZelleConfiguration.findOne({key:'PRIMARY',enabled:true,businessUseConfirmed:true}).select('+recipientEncrypted +recipientFingerprint');
  if(!config?.recipientEncrypted||!config.businessDisplayName)throw new AppError('Zelle payment configuration is incomplete.',503,'ZELLE_NOT_CONFIGURED');
  if(config.demoOnly&&!(env.NODE_ENV==='development'&&env.ZELLE_DEMO_MODE))throw new AppError('Local payment demo configuration is forbidden in this environment.',503,'ZELLE_DEMO_FORBIDDEN');
  return config;
}

export async function zelleAvailability(){
  if(!env.ZELLE_PAYMENTS_ENABLED)return{enabled:false,reason:'ENVIRONMENT_DISABLED'};
  const config=await ZelleConfiguration.findOne({key:'PRIMARY'}).select('enabled demoOnly businessUseConfirmed businessDisplayName verificationMode').lean();const demoAllowed=env.NODE_ENV==='development'&&env.ZELLE_DEMO_MODE;
  return{enabled:Boolean(config?.enabled&&config.businessUseConfirmed&&config.businessDisplayName&&(!config.demoOnly||demoAllowed)),businessDisplayName:config?.enabled&&(!config.demoOnly||demoAllowed)?config.businessDisplayName:undefined,verificationMode:config?.verificationMode||'MANUAL_BANK_RECONCILIATION'};
}

export function createZellePaymentSnapshot(config,{orderId,amountCents}){
  const recipient=decryptText(config.recipientEncrypted,{aad:'zelle-config:PRIMARY'});
  const paymentReference=`ZEL-${crypto.randomBytes(7).toString('hex').toUpperCase()}`;
  const qrDemo=Boolean(config.demoOnly&&env.NODE_ENV==='development'&&env.ZELLE_DEMO_MODE&&config.qrImageUrl?.startsWith('/images/zelle-demo-'));
  const qrAllowed=Boolean(qrDemo||(config.qrImageUrl&&config.qrBankProvided&&config.qrVerifiedAt));
  return{
    provider:'zelle',
    expectedAmountCents:amountCents,
    paymentReference,
    businessDisplayName:config.businessDisplayName,
    recipientType:config.recipientType,
    recipientEncrypted:encryptText(recipient,{aad:`zelle-order-recipient:${orderId}`}),
    recipientLast4:config.recipientLast4,
    qrImageUrl:qrAllowed?config.qrImageUrl:'',qrDemo,
    instructions:config.instructions,
    verificationMode:'MANUAL_BANK_RECONCILIATION',
    expiresAt:new Date(Date.now()+config.expiresMinutes*60*1000),
    history:[{to:'PENDING_PAYMENT',event:'PAYMENT_REQUEST_CREATED'}]
  };
}

export function customerZellePayment(order){
  const encrypted=order.payment?.recipientEncrypted;
  const recipient=encrypted?decryptText(encrypted,{aad:`zelle-order-recipient:${order._id}`}):'';
  return{
    orderId:String(order._id),orderNumber:order.number,orderStatus:order.status,paymentStatus:order.paymentStatus,
    amountCents:order.payment?.expectedAmountCents??order.totalCents,currency:order.currency,
    paymentReference:order.payment?.paymentReference,businessDisplayName:order.payment?.businessDisplayName,
    recipientType:order.payment?.recipientType,recipient,qrImageUrl:order.payment?.qrImageUrl||null,qrDemo:Boolean(order.payment?.qrDemo),
    instructions:order.payment?.instructions,expiresAt:order.payment?.expiresAt,
    customerSubmittedAt:order.payment?.customerSubmittedAt,verifiedAt:order.payment?.verifiedAt,
    createdAt:order.createdAt
  };
}

export function reconcileDecision({expectedAmountCents,verifiedAmountCents,outcome}){
  if(outcome==='VERIFIED'&&verifiedAmountCents!==expectedAmountCents)return{paymentStatus:'PAYMENT_UNDER_REVIEW',orderStatus:'PENDING_PAYMENT',event:'PAYMENT_AMOUNT_DISCREPANCY'};
  if(outcome==='VERIFIED')return{paymentStatus:'SUCCEEDED',orderStatus:'PAID_REVIEW_REQUIRED',event:'PAYMENT_VERIFIED'};
  if(outcome==='AMOUNT_DISCREPANCY')return{paymentStatus:'PAYMENT_UNDER_REVIEW',orderStatus:'PENDING_PAYMENT',event:'PAYMENT_AMOUNT_DISCREPANCY'};
  if(outcome==='FAILED')return{paymentStatus:'FAILED',orderStatus:'PAYMENT_FAILED',event:'PAYMENT_FAILED'};
  return{paymentStatus:'CANCELLED',orderStatus:'CANCELLED',event:'PAYMENT_CANCELLED'};
}

export async function releasePendingZelleOrder(orderId,{paymentStatus='EXPIRED',orderStatus='CANCELLED',actor,requestId,action='ZELLE_PAYMENT_EXPIRED'}={}){
  const session=await mongoose.startSession();let released=false;
  try{
    await session.withTransaction(async()=>{
      const order=await Order.findOne({_id:orderId,'payment.provider':'zelle',paymentStatus:{$in:ZELLE_PENDING_STATUSES}}).session(session);
      if(!order)return;
      const now=new Date();
      for(const item of order.items){
        const previous=await Product.findOneAndUpdate({_id:item.product,'variants._id':item.variantId},{$inc:{'variants.$.stock':item.quantity}},{new:false,session});
        const variant=previous?.variants?.id(item.variantId);if(!variant)continue;
        await InventoryAdjustment.create([{product:item.product,variantId:item.variantId,sku:item.sku,delta:item.quantity,reason:'PAYMENT_RESERVATION_RELEASE',reference:order.payment.paymentReference,idempotencyKey:`zelle-release-${order._id}-${item.variantId}`,actor:actor||order.user,before:variant.stock,after:variant.stock+item.quantity}],{session});
      }
      order.paymentStatus=paymentStatus;order.status=orderStatus;order.payment.history.push({from:order.payment.history.at(-1)?.to||'PENDING_PAYMENT',to:paymentStatus,event:action,actor:actor||undefined,createdAt:now});
      await order.save({session});
      await AuditLog.create([{actor:actor||order.user,action,resourceType:'Order',resourceId:String(order._id),requestId,metadata:{orderNumber:order.number,paymentReference:order.payment.paymentReference}}],{session});
      released=true;
    });
  }finally{await session.endSession()}
  return released;
}

export async function expireStaleZellePayments({limit=100}={}){
  const stale=await Order.find({'payment.provider':'zelle',paymentStatus:'PENDING_PAYMENT','payment.expiresAt':{$lte:new Date()}}).select('_id').limit(limit).lean();
  for(const order of stale)await releasePendingZelleOrder(order._id);
  return stale.length;
}
