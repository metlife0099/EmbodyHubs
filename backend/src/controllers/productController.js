import mongoose from 'mongoose';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { CartQuestion } from '../models/CartQuestion.js';
import { CartQuestionResponse } from '../models/CartQuestionResponse.js';
import { Order } from '../models/Order.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { publicReadiness } from '../services/pharmacyComplianceService.js';

const querySchema=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(48).default(12),q:z.string().max(100).optional(),category:z.string().optional(),sort:z.enum(['newest','price-asc','price-desc','name']).default('newest')});
const managedQuestionSchema=z.object({prompt:z.string().trim().min(5).max(240),helpText:z.string().trim().max(300).optional().default(''),required:z.boolean().default(true),options:z.array(z.object({value:z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/),label:z.string().trim().min(1).max(120)})).min(2).max(8)});
const categorySchema=z.object({name:z.string().trim().min(2).max(80),slug:z.string().trim().regex(/^[a-z0-9-]+$/).max(80),description:z.string().trim().max(300).optional().default(''),active:z.boolean().default(true),sortOrder:z.number().int().min(0).max(10000).default(0)});
const faqSchema=z.object({question:z.string().trim().min(5).max(240),answer:z.string().trim().min(10).max(1200)});
const variantInputSchema=z.object({_id:z.string().regex(/^[a-f\d]{24}$/i).optional(),label:z.string().trim().max(120).optional().default(''),sku:z.string().trim().min(2).max(80).transform(value=>value.toUpperCase()),dosage:z.string().trim().max(80).optional().default(''),form:z.string().trim().max(80).optional().default(''),packSize:z.string().trim().max(80).optional().default(''),priceCents:z.number().int().nonnegative(),stock:z.number().int().nonnegative(),lowStockThreshold:z.number().int().min(0).max(100000).optional().default(10),active:z.boolean().default(true)});
const priceRuleSchema=z.object({frequency:z.string().trim().min(1).max(60),productSlug:z.string().trim().regex(/^[a-z0-9-]{2,100}$/),variantSku:z.string().trim().min(1).max(100).transform(value=>value.toUpperCase()),doseLabel:z.string().trim().min(1).max(60),shippingLabel:z.string().trim().min(1).max(60),totalPriceCents:z.number().int().min(0).max(100000000)});
export const pricingConfiguratorSchema=z.object({enabled:z.boolean().default(false),eyebrow:z.string().trim().max(60).optional().default('Flexible purchase'),title:z.string().trim().max(120).optional().default('Build your plan'),subtitle:z.string().trim().max(240).optional().default('Choose the options that fit your needs.'),disclaimer:z.string().trim().max(600).optional().default('Prices are estimates based on the selected product, quantity, and delivery interval. Final availability and pricing are confirmed at checkout.'),frequencyOptions:z.array(z.string().trim().min(1).max(60)).min(1).max(8),doseOptions:z.array(z.object({label:z.string().trim().min(1).max(60),quantity:z.number().int().min(1).max(100)})).min(1).max(12),shippingOptions:z.array(z.object({label:z.string().trim().min(1).max(60),months:z.number().int().min(1).max(12)})).min(1).max(8),priceRules:z.array(priceRuleSchema).max(1000).default([])}).superRefine((data,ctx)=>{if(!data.enabled)return;const frequencies=data.frequencyOptions.map(value=>value.toLowerCase());if(new Set(frequencies).size!==frequencies.length)ctx.addIssue({code:'custom',path:['frequencyOptions'],message:'Frequency labels must be unique.'});const doses=data.doseOptions.map(value=>value.label.toLowerCase());if(new Set(doses).size!==doses.length)ctx.addIssue({code:'custom',path:['doseOptions'],message:'Dose labels must be unique.'});const shipping=data.shippingOptions.map(value=>value.label.toLowerCase());if(new Set(shipping).size!==shipping.length)ctx.addIssue({code:'custom',path:['shippingOptions'],message:'Shipping labels must be unique.'});const ruleKeys=data.priceRules.map(rule=>[rule.frequency.toLowerCase(),rule.productSlug,rule.variantSku.toLowerCase(),rule.doseLabel.toLowerCase(),rule.shippingLabel.toLowerCase()].join('|'));if(new Set(ruleKeys).size!==ruleKeys.length)ctx.addIssue({code:'custom',path:['priceRules'],message:'Each pricing combination must be unique.'});for(const[index,rule]of data.priceRules.entries()){if(!data.frequencyOptions.includes(rule.frequency)||!data.doseOptions.some(item=>item.label===rule.doseLabel)||!data.shippingOptions.some(item=>item.label===rule.shippingLabel))ctx.addIssue({code:'custom',path:['priceRules',index],message:'Pricing combinations must use the configured options.'})}});
function matrixKey({frequency,productSlug,variantSku,doseLabel,shippingLabel}){return[frequency,productSlug,String(variantSku).toUpperCase(),doseLabel,shippingLabel].join('|')}
export function pricingMatrixStatus(config,products){
  if(!config.enabled)return{complete:true,expected:0};const targets=products.flatMap(product=>(product.variants||[]).filter(variant=>variant.active!==false).map(variant=>({productSlug:product.slug,variantSku:variant.sku})));const expected=[];
  for(const target of targets)for(const frequency of config.frequencyOptions)for(const dose of config.doseOptions)for(const shipping of config.shippingOptions)expected.push(matrixKey({...target,frequency,doseLabel:dose.label,shippingLabel:shipping.label}));
  const actual=(config.priceRules||[]).map(matrixKey);const actualSet=new Set(actual);return{complete:expected.length>0&&expected.length<=1000&&actual.length===expected.length&&expected.every(key=>actualSet.has(key)),expected:expected.length}
}
const productSchema=z.object({
  name:z.string().trim().min(2).max(160),slug:z.string().trim().regex(/^[a-z0-9-]+$/),category:z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),activeIngredient:z.string().trim().max(160).optional().default(''),description:z.string().trim().max(3000).optional().default(''),directions:z.string().trim().max(3000).optional().default(''),warnings:z.array(z.string().trim().min(2).max(500)).max(20).default([]),careName:z.string().trim().max(100).optional().default(''),headline:z.string().trim().max(240).optional().default(''),summaryPoints:z.array(z.string().trim().min(2).max(180)).max(6).default([]),howItWorks:z.string().trim().max(3000).optional().default(''),pharmacistNote:z.string().trim().max(1500).optional().default(''),faqs:z.array(faqSchema).max(12).default([]),productType:z.enum(['OTC','PRESCRIPTION','WELLNESS','EDUCATIONAL']).default('OTC'),prescriptionRequired:z.boolean().default(false),controlledSubstance:z.boolean().default(false),cartQuestionnaireEnabled:z.boolean().default(false),pricingConfigurator:pricingConfiguratorSchema.optional().default({enabled:false,eyebrow:'Flexible purchase',title:'Build your plan',subtitle:'Choose the options that fit your needs.',disclaimer:'Prices are estimates based on the selected product, quantity, and delivery interval. Final availability and pricing are confirmed at checkout.',frequencyOptions:['Standard use'],doseOptions:[{label:'1 item',quantity:1}],shippingOptions:[{label:'One-time delivery',months:1}],priceRules:[]}),ndc:z.string().trim().max(20).optional(),manufacturer:z.string().trim().max(120).optional(),authorizedLabelSource:z.url().optional(),images:z.array(z.object({url:z.url().refine(value=>value.startsWith('https://'),'HTTPS is required.'),publicId:z.string(),width:z.number().int().positive().optional(),height:z.number().int().positive().optional(),alt:z.string().min(3).max(160)})).max(8).default([]),publicationStatus:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('DRAFT'),variants:z.array(variantInputSchema).min(1).max(50),seo:z.object({title:z.string().trim().max(70).optional().default(''),description:z.string().trim().max(170).optional().default(''),noIndex:z.boolean().default(false)}).optional(),cartQuestions:z.array(managedQuestionSchema).max(20).optional()
}).superRefine((data,ctx)=>{
  if(data.publicationStatus==='PUBLISHED'&&!data.category)ctx.addIssue({code:'custom',path:['category'],message:'Choose a dropdown category before publishing this product.'});
  if(data.cartQuestionnaireEnabled&&(!data.cartQuestions||data.cartQuestions.length===0))ctx.addIssue({code:'custom',path:['cartQuestions'],message:'At least one question is required when the add-to-cart questionnaire is enabled.'});
  data.cartQuestions?.forEach((question,index)=>{const values=question.options.map(option=>option.value);if(new Set(values).size!==values.length)ctx.addIssue({code:'custom',path:['cartQuestions',index,'options'],message:'Option values must be unique within a question.'})});
  const skus=data.variants.map(variant=>variant.sku.toUpperCase());
  if(new Set(skus).size!==skus.length)ctx.addIssue({code:'custom',path:['variants'],message:'Every product option must have a unique SKU.'});
  if(data.publicationStatus==='PUBLISHED'&&!data.variants.some(variant=>variant.active))ctx.addIssue({code:'custom',path:['variants'],message:'Published products need at least one active option.'});
});

