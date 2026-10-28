import mongoose from 'mongoose';

export const JOURNEY_STATES=['STARTED','DISCOVERING','EXPLORING','COMPARING','DECIDING','ACTION_REQUIRED','PROCESSING','AWAITING_CUSTOMER','AWAITING_PHARMACY','AWAITING_EXTERNAL','COMPLETED','ARCHIVED','CANCELLED','SUPPORT_REQUIRED'];
export const JOURNEY_TYPES=['PRODUCT','COMPARISON','LEARNING','ORDER','PRESCRIPTION','SUPPORT','GENERAL'];

const eventSchema=new mongoose.Schema({state:{type:String,enum:JOURNEY_STATES,required:true},label:{type:String,required:true,trim:true,maxLength:160},classification:{type:String,enum:['CONFIRMED','PROCESSING','AWAITING_CUSTOMER','AWAITING_PHARMACY','AWAITING_EXTERNAL','ESTIMATED','COMPLETED','FAILED','CANCELLED','UNKNOWN','SUPPORT_REQUIRED'],required:true},createdAt:{type:Date,default:Date.now,immutable:true}},{_id:true});
const schema=new mongoose.Schema({
  customer:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},
  guestTokenHash:{type:String,index:true,select:false},guestExpiresAt:{type:Date,index:true},migratedAt:Date,
  type:{type:String,enum:JOURNEY_TYPES,required:true,index:true},title:{type:String,required:true,trim:true,maxLength:160},
  sourceType:{type:String,enum:['PRODUCT','COMPARISON','ARTICLE','ORDER','PRESCRIPTION','SUPPORT','NONE'],default:'NONE'},sourceId:{type:String,trim:true,maxLength:160,default:''},
  state:{type:String,enum:JOURNEY_STATES,default:'STARTED',index:true},stageLabel:{type:String,trim:true,maxLength:160,default:'Journey started'},
  nextStep:{label:{type:String,trim:true,maxLength:240,default:'Review your journey'},responsibleParty:{type:String,enum:['CUSTOMER','EMBODY','PHARMACY','EXTERNAL','NONE'],default:'CUSTOMER'},classification:{type:String,enum:['CONFIRMED','ESTIMATED','UNKNOWN'],default:'CONFIRMED'}},
  events:{type:[eventSchema],default:[]},lastActivityAt:{type:Date,default:Date.now,index:true},archivedAt:Date
},{timestamps:true});
schema.index({customer:1,state:1,lastActivityAt:-1});
schema.index({guestExpiresAt:1},{expireAfterSeconds:0,partialFilterExpression:{customer:{$exists:false}}});
export const CustomerJourney=mongoose.model('CustomerJourney',schema);
