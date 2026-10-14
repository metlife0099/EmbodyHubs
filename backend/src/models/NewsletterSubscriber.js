import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  fullName:{type:String,required:true,trim:true,minlength:2,maxlength:100},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true,index:true},
  status:{type:String,enum:['ACTIVE','UNSUBSCRIBED'],default:'ACTIVE',index:true},
  source:{type:String,enum:['STOREFRONT','ADMIN_IMPORT'],default:'STOREFRONT'},
  consentMethod:{type:String,enum:['SUBSCRIBE_BUTTON','ADMIN_IMPORT'],default:'SUBSCRIBE_BUTTON'},
  consentVersion:{type:String,required:true,default:'2026-10-14'},
  consentedAt:{type:Date,required:true},
  lastSubscribedAt:{type:Date,required:true},
  unsubscribedAt:Date,
  brevoSync:{
    status:{type:String,enum:['NOT_CONFIGURED','PENDING','SYNCED','FAILED'],default:'NOT_CONFIGURED'},
    syncedAt:Date,
    lastAttemptAt:Date
  }
},{timestamps:true});

export const NewsletterSubscriber=mongoose.model('NewsletterSubscriber',schema);
