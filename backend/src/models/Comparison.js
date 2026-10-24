import mongoose from 'mongoose';

const sourceSchema=new mongoose.Schema({
  label:{type:String,trim:true,maxLength:160,default:''},
  url:{type:String,trim:true,default:'',validate:{validator:value=>!value||/^https:\/\//i.test(value),message:'Source URL must use HTTPS.'}}
},{_id:false});

const itemSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxLength:80},
  genericName:{type:String,trim:true,maxLength:120,default:''},
  tagline:{type:String,trim:true,maxLength:240,default:''},
  typicalOnset:{type:String,trim:true,maxLength:180,default:''},
  typicalDuration:{type:String,trim:true,maxLength:180,default:''},
  frequency:{type:String,trim:true,maxLength:180,default:''},
  prescription:{type:String,trim:true,maxLength:180,default:''},
  importantConsiderations:{type:String,trim:true,maxLength:800,default:''},
  priceLabel:{type:String,trim:true,maxLength:180,default:''},
  highlights:{type:[String],default:[],validate:{validator:value=>value.length<=8,message:'Use no more than 8 highlights.'}},
  source:{type:sourceSchema,default:()=>({})}
});

const schema=new mongoose.Schema({
  purpose:{type:String,required:true,trim:true,maxLength:120},
  slug:{type:String,required:true,unique:true,index:true,trim:true,lowercase:true,maxLength:100},
  intro:{type:String,trim:true,maxLength:320,default:''},
  items:{type:[itemSchema],required:true,validate:{validator:value=>value.length>=2&&value.length<=6,message:'A comparison needs 2 to 6 items.'}},
  publicationStatus:{type:String,enum:['DRAFT','PUBLISHED','ARCHIVED'],default:'DRAFT',index:true},
  sortOrder:{type:Number,default:0,min:0,max:10000},
  archivedAt:{type:Date,default:null}
},{timestamps:true});

schema.index({publicationStatus:1,sortOrder:1,purpose:1});
export const Comparison=mongoose.model('Comparison',schema);
