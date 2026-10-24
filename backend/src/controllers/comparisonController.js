import { z } from 'zod';
import { Comparison } from '../models/Comparison.js';
import { ComparisonOption } from '../models/ComparisonOption.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

const objectId=z.string().regex(/^[a-f\d]{24}$/i);
const optionalText=max=>z.string().trim().max(max).optional().default('');
const sourceSchema=z.object({
  label:optionalText(160),
  url:z.union([z.literal(''),z.url().refine(value=>value.startsWith('https://'),'HTTPS is required.')]).optional().default('')
}).optional().default({label:'',url:''});

export const comparisonItemSchema=z.object({
  name:z.string().trim().min(1,'Enter an item name.').max(80),
  genericName:optionalText(120),
  tagline:optionalText(240),
  typicalOnset:optionalText(180),
  typicalDuration:optionalText(180),
  frequency:optionalText(180),
  prescription:optionalText(180),
  importantConsiderations:optionalText(800),
  priceLabel:optionalText(180),
  highlights:z.array(z.string().trim().min(1).max(220)).max(8).optional().default([]),
  source:sourceSchema
}).superRefine((item,context)=>{
  if(Boolean(item.source.label)!==Boolean(item.source.url))context.addIssue({code:'custom',path:['source'],message:'Add both a source label and HTTPS URL, or leave both blank.'});
});

export const comparisonInputSchema=z.object({
  purpose:z.string().trim().min(2,'Enter a comparison purpose.').max(120),
  slug:z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),
  intro:optionalText(320),
  items:z.array(comparisonItemSchema).min(2,'Add at least two items.').max(6,'Use no more than six columns.'),
  publicationStatus:z.enum(['DRAFT','PUBLISHED','ARCHIVED']).default('DRAFT'),
  sortOrder:z.coerce.number().int().min(0).max(10000).default(0)
});

export async function listPublicComparisons(_req,res){
  await ensureInitialComparison();
  const comparisons=await Comparison.find({publicationStatus:'PUBLISHED'}).sort({sortOrder:1,purpose:1}).lean();
  res.set('Cache-Control','public, max-age=60, stale-while-revalidate=300');
  res.json({success:true,data:comparisons.map(publicView)});
}

export async function listAdminComparisons(_req,res){
  await ensureInitialComparison();
  const comparisons=await Comparison.find().sort({sortOrder:1,purpose:1}).lean();
  res.json({success:true,data:comparisons.map(adminView)});
}

export async function createComparison(req,res){
  const input=comparisonInputSchema.parse(req.body);
  const slug=await availableSlug(input.slug||slugify(input.purpose));
  const comparison=await Comparison.create({...input,slug});
  await recordAudit(req,'COMPARISON_CREATED',comparison);
  res.status(201).json({success:true,data:adminView(comparison.toObject()),message:'Comparison created.'});
}

export async function updateComparison(req,res){
  const id=objectId.parse(req.params.id);
  const existing=await Comparison.findById(id);
  if(!existing)throw new AppError('Comparison not found.',404,'COMPARISON_NOT_FOUND');
  const input=comparisonInputSchema.parse(req.body);
  const slug=input.slug||existing.slug;
  await ensureUniqueSlug(slug,id);
  const comparison=await Comparison.findByIdAndUpdate(id,{$set:{...input,slug,archivedAt:input.publicationStatus==='ARCHIVED'?new Date():null}},{new:true,runValidators:true});
  await recordAudit(req,'COMPARISON_UPDATED',comparison);
  res.json({success:true,data:adminView(comparison.toObject()),message:'Comparison updated.'});
}

export async function removeComparison(req,res){
  const id=objectId.parse(req.params.id);
  const comparison=await Comparison.findByIdAndUpdate(id,{$set:{publicationStatus:'ARCHIVED',archivedAt:new Date()}},{new:true});
  if(!comparison)throw new AppError('Comparison not found.',404,'COMPARISON_NOT_FOUND');
  await recordAudit(req,'COMPARISON_ARCHIVED',comparison);
  res.json({success:true,data:adminView(comparison.toObject()),message:'Comparison archived and removed from the public page.'});
}

