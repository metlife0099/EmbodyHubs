import { z } from 'zod';
import { AuditLog } from '../models/AuditLog.js';
import { SupportConversation } from '../models/SupportConversation.js';
import { SupportMessage } from '../models/SupportMessage.js';
import { User } from '../models/User.js';
import { sendChatNotificationEmail } from '../services/emailService.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const messageSchema=z.object({body:z.string().trim().min(1,'Enter a message.').max(2000),clientMessageId:z.string().trim().min(12).max(100).regex(/^[a-zA-Z0-9_-]+$/)});
const statusSchema=z.object({status:z.enum(['OPEN','CLOSED'])});
const listSchema=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(50).default(25),status:z.enum(['ALL','OPEN','CLOSED']).default('ALL'),q:z.string().trim().max(100).optional().default('')});

function requireCustomer(req){if(req.user.role!=='CUSTOMER')throw new AppError('Customer chat is available only from a customer account.',403,'FORBIDDEN')}
function customerInfo(user){return{id:String(user._id),name:`${user.firstName} ${user.lastName}`.trim(),firstName:user.firstName,lastName:user.lastName,email:user.email}}
function messageInfo(message){return{id:String(message._id),body:message.body,senderType:message.senderType,createdAt:message.createdAt,readAt:message.readAt||null}}
function conversationInfo(conversation,latestMessage){return{id:String(conversation._id),status:conversation.status,lastMessageAt:conversation.lastMessageAt||conversation.createdAt,lastSenderType:conversation.lastSenderType,adminUnreadCount:conversation.adminUnreadCount||0,customerUnreadCount:conversation.customerUnreadCount||0,customer:conversation.user&&customerInfo(conversation.user),latestMessage:latestMessage?messageInfo(latestMessage):null}}

export async function getCustomerChat(req,res){
  requireCustomer(req);
  const [conversation,user]=await Promise.all([SupportConversation.findOne({user:req.user.sub}).lean(),User.findById(req.user.sub).select('firstName lastName email').lean()]);
  if(!conversation)return res.json({success:true,data:{conversation:null,messages:[],customer:customerInfo(user)}});
  const messages=await SupportMessage.find({conversation:conversation._id}).sort({createdAt:-1}).limit(100).lean();
  res.json({success:true,data:{conversation:conversationInfo({...conversation,user}),messages:messages.reverse().map(messageInfo),customer:customerInfo(user)}});
}

export async function sendCustomerMessage(req,res){
  requireCustomer(req);
  const data=messageSchema.parse(req.body);
  const duplicate=await SupportMessage.findOne({clientMessageId:data.clientMessageId,sender:req.user.sub}).lean();
  if(duplicate)return res.json({success:true,data:{message:messageInfo(duplicate),duplicate:true},message:'Message already received.'});
  const user=await User.findById(req.user.sub).select('firstName lastName email status').lean();
  if(!user||user.status!=='ACTIVE')throw new AppError('Your account is not available.',403,'ACCOUNT_UNAVAILABLE');
  let conversation=await SupportConversation.findOneAndUpdate({user:user._id},{$setOnInsert:{user:user._id,status:'OPEN'}},{new:true,upsert:true,setDefaultsOnInsert:true});
  let message;
  try{message=await SupportMessage.create({conversation:conversation._id,sender:user._id,senderType:'CUSTOMER',body:data.body,clientMessageId:data.clientMessageId,notification:{status:'PENDING'}})}catch(error){if(error?.code===11000){const existing=await SupportMessage.findOne({clientMessageId:data.clientMessageId,sender:user._id}).lean();if(existing)return res.json({success:true,data:{message:messageInfo(existing),duplicate:true},message:'Message already received.'})}throw error}
  conversation=await SupportConversation.findByIdAndUpdate(conversation._id,{$set:{status:'OPEN',closedAt:null,closedBy:null,lastMessageAt:message.createdAt,lastCustomerMessageAt:message.createdAt,lastSenderType:'CUSTOMER'},$inc:{adminUnreadCount:1}},{new:true});
  try{
    const sent=await sendChatNotificationEmail({customerName:`${user.firstName} ${user.lastName}`.trim(),customerEmail:user.email,messageId:String(message._id),receivedAt:message.createdAt});
    await SupportMessage.updateOne({_id:message._id},{$set:{notification:{status:sent.skipped?'SKIPPED':'SENT',providerMessageId:sent.messageId,attemptedAt:new Date()}}});
  }catch(error){logger.warn({err:error,messageId:String(message._id)},'Support chat notification email failed');await SupportMessage.updateOne({_id:message._id},{$set:{notification:{status:'FAILED',attemptedAt:new Date()}}})}
  res.status(201).json({success:true,data:{conversation:conversationInfo({...conversation.toObject(),user}),message:messageInfo(message)},message:'Message sent securely.'});
}

export async function markCustomerChatRead(req,res){
  requireCustomer(req);
  const conversation=await SupportConversation.findOne({user:req.user.sub});
  if(conversation){await Promise.all([SupportMessage.updateMany({conversation:conversation._id,senderType:'ADMIN',readAt:null},{$set:{readAt:new Date()}}),SupportConversation.updateOne({_id:conversation._id},{$set:{customerUnreadCount:0}})])}
  res.json({success:true,message:'Conversation marked as read.'});
}

