import mongoose from 'mongoose';

export const CONTROL_GROUPS=['LEGAL_GATE','PRESCRIPTION_WORKFLOW','PARTNER_ROUTING','ORDER_POLICY','PAYMENT_POLICY','MEMBERSHIP','ACCESS','NOTIFICATION','RETENTION','EMERGENCY','COMPLIANCE_RULE','PLATFORM'];
export const CONTROL_STATUSES=['DRAFT','PENDING_APPROVAL','APPROVED','ACTIVE','SUSPENDED','RETIRED'];
const evidenceSchema=new mongoose.Schema({label:{type:String,required:true,trim:true,maxLength:160},url:{type:String,required:true,trim:true,maxLength:800}},{_id:false});
const schema=new mongoose.Schema({
  key:{type:String,required:true,trim:true,uppercase:true,match:/^[A-Z0-9_]{3,100}$/,index:true},
  group:{type:String,enum:CONTROL_GROUPS,required:true,index:true},
  version:{type:Number,required:true,min:1},
  title:{type:String,required:true,trim:true,maxLength:160},
  description:{type:String,required:true,trim:true,maxLength:1200},
  value:{type:mongoose.Schema.Types.Mixed,required:true},
  status:{type:String,enum:CONTROL_STATUSES,default:'DRAFT',index:true},
  reason:{type:String,required:true,trim:true,maxLength:1000},
  evidence:{type:[evidenceSchema],default:[]},
  requiresLegalReview:{type:Boolean,default:false},
  legalReviewConfirmed:{type:Boolean,default:false},
  legalReviewerName:{type:String,trim:true,maxLength:160,default:''},
  owner:{type:String,required:true,trim:true,maxLength:160},
  effectiveAt:Date,
  reviewDueAt:Date,
  previousVersion:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformControl'},
  rollbackOf:{type:mongoose.Schema.Types.ObjectId,ref:'PlatformControl'},
  rollbackAvailable:{type:Boolean,default:true},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  approvedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  approvedAt:Date,
  activatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  activatedAt:Date
},{timestamps:true});
schema.index({key:1,version:1},{unique:true});schema.index({key:1,status:1,activatedAt:-1});
export const PlatformControl=mongoose.model('PlatformControl',schema);
