import mongoose from 'mongoose';

const notificationSchema=new mongoose.Schema({status:{type:String,enum:['PENDING','SENT','FAILED','SKIPPED']},providerMessageId:String,attemptedAt:Date},{_id:false});
const schema=new mongoose.Schema({
  conversation:{type:mongoose.Schema.Types.ObjectId,ref:'SupportConversation',required:true,index:true},
  sender:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  senderType:{type:String,enum:['CUSTOMER','ADMIN'],required:true},
  body:{type:String,required:true,trim:true,maxlength:2000},
  clientMessageId:{type:String,required:true},
  readAt:Date,
  notification:notificationSchema
},{timestamps:true});
schema.index({conversation:1,createdAt:-1});
schema.index({sender:1,clientMessageId:1},{unique:true});
export const SupportMessage=mongoose.model('SupportMessage',schema);
