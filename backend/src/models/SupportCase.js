import mongoose from 'mongoose';

const historySchema=new mongoose.Schema({from:String,to:String,event:{type:String,required:true},actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},actorType:{type:String,enum:['CUSTOMER','ADMIN','SYSTEM'],required:true},noteEncrypted:{type:String,select:false},createdAt:{type:Date,default:Date.now}},{_id:true});
const messageSchema=new mongoose.Schema({sender:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},senderType:{type:String,enum:['CUSTOMER','ADMIN'],required:true},bodyEncrypted:{type:String,required:true,select:false},createdAt:{type:Date,default:Date.now},readAt:Date},{_id:true});
const schema=new mongoose.Schema({
  reference:{type:String,required:true,unique:true,index:true},customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},order:{type:mongoose.Schema.Types.ObjectId,ref:'Order',index:true},
  category:{type:String,enum:['ORDER','PAYMENT','DELIVERY','ACCOUNT','PRIVACY','TECHNICAL','OTHER'],required:true,index:true},subject:{type:String,required:true,trim:true,maxLength:160},detailsEncrypted:{type:String,required:true,select:false},
  status:{type:String,enum:['OPEN','WAITING_CUSTOMER','WAITING_INTERNAL','ESCALATED','RESOLVED','CLOSED'],default:'OPEN',index:true},priority:{type:String,enum:['STANDARD','HIGH','URGENT'],default:'STANDARD',index:true},
  assignedTo:{type:mongoose.Schema.Types.ObjectId,ref:'User'},dueAt:{type:Date,index:true},escalationLevel:{type:Number,min:0,max:3,default:0},resolutionEncrypted:{type:String,select:false},resolvedAt:Date,closedAt:Date,
  messages:{type:[messageSchema],default:[]},history:{type:[historySchema],default:[]},lastCustomerMessageAt:Date,lastAdminMessageAt:Date
},{timestamps:true});
schema.index({customer:1,createdAt:-1});schema.index({status:1,dueAt:1});schema.index({assignedTo:1,status:1});
export const SupportCase=mongoose.model('SupportCase',schema);
