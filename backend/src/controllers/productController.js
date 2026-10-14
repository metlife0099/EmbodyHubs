import { z } from 'zod';
import { Product } from '../models/Product.js';
import { CartQuestion } from '../models/CartQuestion.js';
import { AppError } from '../utils/AppError.js';
import { publicReadiness } from '../services/pharmacyComplianceService.js';

const querySchema=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(48).default(12),q:z.string().max(100).optional(),category:z.string().optional(),sort:z.enum(['newest','price-asc','price-desc','name']).default('newest')});
const managedQuestionSchema=z.object({prompt:z.string().trim().min(5).max(240),helpText:z.string().trim().max(300).optional().default(''),required:z.boolean().default(true),options:z.array(z.object({value:z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),label:z.string().trim().min(1).max(120)})).min(2).max(8)});
const productSchema=z.object({
  name:z.string().trim().min(2).max(160),slug:z.string().trim().regex(/^[a-z0-9-]+$/),activeIngredient:z.string().trim().max(160).optional().default(''),description:z.string().trim().max(3000).optional().default(''),directions:z.string().trim().max(3000).optional().default(''),warnings:z.array(z.string().trim().min(2).max(500)).max(20).default([]),productType:z.enum(['OTC','PRESCRIPTION','WELLNESS','EDUCATIONAL']).default('OTC'),prescriptionRequired:z.boolean().default(false),controlledSubstance:z.boolean().default(false),cartQuestionnaireEnabled:z.boolean().default(false),ndc:z.string().trim().max(20).optional(),manufacturer:z.string().trim().max(120).optional(),authorizedLabelSource:z.url().optional(),images:z.array(z.object({url:z.url().refine(value=>value.startsWith('https://'),'HTTPS is required.'),publicId:z.string(),width:z.number().int().positive().optional(),height:z.number().int().positive().optional(),alt:z.string().min(3).max(160)})).max(8).default([]),publicationStatus:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('DRAFT'),variants:z.array(z.object({sku:z.string().trim().min(2).max(80),dosage:z.string().trim().max(80).optional(),form:z.string().trim().max(80).optional(),packSize:z.string().trim().max(80).optional(),priceCents:z.number().int().nonnegative(),stock:z.number().int().nonnegative(),lowStockThreshold:z.number().int().min(0).max(100000).optional().default(10)})).min(1),cartQuestions:z.array(managedQuestionSchema).max(20).optional()
}).superRefine((data,ctx)=>{
  if(data.cartQuestionnaireEnabled&&(!data.cartQuestions||data.cartQuestions.length===0))ctx.addIssue({code:'custom',path:['cartQuestions'],message:'At least one question is required when the add-to-cart questionnaire is enabled.'});
  data.cartQuestions?.forEach((question,index)=>{const values=question.options.map(option=>option.value);if(new Set(values).size!==values.length)ctx.addIssue({code:'custom',path:['cartQuestions',index,'options'],message:'Option values must be unique within a question.'})});
});

export async function listProducts(req,res){const query=querySchema.parse(req.query);const filter={publicationStatus:'PUBLISHED'};if(query.q)filter.$text={$search:query.q};if(query.category)filter.category=query.category;const sort=query.sort==='name'?{name:1}:query.sort==='price-asc'?{'variants.0.priceCents':1}:query.sort==='price-desc'?{'variants.0.priceCents':-1}:{createdAt:-1};const[items,total]=await Promise.all([Product.find(filter).sort(sort).skip((query.page-1)*query.limit).limit(query.limit).lean(),Product.countDocuments(filter)]);res.json({success:true,data:items,meta:{page:query.page,limit:query.limit,total,pages:Math.ceil(total/query.limit)}})}
export async function getProduct(req,res){const item=await Product.findOne({slug:req.params.slug,publicationStatus:'PUBLISHED'}).lean();if(!item)throw new AppError('Product not found.',404,'PRODUCT_NOT_FOUND');res.json({success:true,data:item})}

export async function listAdminProducts(_req,res){
  const[products,questions]=await Promise.all([Product.find().sort({updatedAt:-1}).lean(),CartQuestion.find({managedProductSlug:{$exists:true}}).sort({sortOrder:1}).lean()]);
  res.json({success:true,data:products.map(product=>({...product,id:String(product._id),cartQuestions:questions.filter(question=>question.managedProductSlug===product.slug).map(question=>({id:String(question._id),prompt:question.prompt,helpText:question.helpText,required:question.required,options:question.options,active:question.active}))}))});
}

export async function saveProduct(req,res){
  const data=productSchema.parse(req.body);const{cartQuestions,...productData}=data;
  if(productData.publicationStatus==='PUBLISHED'&&productData.prescriptionRequired&&!publicReadiness().hasVerifiedBusinessConfiguration)throw new AppError('Prescription products cannot be published until pharmacy licensing and pharmacist contact configuration are verified.',409,'PHARMACY_CONFIGURATION_INCOMPLETE');
  if(productData.controlledSubstance&&!publicReadiness().controlledSubstancesEnabled)throw new AppError('Controlled substances are disabled.',409,'CONTROLLED_SUBSTANCE_DISABLED');
  const previous=req.params.id?await Product.findById(req.params.id).select('slug').lean():null;
  const product=req.params.id?await Product.findByIdAndUpdate(req.params.id,productData,{new:true,runValidators:true}):await Product.create(productData);
  if(!product)throw new AppError('Product not found.',404,'PRODUCT_NOT_FOUND');
  if(cartQuestions){
    if(previous?.slug&&previous.slug!==product.slug)await CartQuestion.updateMany({managedProductSlug:previous.slug},{$set:{active:false,updatedBy:req.user.sub}});
    await CartQuestion.updateMany({managedProductSlug:product.slug},{$set:{active:false,updatedBy:req.user.sub}});
    for(const[sortOrder,questionData]of cartQuestions.entries()){
      const key=`${product.slug}-managed-${sortOrder+1}`;
      const question=await CartQuestion.findOne({key});
      if(question){Object.assign(question,questionData,{responseType:'MULTI_CHOICE',active:product.cartQuestionnaireEnabled,productSlugs:[product.slug],managedProductSlug:product.slug,sortOrder,updatedBy:req.user.sub,revision:question.revision+1});await question.save()}
      else await CartQuestion.create({...questionData,key,responseType:'MULTI_CHOICE',active:product.cartQuestionnaireEnabled,productSlugs:[product.slug],managedProductSlug:product.slug,sortOrder,createdBy:req.user.sub,updatedBy:req.user.sub});
    }
  }
  res.status(req.params.id?200:201).json({success:true,data:product});
}
