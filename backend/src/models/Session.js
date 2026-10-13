import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  tokenHash:{type:String,required:true,unique:true,select:false},
  csrfHash:{type:String,required:true,select:false},
  userAgentHash:String,ipHash:String,lastUsedAt:{type:Date,default:Date.now},
  expiresAt:{type:Date,required:true,index:true},revokedAt:Date,replacedBy:String
},{timestamps:true});
schema.index({expiresAt:1},{expireAfterSeconds:0});
schema.index({user:1,revokedAt:1});
export const Session=mongoose.model('Session',schema);
