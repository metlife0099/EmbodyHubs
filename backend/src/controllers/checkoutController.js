import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { CartQuestion } from '../models/CartQuestion.js';
import { CartQuestionResponse } from '../models/CartQuestionResponse.js';
import { Order } from '../models/Order.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';
import { verifyCompletedPayment } from '../services/paymentService.js';

const planSelectionSchema=z.object({sourceProductSlug:z.string().regex(/^[a-z0-9-]{2,100}$/),dosingFrequency:z.string().trim().min(1).max(60),doseLabel:z.string().trim().min(1).max(60),shippingFrequency:z.string().trim().min(1).max(60),shippingMonths:z.number().int().min(1).max(12)});
const checkoutSchema=z.object({items:z.array(z.object({productSlug:z.string().regex(/^[a-z0-9-]{2,100}$/),variantId:z.string().regex(/^[a-f\d]{24}$/i).optional(),quantity:z.number().int().min(1).max(100),questionnaireResponseId:z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),planSelection:planSelectionSchema.optional()})).min(1).max(40),shippingAddress:z.object({name:z.string().trim().min(2).max(120),line1:z.string().trim().min(3).max(160),line2:z.string().trim().max(160).optional().default(''),city:z.string().trim().min(2).max(100),state:z.string().regex(/^[A-Z]{2}$/),postalCode:z.string().regex(/^\d{5}(-\d{4})?$/),country:z.literal('US').default('US')}),paymentConfirmationId:z.string().min(3).max(200)}).superRefine((data,ctx)=>{const keys=data.items.map(item=>`${item.productSlug}:${item.variantId||''}`);if(new Set(keys).size!==keys.length)ctx.addIssue({code:'custom',path:['items'],message:'Each product option may appear only once per checkout.'})});

export function selectCheckoutVariant(product,{variantId,quantity}){
  const active=(product.variants||[]).filter(variant=>variant.active!==false);
  const variant=variantId?active.find(item=>String(item._id)===String(variantId)):active.length===1?active[0]:null;
  if(!variant)return{error:variantId?'VARIANT_UNAVAILABLE':'VARIANT_SELECTION_REQUIRED'};
  if(variant.stock<quantity)return{error:'INSUFFICIENT_STOCK',variant};
  return{variant};
}

export function variantDisplayName(variant){return variant.label||[variant.dosage,variant.form,variant.packSize].filter(Boolean).join(' · ')||variant.sku}

