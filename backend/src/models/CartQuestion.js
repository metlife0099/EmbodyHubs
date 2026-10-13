import mongoose from 'mongoose';

const optionSchema=new mongoose.Schema({value:{type:String,required:true,maxLength:80},label:{type:String,required:true,maxLength:120}},{_id:false});
const schema=new mongoose.Schema({
  key:{type:String,required:true,unique:true,match:/^[a-z0-9-]{2,60}$/},
  prompt:{type:String,required:true,maxLength:240},
  helpText:{type:String,maxLength:300},
  responseType:{type:String,enum:['YES_NO','SINGLE_CHOICE','MULTI_CHOICE'],required:true},
  options:{type:[optionSchema],default:[]},
  required:{type:Boolean,default:true},
  active:{type:Boolean,default:true,index:true},
  productSlugs:{type:[String],default:[]},
  managedProductSlug:{type:String,match:/^[a-z0-9-]{2,100}$/,index:true},
  sortOrder:{type:Number,default:0},
  revision:{type:Number,default:1},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});
schema.index({active:1,sortOrder:1});
export const CartQuestion=mongoose.model('CartQuestion',schema);
