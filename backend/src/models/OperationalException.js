import mongoose from 'mongoose';
const actionSchema=new mongoose.Schema({action:{type:String,required:true},actor:{type:mongoose.Schema.Types.ObjectId,ref:'User'},note:{type:String,maxLength:500},createdAt:{type:Date,default:Date.now}},{_id:true});
const schema=new mongoose.Schema({
  fingerprint:{type:String,required:true,unique:true,index:true},type:{type:String,enum:['STALLED_PRESCRIPTION','FAILED_HANDOFF','PARTNER_UNAVAILABLE','ELIGIBILITY_FAILURE','PAYMENT_FAILURE','REFUND','DISPUTE','RECONCILIATION','SECURITY','PRIVACY','SUPPORT_SLA','LICENSE_EXPIRY'],required:true,index:true},
  sourceType:{type:String,required:true},sourceId:{type:String,required:true},reference:{type:String,default:''},title:{type:String,required:true,maxLength:180},summary:{type:String,required:true,maxLength:600},severity:{type:String,enum:['LOW','MEDIUM','HIGH','CRITICAL'],default:'MEDIUM',index:true},status:{type:String,enum:['OPEN','ACKNOWLEDGED','RESOLVED','DISMISSED'],default:'OPEN',index:true},
  owner:{type:mongoose.Schema.Types.ObjectId,ref:'User'},detectedAt:{type:Date,default:Date.now},dueAt:Date,resolvedAt:Date,resolutionNote:{type:String,maxLength:1000},actions:{type:[actionSchema],default:[]}
},{timestamps:true});
schema.index({status:1,severity:1,dueAt:1});schema.index({sourceType:1,sourceId:1});
export const OperationalException=mongoose.model('OperationalException',schema);
