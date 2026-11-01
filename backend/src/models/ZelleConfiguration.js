import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  key:{type:String,default:'PRIMARY',unique:true,immutable:true},
  enabled:{type:Boolean,default:false,index:true},
  demoOnly:{type:Boolean,default:false},
  businessUseConfirmed:{type:Boolean,default:false},
  businessDisplayName:{type:String,trim:true,maxLength:120,default:''},
  recipientType:{type:String,enum:['EMAIL','PHONE','TAG'],default:'EMAIL'},
  recipientEncrypted:{type:String,select:false},
  recipientFingerprint:{type:String,select:false,index:true},
  recipientLast4:{type:String,maxLength:4,default:''},
  qrImageUrl:{type:String,trim:true,maxLength:500,default:''},
  qrBankProvided:{type:Boolean,default:false},
  qrVerifiedAt:Date,
  instructions:{type:String,trim:true,maxLength:1200,default:'Open Zelle in your eligible banking app, confirm the business recipient, and enter the exact amount shown on this order.'},
  verificationMode:{type:String,enum:['MANUAL_BANK_RECONCILIATION'],default:'MANUAL_BANK_RECONCILIATION'},
  expiresMinutes:{type:Number,min:15,max:1440,default:60},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});

export const ZelleConfiguration=mongoose.model('ZelleConfiguration',schema);
