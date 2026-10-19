import mongoose from 'mongoose';

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,minlength:2,maxlength:80},
  nameKey:{type:String,required:true,unique:true,index:true,select:false},
  description:{type:String,trim:true,maxlength:240,default:''},
  subscriberIds:[{type:mongoose.Schema.Types.ObjectId,ref:'NewsletterSubscriber'}],
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true});

schema.index({updatedAt:-1});
export const SubscriberGroup=mongoose.model('SubscriberGroup',schema);
