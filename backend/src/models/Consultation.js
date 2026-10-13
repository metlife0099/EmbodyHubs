import mongoose from 'mongoose';
import { CONSULTATION_STATES } from '../constants/workflow.js';
const schema=new mongoose.Schema({userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',index:true},productId:{type:mongoose.Schema.Types.ObjectId,ref:'Product'},externalProductId:String,answers:{type:mongoose.Schema.Types.Mixed,required:true,select:false},flags:[{type:String,enum:['URGENT_SYMPTOM','NITRATE_INTERACTION','RIOCIGUAT_INTERACTION','UNCERTAIN_RESPONSE','HIGH_DOSE_REQUEST']}],status:{type:String,enum:CONSULTATION_STATES,default:'AWAITING_CLINICIAN_REVIEW',index:true},privacyConsentAt:{type:Date,required:true},reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewedAt:Date,reviewNote:String},{timestamps:true});
schema.index({createdAt:-1,status:1});
export const Consultation=mongoose.model('Consultation',schema);
