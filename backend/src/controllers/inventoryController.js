import mongoose from 'mongoose';
import { z } from 'zod';
import { Product } from '../models/Product.js';
import { InventoryAdjustment } from '../models/InventoryAdjustment.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const inventoryQuery=z.object({page:z.coerce.number().int().positive().default(1),limit:z.coerce.number().int().min(1).max(100).default(25),q:z.string().trim().max(100).optional().default(''),status:z.enum(['ALL','IN_STOCK','LOW_STOCK','OUT_OF_STOCK']).default('ALL')});
const adjustmentSchema=z.object({delta:z.number().int().min(-100000).max(100000).refine(value=>value!==0,'Quantity change cannot be zero.'),reason:z.enum(['RECEIPT','RETURN','DAMAGE','EXPIRED','CYCLE_COUNT','MANUAL_CORRECTION']),note:z.string().trim().max(300).optional().default(''),reference:z.string().trim().max(120).optional().default('')});

export function inventoryStatus(stock,reserved,threshold){const available=Math.max(0,stock-reserved);return available===0?'OUT_OF_STOCK':available<=threshold?'LOW_STOCK':'IN_STOCK'}

export async function listInventory(req,res){
  const query=inventoryQuery.parse(req.query);
  const escaped=query.q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const products=await Product.find(query.q?{$or:[{name:{$regex:escaped,$options:'i'}},{slug:{$regex:escaped,$options:'i'}},{'variants.sku':{$regex:escaped,$options:'i'}}]}:{}).select('name slug publicationStatus variants updatedAt').sort({name:1}).lean();
  let rows=products.flatMap(product=>product.variants.map(variant=>{const threshold=variant.lowStockThreshold??10;const available=Math.max(0,variant.stock-(variant.reserved||0));return{id:`${product._id}:${variant._id}`,productId:String(product._id),variantId:String(variant._id),productName:product.name,slug:product.slug,publicationStatus:product.publicationStatus,sku:variant.sku,dosage:variant.dosage||'',form:variant.form||'',packSize:variant.packSize||'',active:variant.active!==false,stock:variant.stock,reserved:variant.reserved||0,available,lowStockThreshold:threshold,status:inventoryStatus(variant.stock,variant.reserved||0,threshold),updatedAt:product.updatedAt}}));
  if(query.status!=='ALL')rows=rows.filter(row=>row.status===query.status);
  rows.sort((a,b)=>a.available-b.available||a.productName.localeCompare(b.productName));
  const total=rows.length;const start=(query.page-1)*query.limit;
  const allRows=products.flatMap(product=>product.variants.map(variant=>({stock:variant.stock,reserved:variant.reserved||0,threshold:variant.lowStockThreshold??10})));
  const metrics={variants:allRows.length,availableUnits:allRows.reduce((sum,item)=>sum+Math.max(0,item.stock-item.reserved),0),lowStock:allRows.filter(item=>inventoryStatus(item.stock,item.reserved,item.threshold)==='LOW_STOCK').length,outOfStock:allRows.filter(item=>inventoryStatus(item.stock,item.reserved,item.threshold)==='OUT_OF_STOCK').length};
  const adjustments=await InventoryAdjustment.find().populate('product','name').populate('actor','firstName lastName').sort({createdAt:-1}).limit(12).lean();
  res.json({success:true,data:rows.slice(start,start+query.limit),metrics,recentAdjustments:adjustments.map(item=>({id:String(item._id),productName:item.product?.name||'Archived product',sku:item.sku,delta:item.delta,reason:item.reason,note:item.note||'',reference:item.reference||'',before:item.before,after:item.after,actor:item.actor?`${item.actor.firstName} ${item.actor.lastName}`.trim():'System',createdAt:item.createdAt})),meta:{page:query.page,limit:query.limit,total,pages:Math.max(1,Math.ceil(total/query.limit))}});
}

export async function adjustInventory(req,res){
  const {productId,variantId}=z.object({productId:objectId,variantId:objectId}).parse(req.params);
  const data=adjustmentSchema.parse(req.body);
  const idempotencyKey=String(req.get('idempotency-key')||'');
  if(!/^[a-zA-Z0-9_-]{8,100}$/.test(idempotencyKey))throw new AppError('A valid idempotency key is required.',400,'IDEMPOTENCY_KEY_REQUIRED');
  const prior=await InventoryAdjustment.findOne({idempotencyKey}).lean();
  if(prior)return res.json({success:true,data:{adjustmentId:String(prior._id),stock:prior.after},message:'Inventory adjustment already applied.'});
  const session=await mongoose.startSession();let outcome;
  try{
    await session.withTransaction(async()=>{
      const duplicate=await InventoryAdjustment.findOne({idempotencyKey}).session(session).lean();
      if(duplicate){outcome={adjustmentId:String(duplicate._id),stock:duplicate.after};return}
      const product=await Product.findById(productId).session(session);
      if(!product)throw new AppError('Product not found.',404,'PRODUCT_NOT_FOUND');
      const variant=product.variants.id(variantId);
      if(!variant)throw new AppError('Product variant not found.',404,'VARIANT_NOT_FOUND');
      const before=variant.stock;const after=before+data.delta;
      if(after<(variant.reserved||0))throw new AppError('This adjustment would reduce stock below units already committed to orders.',409,'STOCK_COMMITTED');
      variant.stock=after;await product.save({session});
      const [adjustment]=await InventoryAdjustment.create([{product:product._id,variantId:variant._id,sku:variant.sku,delta:data.delta,reason:data.reason,note:data.note,reference:data.reference,idempotencyKey,actor:req.user.sub,before,after}],{session});
      await AuditLog.create([{actor:req.user.sub,action:'INVENTORY_ADJUSTED',resourceType:'ProductVariant',resourceId:String(variant._id),requestId:req.id,metadata:{productId:String(product._id),sku:variant.sku,delta:data.delta,reason:data.reason,before,after}}],{session});
      outcome={adjustmentId:String(adjustment._id),stock:after};
    });
  }finally{await session.endSession()}
  res.json({success:true,data:outcome,message:'Inventory updated and audit recorded.'});
}
