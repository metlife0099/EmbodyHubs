import { z } from 'zod';
import { Order } from '../models/Order.js';
import { AuditLog } from '../models/AuditLog.js';
import { SHIPPING_STATES } from '../constants/workflow.js';
import { AppError } from '../utils/AppError.js';
import { deliverShipmentNotification } from '../services/orderNotificationService.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const shippingQuery=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(100).default(25),q:z.string().trim().max(100).optional().default(''),status:z.enum(['ALL','AWAITING_REVIEW','READY','IN_TRANSIT','DELIVERED','EXCEPTION']).default('ALL')});
export const INDIA_POST_TRACKING=/^[A-Z]{2}\d{9}IN$/;
const indiaPostId=z.string().trim().toUpperCase().transform(value=>value.replace(/\s+/g,'')).refine(value=>INDIA_POST_TRACKING.test(value),'Enter a valid 13-character India Post consignment ID, for example EE123456789IN.');
const shipmentSchema=z.object({provider:z.literal('INDIA_POST'),trackingNumber:indiaPostId,status:z.enum(SHIPPING_STATES),description:z.string().trim().min(3).max(240),location:z.string().trim().max(160).optional().default(''),occurredAt:z.coerce.date().refine(value=>value.getTime()<=Date.now()+10*60*1000,'Shipment event time cannot be in the future.').optional()}).superRefine((data,ctx)=>{if(!['PRE_SHIPMENT','LABEL_CREATED'].includes(data.status)&&data.location.length<2)ctx.addIssue({code:'custom',path:['location'],message:'A verified event location is required for this shipment status.'})});
const indiaPostDetailsSchema=z.object({trackingNumber:indiaPostId,serviceType:z.string().trim().min(2).max(80),bookingOffice:z.string().trim().max(160).optional().default(''),destinationOffice:z.string().trim().max(160).optional().default(''),estimatedDeliveryAt:z.union([z.coerce.date(),z.literal(''),z.null()]).optional(),correctionReason:z.string().trim().min(8).max(300)});
export const SHIPPING_TRANSITIONS={PRE_SHIPMENT:['PRE_SHIPMENT','LABEL_CREATED'],LABEL_CREATED:['LABEL_CREATED','ACCEPTED','IN_TRANSIT','DELIVERY_EXCEPTION'],ACCEPTED:['ACCEPTED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERY_EXCEPTION'],IN_TRANSIT:['IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','DELIVERY_EXCEPTION','RETURNED_TO_SENDER','UNKNOWN_DELAYED'],OUT_FOR_DELIVERY:['OUT_FOR_DELIVERY','DELIVERED','DELIVERY_EXCEPTION','UNKNOWN_DELAYED'],DELIVERY_EXCEPTION:['DELIVERY_EXCEPTION','IN_TRANSIT','OUT_FOR_DELIVERY','RETURNED_TO_SENDER'],UNKNOWN_DELAYED:['UNKNOWN_DELAYED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','DELIVERY_EXCEPTION','RETURNED_TO_SENDER'],DELIVERED:['DELIVERED'],RETURNED_TO_SENDER:['RETURNED_TO_SENDER']};

