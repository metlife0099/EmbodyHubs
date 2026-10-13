import mongoose from 'mongoose';

const answerSchema=new mongoose.Schema({question:{type:mongoose.Schema.Types.ObjectId,ref:'CartQuestion',required:true},questionRevision:{type:Number,required:true},prompt:{type:String,required:true,maxLength:240},values:{type:[String],default:[]},selectedLabels:{type:[String],default:[]}},{_id:false});
const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  productSlug:{type:String,required:true,match:/^[a-z0-9-]{2,100}$/,index:true},
  answers:{type:[answerSchema],required:true},
  completedAt:{type:Date,default:Date.now},
  retentionExpiresAt:{type:Date,required:true}
},{timestamps:true});
schema.index({retentionExpiresAt:1},{expireAfterSeconds:0});
schema.index({user:1,productSlug:1,createdAt:-1});
export const CartQuestionResponse=mongoose.model('CartQuestionResponse',schema);
