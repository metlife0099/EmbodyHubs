import mongoose from 'mongoose';

const registrySchema=new mongoose.Schema({
  checkedAt:Date,
  outcome:{type:String,enum:['MATCHED','NOT_FOUND','UNAVAILABLE','DISABLED']},
  found:{type:Boolean,default:false},
  enumerationType:String,
  providerName:String,
  taxonomyDescription:String,
  practiceState:String,
  registryLastUpdated:String,
  errorCode:String
},{_id:false});

const addressSchema=new mongoose.Schema({
  line1:{type:String,required:true,trim:true},
  line2:{type:String,trim:true},
  city:{type:String,required:true,trim:true},
  state:{type:String,required:true,match:/^[A-Z]{2}$/},
  postalCode:{type:String,required:true,match:/^\d{5}(?:-\d{4})?$/}
},{_id:false});

const schema=new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,unique:true,index:true},
  status:{type:String,enum:['PENDING_REVIEW','APPROVED','NEEDS_INFORMATION','REJECTED','SUSPENDED'],default:'PENDING_REVIEW',index:true},
  professionType:{type:String,enum:['PHYSICIAN','PHYSICIAN_ASSISTANT','NURSE_PRACTITIONER','PHARMACIST','REGISTERED_NURSE','DENTIST','OTHER'],required:true},
  specialty:{type:String,required:true,trim:true},
  npi:{type:String,required:true,unique:true,index:true,match:/^\d{10}$/},
  licenseNumber:{type:String,required:true,trim:true},
  licenseState:{type:String,required:true,match:/^[A-Z]{2}$/},
  practiceName:{type:String,required:true,trim:true},
  professionalEmail:{type:String,required:true,lowercase:true,trim:true},
  practicePhone:{type:String,required:true,trim:true},
  practiceAddress:{type:addressSchema,required:true},
  intendedUse:{type:String,enum:['PATIENT_EDUCATION','MEDICATION_SAVINGS','PRACTICE_SUPPORT','OTHER'],required:true},
  registry:{type:registrySchema,default:()=>({outcome:'UNAVAILABLE',found:false})},
  submittedAt:{type:Date,required:true},
  reviewedAt:Date,
  reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  reviewNote:{type:String,trim:true,maxlength:1000},
  credentialAttestedAt:{type:Date,required:true},
  noPatientDataAttestedAt:{type:Date,required:true},
  termsAcceptedAt:{type:Date,required:true},
  privacyAcknowledgedAt:{type:Date,required:true}
},{timestamps:true});

schema.index({status:1,submittedAt:-1});
schema.index({professionalEmail:1,status:1});
export const HealthcareProfessional=mongoose.model('HealthcareProfessional',schema);
