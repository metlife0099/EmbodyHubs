import { Order } from '../models/Order.js';
import { sendOrderPlacedEmail,sendOrderShippedEmail } from './emailService.js';
import { logger } from '../utils/logger.js';

export async function deliverOrderPlacedNotification(orderId){return deliver(orderId,'orderPlaced',sendOrderPlacedEmail)}
export async function deliverShipmentNotification(orderId){return deliver(orderId,'shipped',sendOrderShippedEmail)}

export function startOrderNotificationWorker({intervalMs=60_000}={}){
  let running=false;const tick=async()=>{if(running)return;running=true;try{await retryFailedNotifications()}catch(error){logger.error({err:error},'Order notification retry failed')}finally{running=false}};
  const initial=setTimeout(tick,5_000);initial.unref?.();const timer=setInterval(tick,intervalMs);timer.unref?.();
  return()=>{clearTimeout(initial);clearInterval(timer)};
}

export async function retryFailedNotifications(limit=20){
  const stale=new Date(Date.now()-5*60*1000);const orders=await Order.find({$or:[{'notifications.orderPlaced.status':'FAILED','notifications.orderPlaced.lastAttemptAt':{$lte:stale}},{'notifications.shipped.status':'FAILED','notifications.shipped.lastAttemptAt':{$lte:stale}}]}).select('_id notifications').sort({'notifications.orderPlaced.lastAttemptAt':1,'notifications.shipped.lastAttemptAt':1}).limit(limit).lean();
  for(const order of orders){if(order.notifications?.orderPlaced?.status==='FAILED')await deliverOrderPlacedNotification(order._id).catch(error=>logger.warn({err:error,orderId:String(order._id)},'Order confirmation retry deferred'));if(order.notifications?.shipped?.status==='FAILED')await deliverShipmentNotification(order._id).catch(error=>logger.warn({err:error,orderId:String(order._id)},'Shipment notification retry deferred'))}
  return orders.length;
}

async function deliver(orderId,type,sender){
  const path=`notifications.${type}`;const stale=new Date(Date.now()-5*60*1000);const claimed=await Order.findOneAndUpdate({_id:orderId,$or:[{[`${path}.status`]:{$exists:false}},{[`${path}.status`]:'PENDING'},{[`${path}.status`]:'FAILED',[`${path}.lastAttemptAt`]:{$lte:stale}},{[`${path}.status`]:'SENDING',[`${path}.lastAttemptAt`]:{$lte:stale}}]},{$set:{[`${path}.status`]:'SENDING',[`${path}.lastAttemptAt`]:new Date()}},{new:true}).populate('user','firstName lastName email emailVerifiedAt');
  if(!claimed)return{skipped:true};
  if(!claimed.user?.emailVerifiedAt){await Order.updateOne({_id:orderId},{$set:{[`${path}.status`]:'FAILED'}});return{skipped:true,reason:'EMAIL_NOT_VERIFIED'}}
  try{const sent=await sender({email:claimed.user.email,name:claimed.user.firstName,order:claimed.toObject()});await Order.updateOne({_id:orderId},{$set:{[`${path}.status`]:'SENT',[`${path}.messageId`]:sent.messageId,[`${path}.sentAt`]:new Date()}});return{sent:true,messageId:sent.messageId}}catch(error){await Order.updateOne({_id:orderId},{$set:{[`${path}.status`]:'FAILED'}});throw error}
}
