import mongoose from 'mongoose';

const sourceSchema=new mongoose.Schema({
  label:{type:String,required:true,trim:true,maxLength:160},
  url:{type:String,required:true,trim:true,validate:value=>/^https:\/\//i.test(value)}
},{_id:false});

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxLength:80},
  genericName:{type:String,trim:true,maxLength:120},
  slug:{type:String,required:true,unique:true,index:true,trim:true,lowercase:true},
  tagline:{type:String,trim:true,maxLength:200},
  typicalOnset:{type:String,trim:true,maxLength:160},
  typicalDuration:{type:String,trim:true,maxLength:160},
  frequency:{type:String,trim:true,maxLength:160},
  prescription:{type:String,trim:true,maxLength:160},
  importantConsiderations:{type:String,trim:true,maxLength:700},
  priceLabel:{type:String,trim:true,maxLength:160},
  highlights:{type:[String],default:[]},
  source:{type:sourceSchema,required:true},
  publicationStatus:{type:String,enum:['DRAFT','PUBLISHED','ARCHIVED'],default:'DRAFT',index:true},
  sortOrder:{type:Number,default:0,min:0,max:10000},
  archivedAt:{type:Date}
},{timestamps:true});

schema.index({publicationStatus:1,sortOrder:1,name:1});
export const ComparisonOption=mongoose.model('ComparisonOption',schema);