export async function listAdminChats(req,res){
  const data=listSchema.parse(req.query);const filter={};if(data.status!=='ALL')filter.status=data.status;
  if(data.q){const escaped=data.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const users=await User.find({role:'CUSTOMER',$or:[{firstName:{$regex:escaped,$options:'i'}},{lastName:{$regex:escaped,$options:'i'}},{email:{$regex:escaped,$options:'i'}}]}).select('_id').limit(200).lean();filter.user={$in:users.map(item=>item._id)}}
  const [items,total,unread]=await Promise.all([SupportConversation.find(filter).populate('user','firstName lastName email').sort({lastMessageAt:-1,createdAt:-1}).skip((data.page-1)*data.limit).limit(data.limit).lean(),SupportConversation.countDocuments(filter),SupportConversation.aggregate([{$group:{_id:null,conversations:{$sum:{$cond:[{$gt:['$adminUnreadCount',0]},1,0]}},messages:{$sum:'$adminUnreadCount'}}}])]);
  const latest=await latestMessages(items.map(item=>item._id));
  res.json({success:true,data:items.map(item=>conversationInfo(item,latest.get(String(item._id)))),meta:{page:data.page,limit:data.limit,total,pages:Math.ceil(total/data.limit),unreadConversations:unread[0]?.conversations||0,unreadMessages:unread[0]?.messages||0}});
}

export async function adminChatSummary(_req,res){const unread=await SupportConversation.aggregate([{$group:{_id:null,conversations:{$sum:{$cond:[{$gt:['$adminUnreadCount',0]},1,0]}},messages:{$sum:'$adminUnreadCount'}}}]);res.json({success:true,data:{unreadConversations:unread[0]?.conversations||0,unreadMessages:unread[0]?.messages||0}})}

export async function getAdminChat(req,res){
  const {id}=z.object({id:objectId}).parse(req.params);const conversation=await SupportConversation.findById(id).populate('user','firstName lastName email').lean();if(!conversation)throw new AppError('Conversation not found.',404,'CHAT_NOT_FOUND');
  const messages=await SupportMessage.find({conversation:id}).sort({createdAt:-1}).limit(100).lean();res.json({success:true,data:{conversation:conversationInfo(conversation),messages:messages.reverse().map(messageInfo)}});
}

export async function sendAdminMessage(req,res){
  const {id}=z.object({id:objectId}).parse(req.params);const data=messageSchema.parse(req.body);const conversation=await SupportConversation.findById(id);if(!conversation)throw new AppError('Conversation not found.',404,'CHAT_NOT_FOUND');
  const duplicate=await SupportMessage.findOne({clientMessageId:data.clientMessageId,sender:req.user.sub}).lean();if(duplicate)return res.json({success:true,data:{message:messageInfo(duplicate),duplicate:true},message:'Reply already received.'});
  let message;try{message=await SupportMessage.create({conversation:conversation._id,sender:req.user.sub,senderType:'ADMIN',body:data.body,clientMessageId:data.clientMessageId})}catch(error){if(error?.code===11000){const existing=await SupportMessage.findOne({clientMessageId:data.clientMessageId,sender:req.user.sub}).lean();if(existing)return res.json({success:true,data:{message:messageInfo(existing),duplicate:true},message:'Reply already received.'})}throw error}
  await Promise.all([SupportConversation.updateOne({_id:conversation._id},{$set:{status:'OPEN',closedAt:null,closedBy:null,lastMessageAt:message.createdAt,lastAdminMessageAt:message.createdAt,lastSenderType:'ADMIN'},$inc:{customerUnreadCount:1}}),AuditLog.create({actor:req.user.sub,action:'SUPPORT_CHAT_REPLIED',resourceType:'SupportConversation',resourceId:String(conversation._id),requestId:req.id,metadata:{messageId:String(message._id)}})]);
  res.status(201).json({success:true,data:{message:messageInfo(message)},message:'Reply sent.'});
}

export async function markAdminChatRead(req,res){const {id}=z.object({id:objectId}).parse(req.params);const exists=await SupportConversation.exists({_id:id});if(!exists)throw new AppError('Conversation not found.',404,'CHAT_NOT_FOUND');await Promise.all([SupportMessage.updateMany({conversation:id,senderType:'CUSTOMER',readAt:null},{$set:{readAt:new Date()}}),SupportConversation.updateOne({_id:id},{$set:{adminUnreadCount:0}})]);res.json({success:true,message:'Conversation marked as read.'})}

export async function updateAdminChatStatus(req,res){const {id}=z.object({id:objectId}).parse(req.params);const {status}=statusSchema.parse(req.body);const update=status==='CLOSED'?{status,closedAt:new Date(),closedBy:req.user.sub}:{status,closedAt:null,closedBy:null};const conversation=await SupportConversation.findByIdAndUpdate(id,{$set:update},{new:true}).populate('user','firstName lastName email').lean();if(!conversation)throw new AppError('Conversation not found.',404,'CHAT_NOT_FOUND');await AuditLog.create({actor:req.user.sub,action:`SUPPORT_CHAT_${status}`,resourceType:'SupportConversation',resourceId:id,requestId:req.id});res.json({success:true,data:conversationInfo(conversation),message:`Conversation ${status==='CLOSED'?'closed':'reopened'}.`})}

async function latestMessages(ids){if(!ids.length)return new Map();const rows=await SupportMessage.find({conversation:{$in:ids}}).sort({createdAt:-1}).lean();const map=new Map();for(const row of rows){const key=String(row.conversation);if(!map.has(key))map.set(key,row)}return map}
