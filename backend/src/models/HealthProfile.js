import mongoose from 'mongoose';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true,index:true},encryptedPayload:{type:String,required:true},consentVersion:String,consentedAt:Date,lastReviewedAt:Date},{timestamps:true,collection:'health_profiles'});
export const HealthProfile=mongoose.model('HealthProfile',schema);
