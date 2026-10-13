import mongoose from 'mongoose';
const schema=new mongoose.Schema({actor:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},action:{type:String,required:true,index:true},resourceType:String,resourceId:String,requestId:String,ipHash:String,metadata:{type:mongoose.Schema.Types.Mixed}},{timestamps:true});
schema.index({createdAt:-1,action:1});
export const AuditLog=mongoose.model('AuditLog',schema);
