import mongoose from 'mongoose';
const schema=new mongoose.Schema({customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},mode:{type:String,enum:['SAVED','JOURNEY'],required:true},journey:{type:mongoose.Schema.Types.ObjectId,ref:'CustomerJourney'},purpose:{type:String,enum:['PRODUCT_GUIDE','ACCOUNT_GUIDE','JOURNEY_GUIDE'],required:true},transcriptEncrypted:{type:String,required:true,select:false},lastIntent:{type:String,required:true,maxLength:80},expiresAt:{type:Date,required:true,index:true}},{timestamps:true});
schema.index({expiresAt:1},{expireAfterSeconds:0});
export const AssistantConversation=mongoose.model('AssistantConversation',schema);
