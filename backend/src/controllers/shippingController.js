import { z } from 'zod';
import { Order } from '../models/Order.js';
import { AuditLog } from '../models/AuditLog.js';
import { SHIPPING_STATES } from '../constants/workflow.js';
import { AppError } from '../utils/AppError.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const shippingQuery=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(100).default(25),q:z.string().trim().max(100).optional().default(''),status:z.enum(['ALL','AWAITING_REVIEW','READY','IN_TRANSIT','DELIVERED','EXCEPTION']).default('ALL')});
const shipmentSchema=z.object({provider:z.enum(['USPS','UPS','FEDEX','DHL','OTHER']),trackingNumber:z.string().trim().toUpperCase().regex(/^[A-Z0-9 -]{6,40}$/),status:z.enum(SHIPPING_STATES),description:z.string().trim().min(3).max(240)});
export const SHIPPING_TRANSITIONS={PRE_SHIPMENT:['PRE_SHIPMENT','LABEL_CREATED'],LABEL_CREATED:['LABEL_CREATED','ACCEPTED','IN_TRANSIT','DELIVERY_EXCEPTION'],ACCEPTED:['ACCEPTED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERY_EXCEPTION'],IN_TRANSIT:['IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','DELIVERY_EXCEPTION','RETURNED_TO_SENDER','UNKNOWN_DELAYED'],OUT_FOR_DELIVERY:['OUT_FOR_DELIVERY','DELIVERED','DELIVERY_EXCEPTION','UNKNOWN_DELAYED'],DELIVERY_EXCEPTION:['DELIVERY_EXCEPTION','IN_TRANSIT','OUT_FOR_DELIVERY','RETURNED_TO_SENDER'],UNKNOWN_DELAYED:['UNKNOWN_DELAYED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','DELIVERY_EXCEPTION','RETURNED_TO_SENDER'],DELIVERED:['DELIVERED'],RETURNED_TO_SENDER:['RETURNED_TO_SENDER']};

export function canTransitionShipment(from,to){return !from?['PRE_SHIPMENT','LABEL_CREATED'].includes(to):Boolean(SHIPPING_TRANSITIONS[from]?.includes(to))}
function shipmentBucket(order){const value=order.shipment?.status;if(value==='DELIVERED')return'DELIVERED';if(['DELIVERY_EXCEPTION','RETURNED_TO_SENDER','UNKNOWN_DELAYED'].includes(value))return'EXCEPTION';if(['ACCEPTED','IN_TRANSIT','OUT_FOR_DELIVERY'].includes(value))return'IN_TRANSIT';if(order.status==='APPROVED_FOR_FULFILLMENT'||['PRE_SHIPMENT','LABEL_CREATED'].includes(value))return'READY';return'AWAITING_REVIEW'}
function shippingOrder(order){return{id:String(order._id),number:order.number,status:order.status,paymentStatus:order.paymentStatus,pharmacyReviewStatus:order.pharmacyReviewStatus,prescriptionStatus:order.prescriptionStatus,customer:order.user&&{name:`${order.user.firstName} ${order.user.lastName}`.trim(),email:order.user.email},items:order.items.map(item=>({name:item.name,sku:item.sku,quantity:item.quantity,prescriptionRequired:item.prescriptionRequired})),shippingAddress:order.shippingAddress,shipment:order.shipment||null,bucket:shipmentBucket(order),createdAt:order.createdAt,updatedAt:order.updatedAt}}

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
  const trackingNumber=data.trackingNumber.replace(/\s+/g,'');const trackingOwner=await Order.exists({_id:{$ne:order._id},'shipment.provider':data.provider,'shipment.trackingNumber':trackingNumber});
  if(trackingOwner)throw new AppError('That carrier tracking number is already assigned to another order.',409,'TRACKING_ALREADY_ASSIGNED');
  const now=new Date();order.shipment.provider=data.provider;order.shipment.trackingNumber=trackingNumber;order.shipment.status=data.status;order.shipment.updatedBy=req.user.sub;order.shipment.events.push({status:data.status,description:data.description,occurredAt:now,actor:req.user.sub});
  if(['PRE_SHIPMENT','LABEL_CREATED'].includes(data.status))order.status='FULFILLING';
  if(['ACCEPTED','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERY_EXCEPTION','RETURNED_TO_SENDER','UNKNOWN_DELAYED'].includes(data.status)){order.status='SHIPPED';order.shipment.shippedAt=order.shipment.shippedAt||now}
  if(data.status==='DELIVERED'){order.status='DELIVERED';order.shipment.shippedAt=order.shipment.shippedAt||now;order.shipment.deliveredAt=now}
  await order.save();
  await AuditLog.create({actor:req.user.sub,action:'SHIPMENT_UPDATED',resourceType:'Order',resourceId:String(order._id),requestId:req.id,metadata:{orderNumber:order.number,provider:data.provider,trackingNumber:data.trackingNumber,status:data.status}});
  res.json({success:true,data:shippingOrder(order.toObject()),message:'Shipment timeline updated.'});
}

export async function trackShipment(req,res){
  const {number}=z.object({number:z.string().trim().toUpperCase().regex(/^[A-Z0-9 -]{6,40}$/)}).parse(req.params);const normalized=number.replace(/\s+/g,'');
  const order=await Order.findOne({'shipment.trackingNumber':normalized}).select('shipment').lean();
  if(!order?.shipment?.status)throw new AppError('No shipment was found for that tracking number.',404,'TRACKING_NOT_FOUND');
  const carrierUrls={USPS:`https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(normalized)}`,UPS:`https://www.ups.com/track?tracknum=${encodeURIComponent(normalized)}`,FEDEX:`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(normalized)}`,DHL:`https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(normalized)}`};
  res.json({success:true,data:{provider:order.shipment.provider,trackingNumber:normalized,status:order.shipment.status,events:[...(order.shipment.events||[])].sort((a,b)=>new Date(b.occurredAt)-new Date(a.occurredAt)).map(event=>({status:event.status,description:event.description,occurredAt:event.occurredAt})),carrierUrl:carrierUrls[order.shipment.provider]||null}});
}
