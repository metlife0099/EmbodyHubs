import mongoose from 'mongoose';

const audienceSchema=new mongoose.Schema({
  type:{type:String,enum:['ALL_ACTIVE','SYNCED_ACTIVE','SELECTED','GROUP','FILTERED'],required:true,default:'ALL_ACTIVE'},
  subscriberIds:[{type:mongoose.Schema.Types.ObjectId,ref:'NewsletterSubscriber'}],
  group:{type:mongoose.Schema.Types.ObjectId,ref:'SubscriberGroup'},
  filters:{
    syncStatus:{type:String,enum:['ANY','SYNCED','PENDING','FAILED','NOT_CONFIGURED'],default:'ANY'},
    source:{type:String,enum:['ANY','STOREFRONT','ADMIN_IMPORT'],default:'ANY'},
    joinedAfter:Date,
    joinedBefore:Date
  }
},{_id:false});

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,minlength:2,maxlength:120},
  type:{type:String,enum:['UPDATE','ANNOUNCEMENT','ARTICLE','PRODUCT_ARRIVAL','INFORMATION'],required:true,index:true},
  subject:{type:String,required:true,trim:true,minlength:3,maxlength:150},
  previewText:{type:String,trim:true,maxlength:190,default:''},
  content:{
    eyebrow:{type:String,trim:true,maxlength:60,default:''},
    headline:{type:String,required:true,trim:true,minlength:3,maxlength:140},
    body:{type:String,required:true,trim:true,minlength:10,maxlength:12000},
    imageUrl:{type:String,trim:true,maxlength:1000,default:''},
    ctaLabel:{type:String,trim:true,maxlength:50,default:''},
    ctaUrl:{type:String,trim:true,maxlength:1000,default:''}
  },
  audience:{type:audienceSchema,required:true},
  status:{type:String,enum:['DRAFT','QUEUED','PREPARING','SENDING','SENT','FAILED'],default:'DRAFT',index:true},
  recipientCount:{type:Number,min:0,default:0},
  skippedCount:{type:Number,min:0,default:0},
  recipientSnapshot:[{type:mongoose.Schema.Types.ObjectId,ref:'NewsletterSubscriber'}],
  brevo:{listId:Number,importProcessId:Number,campaignId:Number,lastProviderStatus:String},
  stats:{delivered:{type:Number,min:0,default:0},opens:{type:Number,min:0,default:0},clicks:{type:Number,min:0,default:0},hardBounces:{type:Number,min:0,default:0},softBounces:{type:Number,min:0,default:0},unsubscribes:{type:Number,min:0,default:0},complaints:{type:Number,min:0,default:0}},
  failureMessage:{type:String,maxlength:500},
  queuedAt:Date,
  sentAt:Date,
  workerLeaseUntil:Date,
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true});

schema.index({status:1,workerLeaseUntil:1,createdAt:1});
schema.index({createdAt:-1});
export const NewsletterCampaign=mongoose.model('NewsletterCampaign',schema);
