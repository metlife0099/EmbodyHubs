import mongoose from 'mongoose';

export const HEALTH_INFO_GROUPS=['HEALTH_CONDITIONS','MEDICATIONS_TREATMENT','ACCESS_AFFORDABILITY','WELL_BEING'];

const schema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxLength:100},
  slug:{type:String,required:true,unique:true,trim:true,lowercase:true,match:/^[a-z0-9-]+$/},
  description:{type:String,required:true,trim:true,maxLength:400},
  navigationGroup:{type:String,enum:HEALTH_INFO_GROUPS,required:true,index:true},
  accent:{type:String,enum:['TEAL','SAGE','SAND','CLAY','NAVY'],default:'TEAL'},
  sortOrder:{type:Number,default:0,min:0,max:10000},
  active:{type:Boolean,default:true,index:true}
},{timestamps:true});

export const HealthInfoCategory=mongoose.model('HealthInfoCategory',schema);
