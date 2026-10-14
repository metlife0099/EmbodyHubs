import mongoose from 'mongoose';
const schema=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true,index:true},variantId:{type:mongoose.Schema.Types.ObjectId,required:true},sku:{type:String,required:true},delta:{type:Number,required:true},reason:{type:String,required:true},note:{type:String,maxLength:300},reference:String,idempotencyKey:{type:String,unique:true,sparse:true,index:true},actor:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},before:Number,after:Number},{timestamps:true});
schema.index({product:1,createdAt:-1});
export const InventoryAdjustment=mongoose.model('InventoryAdjustment',schema);