async function ensureInitialComparison(){
  if(await Comparison.exists({}))return;
  const legacy=await ComparisonOption.find({publicationStatus:{$ne:'ARCHIVED'}}).sort({sortOrder:1,name:1}).lean();
  const items=legacy.length>=2?legacy.map(toItem):defaultComparison.items;
  try{await Comparison.create({...defaultComparison,items})}catch(error){if(error?.code!==11000)throw error}
}

function toItem(option){return{name:option.name,genericName:option.genericName||'',tagline:option.tagline||'',typicalOnset:option.typicalOnset||'',typicalDuration:option.typicalDuration||'',frequency:option.frequency||'',prescription:option.prescription||'',importantConsiderations:option.importantConsiderations||'',priceLabel:option.priceLabel||'',highlights:option.highlights||[],source:option.source||{label:'',url:''}}}
function slugify(value){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')||'comparison'}
async function availableSlug(base){let slug=base;let suffix=2;while(await Comparison.exists({slug}))slug=`${base}-${suffix++}`;return slug}
async function ensureUniqueSlug(slug,excludeId){const query={slug};if(excludeId)query._id={$ne:excludeId};if(await Comparison.exists(query))throw new AppError('That comparison URL slug is already in use.',409,'SLUG_IN_USE')}
async function recordAudit(req,action,comparison){await AuditLog.create({actor:req.user.sub,action,resourceType:'Comparison',resourceId:String(comparison._id),requestId:req.id,metadata:{slug:comparison.slug,publicationStatus:comparison.publicationStatus,itemCount:comparison.items.length}})}
function publicView(comparison){return{id:String(comparison._id),purpose:comparison.purpose,slug:comparison.slug,intro:comparison.intro||'',items:(comparison.items||[]).map(item=>({...item,id:String(item._id)})),sortOrder:comparison.sortOrder,updatedAt:comparison.updatedAt}}
function adminView(comparison){return{...publicView(comparison),publicationStatus:comparison.publicationStatus,createdAt:comparison.createdAt,archivedAt:comparison.archivedAt||null}}

export const defaultComparison={
  purpose:'Tadalafil vs Sildenafil',slug:'tadalafil-vs-sildenafil',intro:'Compare common characteristics side by side, then discuss your health history and goals with a licensed professional.',publicationStatus:'PUBLISHED',sortOrder:10,
  items:[
    {name:'Tadalafil',genericName:'Generic Cialis',tagline:'A longer-duration prescription option with as-needed and once-daily dosing approaches.',typicalOnset:'Taken before anticipated activity; timing and response vary by person.',typicalDuration:'Effectiveness demonstrated up to 36 hours after an as-needed dose.',frequency:'As needed, no more than once per day; or once daily when prescribed.',prescription:'Required — a licensed prescriber determines suitability.',importantConsiderations:'Must not be combined with nitrate medicines. Alcohol, blood-pressure medicines, alpha blockers, and certain health conditions may affect safety.',priceLabel:'Varies by strength, quantity, pharmacy, and coverage.',highlights:['Longer-duration characteristics may offer a wider planning window.','An approved once-daily approach is available for some patients.','Food does not determine when the labeled dose may be taken.'],source:{label:'DailyMed — Tadalafil prescribing information',url:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=351de7c2-98bf-7c88-e063-6294a90ad811'}},
    {name:'Sildenafil',genericName:'Generic Viagra',tagline:'An established as-needed prescription option taken before anticipated activity.',typicalOnset:'Usually taken about 1 hour before activity; the label allows 30 minutes to 4 hours before.',typicalDuration:'A shorter planning window than tadalafil; individual response varies.',frequency:'As needed, with a maximum recommended frequency of once per day.',prescription:'Required — a licensed prescriber determines suitability.',importantConsiderations:'Must not be combined with nitrate medicines. A high-fat meal may delay response, and interacting medicines or health conditions may change dosing.',priceLabel:'Varies by strength, quantity, pharmacy, and coverage.',highlights:['Established prescription treatment option for erectile dysfunction.','As-needed dosing may suit people who prefer dose-by-dose planning.','Available in multiple strengths selected by a licensed prescriber.'],source:{label:'DailyMed — Sildenafil prescribing information',url:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4df47282-7950-9430-e063-6394a90af579'}}
  ]
};
