import mongoose from 'mongoose';
import argon2 from 'argon2';

const registrationProfileSchema=new mongoose.Schema({
  ageRange:{type:String,enum:['18_29','30_44','45_59','60_PLUS']},
  state:{type:String,match:/^[A-Z]{2}$/},
  serviceGoal:{type:String,enum:['OTC_SHOPPING','MEDICATION_SAFETY','PHARMACIST_QUESTION','EXISTING_PRESCRIPTION']},
  pharmacistSupport:{type:String,enum:['YES','NO','NOT_SURE']}
},{_id:false});

const addressSchema=new mongoose.Schema({
  name:{type:String,trim:true,maxLength:120},
  line1:{type:String,trim:true,maxLength:160},
  line2:{type:String,trim:true,maxLength:160,default:''},
  city:{type:String,trim:true,maxLength:100},
  state:{type:String,match:/^[A-Z]{2}$/},
  postalCode:{type:String,match:/^\d{5}(-\d{4})?$/},
  country:{type:String,enum:['US'],default:'US'}
},{_id:false});

const schema=new mongoose.Schema({
  email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},
  passwordHash:{type:String,required:true,select:false},
  firstName:{type:String,required:true,trim:true,maxLength:60},
  lastName:{type:String,required:true,trim:true,maxLength:60},
  preferredName:{type:String,trim:true,maxLength:60,default:''},
  phone:{type:String,trim:true,maxLength:24,default:''},
  defaultShippingAddress:addressSchema,
  role:{type:String,enum:['CUSTOMER','SUPER_ADMIN','PHARMACY_ADMIN','PHARMACIST','FULFILLMENT','SUPPORT','AUDITOR'],default:'CUSTOMER'},
  permissions:[String],
  emailVerifiedAt:Date,
  adultConfirmedAt:{type:Date,required:true},
  termsAcceptedAt:Date,
  privacyAcknowledgedAt:Date,
  privacyNoticeVersion:String,
  marketingConsentAt:Date,
  marketingRevokedAt:Date,
  registrationProfile:registrationProfileSchema,
  profileUpdatedAt:Date,
  status:{type:String,enum:['PENDING_VERIFICATION','ACTIVE','LOCKED','DISABLED'],default:'PENDING_VERIFICATION'},
  failedLogins:{type:Number,default:0},
  lockedUntil:Date,
  lastLoginAt:Date,
  passwordChangedAt:Date,
  sessionVersion:{type:Number,default:0},
  mfaRequired:{type:Boolean,default:false}
},{timestamps:true});

schema.methods.verifyPassword=function(value){return argon2.verify(this.passwordHash,value)};
schema.statics.hashPassword=value=>argon2.hash(value,{type:argon2.argon2id,memoryCost:19456,timeCost:2,parallelism:1});
export const User=mongoose.model('User',schema);
