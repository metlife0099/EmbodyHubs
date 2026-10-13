import mongoose from 'mongoose';
import argon2 from 'argon2';
const schema=new mongoose.Schema({email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},passwordHash:{type:String,required:true,select:false},firstName:{type:String,required:true,trim:true},lastName:{type:String,required:true,trim:true},role:{type:String,enum:['CUSTOMER','SUPER_ADMIN','PHARMACY_ADMIN','PHARMACIST','CLINICIAN','FULFILLMENT','SUPPORT','AUDITOR'],default:'CUSTOMER'},permissions:[String],emailVerifiedAt:Date,adultConfirmedAt:{type:Date,required:true},marketingConsentAt:Date,status:{type:String,enum:['ACTIVE','LOCKED','DISABLED'],default:'ACTIVE'},failedLogins:{type:Number,default:0},lockedUntil:Date,lastLoginAt:Date},{timestamps:true});
schema.methods.verifyPassword=function(value){return argon2.verify(this.passwordHash,value)};
schema.statics.hashPassword=value=>argon2.hash(value,{type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1});
export const User=mongoose.model('User',schema);
