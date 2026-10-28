import mongoose from 'mongoose';
const schema=new mongoose.Schema({customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},type:{type:String,enum:['PRODUCT','COMPARISON','LEARNING'],required:true,index:true},sourceId:{type:String,required:true,trim:true,maxLength:160},title:{type:String,required:true,trim:true,maxLength:200},url:{type:String,required:true,trim:true,maxLength:400,match:/^\//},summary:{type:String,trim:true,maxLength:500,default:''},explicitlySaved:{type:Boolean,default:true,immutable:true}},{timestamps:true});
schema.index({customer:1,type:1,sourceId:1},{unique:true});
export const SavedItem=mongoose.model('SavedItem',schema);