export function canTransitionShipment(from,to){return !from?['PRE_SHIPMENT','LABEL_CREATED','ACCEPTED','IN_TRANSIT'].includes(to):Boolean(SHIPPING_TRANSITIONS[from]?.includes(to))}
function shipmentBucket(order){const value=order.shipment?.status;if(value==='DELIVERED')return'DELIVERED';if(['DELIVERY_EXCEPTION','RETURNED_TO_SENDER','UNKNOWN_DELAYED'].includes(value))return'EXCEPTION';if(['ACCEPTED','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(value))return'IN_TRANSIT';if(order.status==='APPROVED_FOR_FULFILLMENT'||['PRE_SHIPMENT','LABEL_CREATED'].includes(value))return'READY';return'AWAITING_REVIEW'}
function shippingOrder(order){return{id:String(order._id),number:order.number,status:order.status,paymentStatus:order.paymentStatus,pharmacyReviewStatus:order.pharmacyReviewStatus,prescriptionStatus:order.prescriptionStatus,customer:order.user&&{name:`${order.user.firstName} ${order.user.lastName}`.trim(),email:order.user.email},items:order.items.map(item=>({name:item.name,sku:item.sku,variantLabel:item.variantLabel||[item.dosage,item.form,item.packSize].filter(Boolean).join(' · '),quantity:item.quantity,prescriptionRequired:item.prescriptionRequired})),shippingAddress:order.shippingAddress,shipment:order.shipment||null,bucket:shipmentBucket(order),createdAt:order.createdAt,updatedAt:order.updatedAt}}

export async function listShipments(req,res){
  const query=shippingQuery.parse(req.query);const escaped=query.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const filter={paymentStatus:'SUCCEEDED',status:{$nin:['CANCELLED','REFUND_PENDING','REFUNDED']}};
  if(query.q)filter.$or=[{number:{$regex:escaped,$options:'i'}},{'shipment.trackingNumber':{$regex:escaped,$options:'i'}}];
  const orders=await Order.find(filter).populate('user','firstName lastName email').sort({createdAt:-1}).lean();
  let rows=orders.map(shippingOrder);if(query.status!=='ALL')rows=rows.filter(order=>order.bucket===query.status);
  const total=rows.length;const start=(query.page-1)*query.limit;
  const metrics={paidOrders:orders.length,awaitingReview:orders.filter(item=>shipmentBucket(item)==='AWAITING_REVIEW').length,ready:orders.filter(item=>shipmentBucket(item)==='READY').length,inTransit:orders.filter(item=>shipmentBucket(item)==='IN_TRANSIT').length,exceptions:orders.filter(item=>shipmentBucket(item)==='EXCEPTION').length};
  res.json({success:true,data:rows.slice(start,start+query.limit),metrics,meta:{page:query.page,limit:query.limit,total,pages:Math.max(1,Math.ceil(total/query.limit))}});
}

export async function authorizeFulfillment(req,res){
  const {id}=z.object({id:objectId}).parse(req.params);const order=await Order.findById(id);
  if(!order)throw new AppError('Order not found.',404,'ORDER_NOT_FOUND');
  if(order.paymentStatus!=='SUCCEEDED')throw new AppError('Payment must be confirmed before fulfillment.',409,'PAYMENT_NOT_CONFIRMED');
  if(order.prescriptionStatus!=='NOT_REQUIRED'&&order.prescriptionStatus!=='VERIFIED')throw new AppError('Prescription verification is incomplete.',409,'PRESCRIPTION_NOT_VERIFIED');
  if(order.pharmacyReviewStatus!=='NOT_REQUIRED'&&order.pharmacyReviewStatus!=='APPROVED')throw new AppError('Pharmacy review is incomplete.',409,'PHARMACY_REVIEW_REQUIRED');
  if(['SHIPPED','DELIVERED','CANCELLED','REFUND_PENDING','REFUNDED'].includes(order.status))throw new AppError('This order cannot be moved to fulfillment.',409,'INVALID_ORDER_STATE');
  order.status='APPROVED_FOR_FULFILLMENT';order.shipment.authorizedAt=new Date();order.shipment.updatedBy=req.user.sub;await order.save();
  await AuditLog.create({actor:req.user.sub,action:'FULFILLMENT_AUTHORIZED',resourceType:'Order',resourceId:String(order._id),requestId:req.id,metadata:{orderNumber:order.number}});
  res.json({success:true,data:shippingOrder(order.toObject()),message:'Order authorized for fulfillment.'});
}

export async function updateShipment(req,res){
  const {id}=z.object({id:objectId}).parse(req.params);const data=shipmentSchema.parse(req.body);const order=await Order.findById(id);
  if(!order)throw new AppError('Order not found.',404,'ORDER_NOT_FOUND');
  if(order.paymentStatus!=='SUCCEEDED'||!['APPROVED_FOR_FULFILLMENT','FULFILLING','SHIPPED','DELIVERED'].includes(order.status))throw new AppError('Authorize this paid order before creating a shipment.',409,'FULFILLMENT_NOT_AUTHORIZED');
  if(!canTransitionShipment(order.shipment?.status,data.status))throw new AppError(`Shipment cannot move from ${order.shipment?.status} to ${data.status}.`,409,'INVALID_SHIPMENT_TRANSITION');
  const trackingNumber=data.trackingNumber;const trackingOwner=await Order.exists({_id:{$ne:order._id},'shipment.provider':data.provider,'shipment.trackingNumber':trackingNumber});
  if(trackingOwner)throw new AppError('That carrier tracking number is already assigned to another order.',409,'TRACKING_ALREADY_ASSIGNED');
  const now=new Date();const eventTime=data.occurredAt||now;if(eventTime<order.createdAt)throw new AppError('Shipment event time cannot be earlier than the order.',422,'INVALID_SHIPMENT_EVENT_TIME');const wasShipped=Boolean(order.shipment?.shippedAt);order.shipment.provider=data.provider;order.shipment.trackingNumber=trackingNumber;order.shipment.status=data.status;order.shipment.updatedBy=req.user.sub;order.shipment.events.push({status:data.status,description:data.description,location:data.location,occurredAt:eventTime,recordedAt:now,source:'ADMIN_VERIFIED',actor:req.user.sub});
  if(['PRE_SHIPMENT','LABEL_CREATED'].includes(data.status))order.status='FULFILLING';
  if(['ACCEPTED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERY_EXCEPTION','RETURNED_TO_SENDER','UNKNOWN_DELAYED'].includes(data.status)){order.status='SHIPPED';order.shipment.shippedAt=order.shipment.shippedAt||now}
  if(data.status==='DELIVERED'){order.status='DELIVERED';order.shipment.shippedAt=order.shipment.shippedAt||now;order.shipment.deliveredAt=now}
  await order.save();
  await AuditLog.create({actor:req.user.sub,action:'SHIPMENT_UPDATED',resourceType:'Order',resourceId:String(order._id),requestId:req.id,metadata:{orderNumber:order.number,provider:data.provider,trackingNumber:data.trackingNumber,status:data.status}});
  let emailNotification=order.notifications?.shipped?.status||'PENDING';if(!wasShipped&&order.shipment.shippedAt){try{await deliverShipmentNotification(order._id);emailNotification='SENT'}catch(error){emailNotification='FAILED';req.log?.warn({err:error,orderId:String(order._id)},'Shipment email delivery failed')}}
  res.json({success:true,data:{...shippingOrder(order.toObject()),emailNotification},message:emailNotification==='FAILED'?'Shipment recorded. Customer email is queued for retry.':'Shipment timeline updated and customer notification processed.'});
}

export async function updateIndiaPostDetails(req,res){
  const{id}=z.object({id:objectId}).parse(req.params);const data=indiaPostDetailsSchema.parse(req.body);const order=await Order.findById(id);
  if(!order)throw new AppError('Order not found.',404,'ORDER_NOT_FOUND');
  if(order.shipment?.provider!=='INDIA_POST'||!order.shipment?.trackingNumber)throw new AppError('Record the India Post shipment before editing its details.',409,'SHIPMENT_NOT_CREATED');
  const duplicate=await Order.exists({_id:{$ne:order._id},'shipment.provider':'INDIA_POST','shipment.trackingNumber':data.trackingNumber});if(duplicate)throw new AppError('That India Post consignment ID is already assigned to another order.',409,'TRACKING_ALREADY_ASSIGNED');
  const previous={trackingNumber:order.shipment.trackingNumber,serviceType:order.shipment.serviceType||'',bookingOffice:order.shipment.bookingOffice||'',destinationOffice:order.shipment.destinationOffice||'',estimatedDeliveryAt:order.shipment.estimatedDeliveryAt||null};
  order.shipment.trackingNumber=data.trackingNumber;order.shipment.serviceType=data.serviceType;order.shipment.bookingOffice=data.bookingOffice;order.shipment.destinationOffice=data.destinationOffice;order.shipment.estimatedDeliveryAt=data.estimatedDeliveryAt||undefined;order.shipment.detailsUpdatedAt=new Date();order.shipment.updatedBy=req.user.sub;await order.save();
  await AuditLog.create({actor:req.user.sub,action:'INDIA_POST_DETAILS_CORRECTED',resourceType:'Order',resourceId:String(order._id),requestId:req.id,metadata:{orderNumber:order.number,previous,next:{trackingNumber:data.trackingNumber,serviceType:data.serviceType,bookingOffice:data.bookingOffice,destinationOffice:data.destinationOffice,estimatedDeliveryAt:data.estimatedDeliveryAt||null},reason:data.correctionReason}});
  res.json({success:true,data:shippingOrder(order.toObject()),message:'India Post shipment details were updated and audit-logged.'});
}

export async function trackShipment(req,res){
  const {number}=z.object({number:z.string().trim().toUpperCase().regex(/^[A-Z0-9 -]{6,40}$/)}).parse(req.params);const normalized=number.replace(/\s+/g,'');
  const order=await Order.findOne({'shipment.trackingNumber':normalized}).select('shipment').lean();
  if(!order?.shipment?.status)throw new AppError('No shipment was found for that tracking number.',404,'TRACKING_NOT_FOUND');
  const carrierUrls={INDIA_POST:'https://www.indiapost.gov.in/',USPS:`https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(normalized)}`,UPS:`https://www.ups.com/track?tracknum=${encodeURIComponent(normalized)}`,FEDEX:`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(normalized)}`,DHL:`https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(normalized)}`};
  res.json({success:true,data:{provider:order.shipment.provider,trackingNumber:normalized,status:order.shipment.status,events:[...(order.shipment.events||[])].sort((a,b)=>new Date(b.occurredAt)-new Date(a.occurredAt)).map(event=>({status:event.status,description:event.description,location:event.location||'',source:event.source||'ADMIN_VERIFIED',occurredAt:event.occurredAt})),carrierUrl:carrierUrls[order.shipment.provider]||null}});
}