export async function createCheckoutOrder(req,res){
  const idempotencyKey=String(req.get('idempotency-key')||'');
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(idempotencyKey))throw new AppError('A valid idempotency key is required.',400,'IDEMPOTENCY_KEY_REQUIRED');
  const existing=await Order.findOne({idempotencyKey,user:req.user.sub}).lean();
  if(existing)return res.json({success:true,data:publicOrder(existing),message:'Order already processed.'});
  const data=checkoutSchema.parse(req.body);const slugs=[...new Set(data.items.map(item=>item.productSlug))];const sourceSlugs=data.items.map(item=>item.planSelection?.sourceProductSlug).filter(Boolean);const products=await Product.find({slug:{$in:[...new Set([...slugs,...sourceSlugs])]},publicationStatus:'PUBLISHED'}).lean();
  if(slugs.some(slug=>!products.some(product=>product.slug===slug)))throw new AppError('One or more products are unavailable.',409,'PRODUCT_UNAVAILABLE');
  const orderItems=[];
  for(const requested of data.items){
    const product=products.find(item=>item.slug===requested.productSlug);const selection=selectCheckoutVariant(product,requested);const variant=selection.variant;
    if(selection.error==='VARIANT_SELECTION_REQUIRED')throw new AppError(`Choose an option for ${product.name} before checkout.`,409,'VARIANT_SELECTION_REQUIRED');
    if(selection.error==='VARIANT_UNAVAILABLE')throw new AppError(`The selected ${product.name} option is no longer available.`,409,'VARIANT_UNAVAILABLE');
    if(selection.error==='INSUFFICIENT_STOCK')throw new AppError(`${product.name} (${variantDisplayName(variant)}) does not have enough available stock.`,409,'INSUFFICIENT_STOCK');
    if(product.prescriptionRequired)throw new AppError('Prescription checkout remains disabled.',409,'PRESCRIPTION_CHECKOUT_DISABLED');
    const planSelection=validatePlanSelection(requested,product,products,variant);
    let questionnaire;
    if(product.cartQuestionnaireEnabled){
      if(!requested.questionnaireResponseId)throw new AppError(`Complete the questions for ${product.name} before checkout.`,409,'QUESTIONNAIRE_REQUIRED');
      const response=await CartQuestionResponse.findOne({_id:requested.questionnaireResponseId,user:req.user.sub,productSlug:product.slug,completedAt:{$gte:new Date(Date.now()-24*60*60*1000)}}).lean();
      if(!response)throw new AppError(`The answers for ${product.name} are missing or expired.`,409,'QUESTIONNAIRE_EXPIRED');
      const current=await CartQuestion.find({active:true,$or:[{productSlugs:{$size:0}},{productSlugs:product.slug}]}).select('_id revision').lean();
      if(current.some(question=>!response.answers.some(answer=>String(answer.question)===String(question._id)&&answer.questionRevision===question.revision)))throw new AppError(`The questions for ${product.name} changed. Please answer them again.`,409,'QUESTIONNAIRE_CHANGED');
      questionnaire={response:response._id,completedAt:response.completedAt,answers:response.answers.map(answer=>({questionRevision:answer.questionRevision,prompt:answer.prompt,selectedLabels:answer.selectedLabels}))};
    }
    const lineTotalCents=planSelection?.totalPriceCents??variant.priceCents*requested.quantity;
    orderItems.push({product:product._id,productSlug:product.slug,variantId:variant._id,name:product.name,sku:variant.sku,variantLabel:variantDisplayName(variant),dosage:variant.dosage||'',form:variant.form||'',packSize:variant.packSize||'',quantity:requested.quantity,unitPriceCents:variant.priceCents,lineTotalCents,prescriptionRequired:false,questionnaire,planSelection});
  }
  const subtotalCents=orderItems.reduce((sum,item)=>sum+item.lineTotalCents,0);const shippingCents=subtotalCents>=5000?0:600;const taxCents=0;const totalCents=subtotalCents+shippingCents;
  const payment=await verifyCompletedPayment({confirmationId:data.paymentConfirmationId,amountCents:totalCents});
  const session=await mongoose.startSession();let order;
  try{
    await session.withTransaction(async()=>{
      const duplicate=await Order.findOne({idempotencyKey,user:req.user.sub}).session(session);
      if(duplicate){order=duplicate;return}
      for(const item of orderItems){
        const previous=await Product.findOneAndUpdate({_id:item.product,variants:{$elemMatch:{_id:item.variantId,stock:{$gte:item.quantity}}}},{$inc:{'variants.$.stock':-item.quantity}},{new:false,session});
        if(!previous)throw new AppError(`${item.name} no longer has enough available stock.`,409,'INSUFFICIENT_STOCK');
        const variant=previous.variants.id(item.variantId);const after=variant.stock-item.quantity;
        await InventoryAdjustment.create([{product:item.product,variantId:item.variantId,sku:item.sku,delta:-item.quantity,reason:'ORDER_ALLOCATION',reference:idempotencyKey,idempotencyKey:`order-${idempotencyKey}-${item.variantId}`,actor:req.user.sub,before:variant.stock,after}],{session});
      }
      [order]=await Order.create([{number:`EH-${crypto.randomInt(100000,999999)}`,user:req.user.sub,items:orderItems,status:'PAID_REVIEW_REQUIRED',paymentStatus:'SUCCEEDED',payment,currency:'usd',subtotalCents,taxCents,shippingCents,totalCents,idempotencyKey,shippingAddress:data.shippingAddress}],{session});
      await AuditLog.create([{actor:req.user.sub,action:'ORDER_CREATED',resourceType:'Order',resourceId:String(order._id),requestId:req.id,metadata:{orderNumber:order.number,itemCount:orderItems.length,totalCents}}],{session});
    });
  }finally{await session.endSession()}
  res.status(201).json({success:true,data:publicOrder(order.toObject()),message:'Payment confirmed, inventory allocated, and order created.'});
}

function publicOrder(order){return{id:String(order._id),number:order.number,status:order.status,paymentStatus:order.paymentStatus,totalCents:order.totalCents,createdAt:order.createdAt}}

export function validatePlanSelection(requested,product,products,selectedVariant){
  if(!requested.planSelection)return undefined;
  const plan=requested.planSelection;const source=products.find(item=>item.slug===plan.sourceProductSlug);const config=source?.pricingConfigurator;
  if(!source||!config?.enabled||String(source.category)!==String(product.category))throw new AppError('This purchase plan is no longer available.',409,'PLAN_UNAVAILABLE');
  const dose=config.doseOptions?.find(item=>item.label===plan.doseLabel&&item.quantity===requested.quantity);
  const shipping=config.shippingOptions?.find(item=>item.label===plan.shippingFrequency&&item.months===plan.shippingMonths);
  if(!config.frequencyOptions?.includes(plan.dosingFrequency)||!dose||!shipping)throw new AppError('The selected purchase plan changed. Please choose your options again.',409,'PLAN_CHANGED');
  const variant=selectedVariant||product.variants?.find(item=>String(item._id)===String(requested.variantId));const priceRules=config.priceRules||[];const priceRule=priceRules.find(rule=>rule.frequency===plan.dosingFrequency&&rule.productSlug===product.slug&&rule.variantSku===String(variant?.sku||'').toUpperCase()&&rule.doseLabel===dose.label&&rule.shippingLabel===shipping.label);
  if(priceRules.length&&!priceRule)throw new AppError('Pricing for this combination is unavailable. Please choose another option.',409,'PLAN_PRICE_UNAVAILABLE');
  return{sourceProductSlug:source.slug,dosingFrequency:plan.dosingFrequency,doseLabel:dose.label,shippingFrequency:shipping.label,shippingMonths:shipping.months,totalPriceCents:priceRule?.totalPriceCents};
}
