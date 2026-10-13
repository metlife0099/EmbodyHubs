import { CartQuestion } from '../models/CartQuestion.js';
import { CartQuestionResponse } from '../models/CartQuestionResponse.js';
import { Product } from '../models/Product.js';
import { AppError } from '../utils/AppError.js';
import { cartQuestionInputSchema,cartQuestionUpdateSchema,cartResponseSchema,normalizeOptions } from '../schemas/cartQuestionnaire.js';

export async function listCustomerQuestions(req,res){
  const productSlug=String(req.query.productSlug||'').trim();
  if(!/^[a-z0-9-]{2,100}$/.test(productSlug))throw new AppError('A valid product is required.',400,'PRODUCT_REQUIRED');
  const product=await Product.findOne({slug:productSlug,publicationStatus:'PUBLISHED'}).select('cartQuestionnaireEnabled').lean();
  if(!product?.cartQuestionnaireEnabled)return res.json({success:true,data:{enabled:false,questions:[]}});
  const questions=await CartQuestion.find({active:true,$or:[{productSlugs:{$size:0}},{productSlugs:productSlug}]}).sort({sortOrder:1,createdAt:1}).lean();
  res.json({success:true,data:{enabled:true,questions:questions.map(publicQuestion)}});
}

export async function submitCustomerAnswers(req,res){
  const data=cartResponseSchema.parse(req.body);
  const product=await Product.findOne({slug:data.productSlug,publicationStatus:'PUBLISHED'}).select('cartQuestionnaireEnabled').lean();
  if(!product?.cartQuestionnaireEnabled)throw new AppError('This product does not currently require a questionnaire.',409,'QUESTIONNAIRE_DISABLED');
  const questions=await CartQuestion.find({active:true,$or:[{productSlugs:{$size:0}},{productSlugs:data.productSlug}]}).sort({sortOrder:1,createdAt:1}).lean();
  const supplied=new Map(data.answers.map(answer=>[answer.questionId,answer.values]));
  const normalized=[];
  for(const question of questions){
    const values=supplied.get(String(question._id))||[];
    if(question.required&&!values.length)throw new AppError('Please answer every required question.',422,'QUESTION_REQUIRED');
    const allowed=new Set(normalizeOptions(question).map(option=>option.value));
    if(values.some(value=>!allowed.has(value)))throw new AppError('One or more questionnaire answers are invalid.',422,'ANSWER_INVALID');
    if(question.responseType!=='MULTI_CHOICE'&&values.length>1)throw new AppError('Only one answer is allowed for this question.',422,'ANSWER_INVALID');
    const labels=new Map(normalizeOptions(question).map(option=>[option.value,option.label]));
    normalized.push({question:question._id,questionRevision:question.revision,prompt:question.prompt,values,selectedLabels:values.map(value=>labels.get(value))});
  }
  if(data.answers.some(answer=>!questions.some(question=>String(question._id)===answer.questionId)))throw new AppError('The questionnaire changed. Please review it again.',409,'QUESTIONNAIRE_CHANGED');
  const response=await CartQuestionResponse.create({user:req.user.sub,productSlug:data.productSlug,answers:normalized,retentionExpiresAt:new Date(Date.now()+365*864e5)});
  res.status(201).json({success:true,data:{responseId:response.id,completedAt:response.completedAt},message:'Your answers were saved securely.'});
}

export async function listAdminQuestions(_req,res){
  const questions=await CartQuestion.find().sort({sortOrder:1,createdAt:1}).lean();
  res.json({success:true,data:questions.map(question=>({...publicQuestion(question),createdAt:question.createdAt,updatedAt:question.updatedAt}))});
}

export async function createAdminQuestion(req,res){
  const data=cartQuestionInputSchema.parse(req.body);
  const question=await CartQuestion.create({...data,options:normalizeOptions(data),createdBy:req.user.sub,updatedBy:req.user.sub});
  res.status(201).json({success:true,data:publicQuestion(question.toObject())});
}

export async function updateAdminQuestion(req,res){
  const data=cartQuestionUpdateSchema.parse(req.body);
  const current=await CartQuestion.findById(req.params.id);
  if(!current)throw new AppError('Question not found.',404,'QUESTION_NOT_FOUND');
  const merged=cartQuestionInputSchema.parse({...current.toObject(),...data});
  Object.assign(current,merged,{options:normalizeOptions(merged),updatedBy:req.user.sub,revision:current.revision+1});
  await current.save();
  res.json({success:true,data:publicQuestion(current.toObject())});
}

function publicQuestion(question){return{id:String(question._id),key:question.key,prompt:question.prompt,helpText:question.helpText||'',responseType:question.responseType,options:normalizeOptions(question),required:question.required,active:question.active,productSlugs:question.productSlugs||[],sortOrder:question.sortOrder,revision:question.revision}}
