import mongoose from 'mongoose';
const schema=new mongoose.Schema({name:{type:String,required:true},slug:{type:String,required:true,unique:true},description:String,active:{type:Boolean,default:true},sortOrder:{type:Number,default:0}},{timestamps:true});
export const Category=mongoose.model('Category',schema);