export async function listProducts(req,res){const query=querySchema.parse(req.query);const filter={publicationStatus:'PUBLISHED'};if(query.q)filter.$text={$search:query.q};if(query.category){const category=await Category.findOne({slug:query.category,active:true}).select('_id').lean();if(!category)return res.json({success:true,data:[],meta:{page:query.page,limit:query.limit,total:0,pages:0}});filter.category=category._id}const sort=query.sort==='name'?{name:1}:query.sort==='price-asc'?{'variants.0.priceCents':1}:query.sort==='price-desc'?{'variants.0.priceCents':-1}:{createdAt:-1};const[items,total]=await Promise.all([Product.find(filter).populate('category','name slug description active sortOrder').sort(sort).skip((query.page-1)*query.limit).limit(query.limit).lean(),Product.countDocuments(filter)]);res.json({success:true,data:items,meta:{page:query.page,limit:query.limit,total,pages:Math.ceil(total/query.limit)}})}
export async function getProduct(req,res){const item=await Product.findOne({slug:req.params.slug,publicationStatus:'PUBLISHED'}).populate('category','name slug description active sortOrder').lean();if(!item)throw new AppError('Product not found.',404,'PRODUCT_NOT_FOUND');res.json({success:true,data:item})}

export async function listCategories(_req,res){const data=await Category.find({active:true}).sort({sortOrder:1,name:1}).lean();res.json({success:true,data:data.map(item=>({...item,id:String(item._id)}))})}
export async function listAdminCategories(_req,res){const categories=await Category.find().sort({sortOrder:1,name:1}).lean();const counts=await Product.aggregate([{$match:{category:{$ne:null}}},{$group:{_id:'$category',count:{$sum:1}}}]);const countMap=new Map(counts.map(item=>[String(item._id),item.count]));res.json({success:true,data:categories.map(item=>({...item,id:String(item._id),productCount:countMap.get(String(item._id))||0}))})}
export async function saveCategory(req,res){const data=categorySchema.parse(req.body);const id=req.params.id?z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id):null;const duplicate=await Category.exists({slug:data.slug,...(id?{_id:{$ne:id}}:{})});if(duplicate)throw new AppError('That category slug is already in use.',409,'CATEGORY_SLUG_EXISTS');const category=id?await Category.findByIdAndUpdate(id,data,{new:true,runValidators:true}):await Category.create(data);if(!category)throw new AppError('Category not found.',404,'CATEGORY_NOT_FOUND');await AuditLog.create({actor:req.user.sub,action:id?'CATEGORY_UPDATED':'CATEGORY_CREATED',resourceType:'Category',resourceId:String(category._id),requestId:req.id,metadata:{name:category.name,slug:category.slug}});res.status(id?200:201).json({success:true,data:{...category.toObject(),id:String(category._id)}})}
export async function removeCategory(req,res){const id=z.string().regex(/^[a-f\d]{24}$/i).parse(req.params.id);const category=await Category.findById(id);if(!category)throw new AppError('Category not found.',404,'CATEGORY_NOT_FOUND');const inUse=await Product.exists({category:category._id});if(inUse){category.active=false;await category.save();await AuditLog.create({actor:req.user.sub,action:'CATEGORY_ARCHIVED',resourceType:'Category',resourceId:String(category._id),requestId:req.id,metadata:{name:category.name}});return res.json({success:true,message:'This category contains products, so it was hidden from the dropdown instead of deleted.'})}await category.deleteOne();await AuditLog.create({actor:req.user.sub,action:'CATEGORY_DELETED',resourceType:'Category',resourceId:String(category._id),requestId:req.id,metadata:{name:category.name}});res.json({success:true,message:'Category deleted.'})}

