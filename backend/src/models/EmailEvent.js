import mongoose from 'mongoose';
const schema=new mongoose.Schema({messageId:{type:String,index:true},event:{type:String,required:true,index:true},recipientHash:String,occurredAt:Date,payloadHash:{type:String,required:true,unique:true}},{timestamps:true});
schema.index({createdAt:1},{expireAfterSeconds:31536000});
export const EmailEvent=mongoose.model('EmailEvent',schema);
