import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  purpose:{type:String,enum:['EMAIL_VERIFY','LOGIN','PASSWORD_RESET'],required:true,index:true},
  codeDigest:{type:String,required:true,select:false},
  expiresAt:{type:Date,required:true},resendAfter:{type:Date,required:true},
  attemptsRemaining:{type:Number,default:5,min:0},consumedAt:Date,actionCompletedAt:Date,
  requestFingerprintHash:{type:String,required:true},deliveryMessageId:String
},{timestamps:true});
schema.index({expiresAt:1},{expireAfterSeconds:0});
schema.index({user:1,purpose:1,createdAt:-1});
export const OtpChallenge=mongoose.model('OtpChallenge',schema);