export async function listAdminProducts(_req,res){
  const[products,questions]=await Promise.all([Product.find().populate('category','name slug description active sortOrder').sort({updatedAt:-1}).lean(),CartQuestion.find({managedProductSlug:{$exists:true}}).sort({sortOrder:1}).lean()]);
  res.json({success:true,data:products.map(product=>({...product,id:String(product._id),cartQuestions:questions.filter(question=>question.managedProductSlug===product.slug).map(question=>({id:String(question._id),prompt:question.prompt,helpText:question.helpText,required:question.required,options:question.options,active:question.active}))}))});
}

export async function saveProduct(req,res){
  const data=productSchema.parse(req.body);const{cartQuestions,...productData}=data;
  if(productData.category){const category=await Category.findById(productData.category).select('active').lean();if(!category)throw new AppError('Choose a valid dropdown category.',422,'CATEGORY_INVALID');if(productData.publicationStatus==='PUBLISHED'&&!category.active)throw new AppError('Published products must use a visible dropdown category.',409,'CATEGORY_INACTIVE')}
  if(productData.pricingConfigurator.enabled){const related=await Product.find({category:productData.category,publicationStatus:'PUBLISHED',...(req.params.id?{_id:{$ne:req.params.id}}:{})}).select('slug variants').lean();const matrix=pricingMatrixStatus(productData.pricingConfigurator,[{slug:productData.slug,variants:productData.variants},...related]);if(!matrix.complete)throw new AppError(`Configure an exact price for all ${matrix.expected} flexible-pricing combinations.`,422,'PRICING_MATRIX_INCOMPLETE')}
  if(productData.publicationStatus==='PUBLISHED'&&productData.prescriptionRequired&&!publicReadiness().hasVerifiedBusinessConfiguration)throw new AppError('Prescription products cannot be published until pharmacy licensing and pharmacist contact configuration are verified.',409,'PHARMACY_CONFIGURATION_INCOMPLETE');
  if(productData.controlledSubstance&&!publicReadiness().controlledSubstancesEnabled)throw new AppError('Controlled substances are disabled.',409,'CONTROLLED_SUBSTANCE_DISABLED');
  const duplicateSku=await Product.exists({'variants.sku':{$in:productData.variants.map(variant=>variant.sku)},...(req.params.id?{_id:{$ne:req.params.id}}:{})});
  if(duplicateSku)throw new AppError('One or more SKUs are already assigned to another product.',409,'SKU_EXISTS');
  const previous=req.params.id?await Product.findById(req.params.id).select('slug variants').lean():null;
  if(previous){
    const retainedIds=new Set(productData.variants.map(variant=>variant._id).filter(Boolean));
    const removedIds=previous.variants.map(variant=>String(variant._id)).filter(variantId=>!retainedIds.has(variantId));
    if(removedIds.length){const[orders,inventory]=await Promise.all([Order.exists({'items.product':previous._id,'items.variantId':{$in:removedIds}}),InventoryAdjustment.exists({product:previous._id,variantId:{$in:removedIds}})]);if(orders||inventory)throw new AppError('A variant with order or inventory history cannot be removed. Mark it inactive instead.',409,'VARIANT_HISTORY_EXISTS')}
    const currentVariants=new Map(previous.variants.map(variant=>[String(variant._id),variant]));
    productData.variants=productData.variants.map(variant=>{const current=variant._id?currentVariants.get(variant._id):null;const reserved=current?.reserved||0;if(variant.stock<reserved)throw new AppError(`${variant.sku} has ${reserved} reserved units and cannot be reduced below that amount.`,409,'STOCK_BELOW_RESERVED');return{...variant,reserved}});
  }
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

export function productRemovalMode({orders=false,inventory=false,responses=false}){return orders||inventory||responses?'ARCHIVED':'DELETED'}

export async function removeProduct(req,res){
  const{id}=z.object({id:z.string().regex(/^[a-f\d]{24}$/i)}).parse(req.params);const session=await mongoose.startSession();let result;
  try{
    await session.withTransaction(async()=>{
      const product=await Product.findById(id).session(session);
      if(!product)throw new AppError('Product not found.',404,'PRODUCT_NOT_FOUND');
      const[orders,inventory,responses]=await Promise.all([Order.exists({'items.product':product._id}).session(session),InventoryAdjustment.exists({product:product._id}).session(session),CartQuestionResponse.exists({productSlug:product.slug}).session(session)]);
      const mode=productRemovalMode({orders:Boolean(orders),inventory:Boolean(inventory),responses:Boolean(responses)});
      if(mode==='ARCHIVED'){
        product.publicationStatus='ARCHIVED';product.cartQuestionnaireEnabled=false;product.variants.forEach(variant=>{variant.active=false});await product.save({session});
        await CartQuestion.updateMany({managedProductSlug:product.slug},{$set:{active:false,updatedBy:req.user.sub}},{session});
      }else{
        await CartQuestion.deleteMany({managedProductSlug:product.slug},{session});await Product.deleteOne({_id:product._id},{session});
      }
      await AuditLog.create([{actor:req.user.sub,action:mode==='ARCHIVED'?'PRODUCT_ARCHIVED':'PRODUCT_DELETED',resourceType:'Product',resourceId:String(product._id),requestId:req.id,metadata:{name:product.name,slug:product.slug,reason:mode==='ARCHIVED'?'Historical records retained':'Unused catalog record removed'}}],{session});
      result={id:String(product._id),mode};
    });
  }finally{await session.endSession()}
  res.json({success:true,data:result,message:result.mode==='ARCHIVED'?'Product has order, inventory, or questionnaire history, so it was safely archived.':'Unused product was permanently deleted.'});
}
