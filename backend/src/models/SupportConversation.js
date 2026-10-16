import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true,index:true},
  status:{type:String,enum:['OPEN','CLOSED'],default:'OPEN',index:true},
  lastMessageAt:{type:Date,index:true},
  lastSenderType:{type:String,enum:['CUSTOMER','ADMIN']},
  adminUnreadCount:{type:Number,default:0,min:0},
  customerUnreadCount:{type:Number,default:0,min:0},
  lastCustomerMessageAt:Date,
  lastAdminMessageAt:Date,
  closedAt:Date,
  closedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});
schema.index({status:1,lastMessageAt:-1});
export const SupportConversation=mongoose.model('SupportConversation',schema);
