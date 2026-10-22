import { z } from 'zod';
import { ComparisonOption } from '../models/ComparisonOption.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
export const comparisonInputSchema=z.object({
  name:z.string().trim().min(2).max(80),
  genericName:z.string().trim().max(120).optional().default(''),
  slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
  tagline:z.string().trim().max(200).optional().default(''),
  typicalOnset:z.string().trim().min(2).max(160),
  typicalDuration:z.string().trim().min(2).max(160),
  frequency:z.string().trim().min(2).max(160),
  prescription:z.string().trim().min(2).max(160),
  importantConsiderations:z.string().trim().min(10).max(700),
  priceLabel:z.string().trim().min(2).max(160),
  highlights:z.array(z.string().trim().min(3).max(220)).min(2).max(8),
  source:z.object({label:z.string().trim().min(3).max(160),url:z.url().refine(value=>value.startsWith('https://'),'HTTPS is required.')}),
  publicationStatus:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('DRAFT'),
  sortOrder:z.number().int().min(0).max(10000).default(0)
});

export async function listPublicComparisons(_req,res){
  const options=await ComparisonOption.find({publicationStatus:'PUBLISHED'}).sort({sortOrder:1,name:1}).lean();
  res.set('Cache-Control','public, max-age=300, stale-while-revalidate=600');
  res.json({success:true,data:options.map(publicView)});
}

export async function listAdminComparisons(_req,res){
  const options=await ComparisonOption.find().sort({sortOrder:1,name:1}).lean();
  res.json({success:true,data:options.map(adminView)});
}

export async function createComparison(req,res){
  const data=comparisonInputSchema.parse(req.body);
  await ensureUniqueSlug(data.slug);
  const option=await ComparisonOption.create(data);
  await recordAudit(req,'COMPARISON_CREATED',option);
  res.status(201).json({success:true,data:adminView(option.toObject()),message:'Comparison option created.'});
}

export async function updateComparison(req,res){
  const id=objectId.parse(req.params.id);const data=comparisonInputSchema.parse(req.body);
  await ensureUniqueSlug(data.slug,id);
  const option=await ComparisonOption.findByIdAndUpdate(id,{$set:{...data,archivedAt:data.publicationStatus==='ARCHIVED'?new Date():null}},{new:true,runValidators:true});
  if(!option)throw new AppError('Comparison option not found.',404,'COMPARISON_NOT_FOUND');
  await recordAudit(req,'COMPARISON_UPDATED',option);
  res.json({success:true,data:adminView(option.toObject()),message:'Comparison option updated.'});
}

export async function removeComparison(req,res){
  const id=objectId.parse(req.params.id);
  const option=await ComparisonOption.findByIdAndUpdate(id,{$set:{publicationStatus:'ARCHIVED',archivedAt:new Date()}},{new:true});
  if(!option)throw new AppError('Comparison option not found.',404,'COMPARISON_NOT_FOUND');
  await recordAudit(req,'COMPARISON_ARCHIVED',option);
  res.json({success:true,data:adminView(option.toObject()),message:'Comparison option archived and removed from the public page.'});
}

async function ensureUniqueSlug(slug,excludeId){const query={slug};if(excludeId)query._id={$ne:excludeId};if(await ComparisonOption.exists(query))throw new AppError('That comparison URL slug is already in use.',409,'SLUG_IN_USE')}
async function recordAudit(req,action,option){await AuditLog.create({actor:req.user.sub,action,resourceType:'ComparisonOption',resourceId:String(option._id),requestId:req.id,metadata:{slug:option.slug,publicationStatus:option.publicationStatus}})}
function publicView(option){return{id:String(option._id),name:option.name,genericName:option.genericName||'',slug:option.slug,tagline:option.tagline||'',typicalOnset:option.typicalOnset,typicalDuration:option.typicalDuration,frequency:option.frequency,prescription:option.prescription,importantConsiderations:option.importantConsiderations,priceLabel:option.priceLabel,highlights:option.highlights||[],source:option.source,sortOrder:option.sortOrder,updatedAt:option.updatedAt}}
function adminView(option){return{...publicView(option),publicationStatus:option.publicationStatus,createdAt:option.createdAt,archivedAt:option.archivedAt||null}}
