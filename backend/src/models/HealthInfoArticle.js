import mongoose from 'mongoose';

const sourceSchema=new mongoose.Schema({label:{type:String,required:true,trim:true,maxLength:180},url:{type:String,required:true,trim:true,maxLength:800}},{_id:false});
const sectionSchema=new mongoose.Schema({heading:{type:String,required:true,trim:true,maxLength:180},paragraphs:{type:[String],default:[]},bullets:{type:[String],default:[]}},{_id:false});
const faqSchema=new mongoose.Schema({question:{type:String,required:true,trim:true,maxLength:240},answer:{type:String,required:true,trim:true,maxLength:1400}},{_id:false});

const schema=new mongoose.Schema({
  title:{type:String,required:true,trim:true,maxLength:180},
  slug:{type:String,required:true,unique:true,trim:true,lowercase:true,match:/^[a-z0-9-]+$/,index:true},
  category:{type:mongoose.Schema.Types.ObjectId,ref:'HealthInfoCategory',required:true,index:true},
  eyebrow:{type:String,trim:true,maxLength:80,default:'Health guide'},
  summary:{type:String,required:true,trim:true,maxLength:420},
  heroImageUrl:{type:String,trim:true,maxLength:1000,default:''},
  heroImageAlt:{type:String,trim:true,maxLength:180,default:''},
  readMinutes:{type:Number,integer:true,min:1,max:60,default:5},
  takeaways:{type:[String],default:[]},
  sections:{type:[sectionSchema],default:[]},
  faq:{type:[faqSchema],default:[]},
  sources:{type:[sourceSchema],default:[]},
  authorName:{type:String,trim:true,maxLength:120,default:'EMBODY Health Editorial Team'},
  reviewerName:{type:String,trim:true,maxLength:160,default:''},
  reviewedAt:{type:Date},
  publishedAt:{type:Date},
  featured:{type:Boolean,default:false,index:true},
  sortOrder:{type:Number,default:0,min:0,max:10000},
  publicationStatus:{type:String,enum:['DRAFT','PUBLISHED','ARCHIVED'],default:'DRAFT',index:true},
  seo:{title:{type:String,trim:true,maxLength:70,default:''},description:{type:String,trim:true,maxLength:170,default:''},keywords:{type:[String],default:[]},noIndex:{type:Boolean,default:false}}
},{timestamps:true});

schema.index({title:'text',summary:'text','seo.keywords':'text'});
schema.index({category:1,publicationStatus:1,sortOrder:1});

export const HealthInfoArticle=mongoose.model('HealthInfoArticle',schema);
