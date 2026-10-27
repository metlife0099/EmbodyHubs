import { z } from 'zod';
import { HealthInfoArticle } from '../models/HealthInfoArticle.js';
import { HEALTH_INFO_GROUPS,HealthInfoCategory } from '../models/HealthInfoCategory.js';
import { AuditLog } from '../models/AuditLog.js';
import { AppError } from '../utils/AppError.js';

const idSchema=z.string().regex(/^[a-f\d]{24}$/i);
const slug=z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(100);
const cleanText=(min,max)=>z.string().trim().min(min).max(max);
const optionalText=max=>z.string().trim().max(max).optional().default('');
const sourceSchema=z.object({label:cleanText(2,180),url:z.string().trim().url().max(800).refine(value=>value.startsWith('https://'),'Sources must use HTTPS.')});
const sectionSchema=z.object({heading:cleanText(2,180),paragraphs:z.array(cleanText(10,2400)).min(1).max(8),bullets:z.array(cleanText(2,500)).max(12).default([])});
const faqSchema=z.object({question:cleanText(5,240),answer:cleanText(10,1400)});
export const healthInfoCategorySchema=z.object({name:cleanText(2,100),slug,description:cleanText(10,400),navigationGroup:z.enum(HEALTH_INFO_GROUPS),accent:z.enum(['TEAL','SAGE','SAND','CLAY','NAVY']).default('TEAL'),sortOrder:z.coerce.number().int().min(0).max(10000).default(0),active:z.boolean().default(true)});
export const healthInfoArticleSchema=z.object({
  title:cleanText(5,180),slug,category:idSchema,eyebrow:optionalText(80),summary:cleanText(20,420),
  heroImageUrl:z.string().trim().max(1000).refine(value=>!value||value.startsWith('/')||/^https:\/\//.test(value),'Use an HTTPS or local image URL.').default(''),
  heroImageAlt:optionalText(180),readMinutes:z.coerce.number().int().min(1).max(60),
  takeaways:z.array(cleanText(5,400)).min(1).max(8),sections:z.array(sectionSchema).min(1).max(16),faq:z.array(faqSchema).max(12).default([]),sources:z.array(sourceSchema).min(1).max(20),
  authorName:cleanText(2,120),reviewerName:optionalText(160),reviewedAt:z.string().date().optional().or(z.literal('')),publishedAt:z.string().date().optional().or(z.literal('')),
  featured:z.boolean().default(false),sortOrder:z.coerce.number().int().min(0).max(10000).default(0),publicationStatus:z.enum(['DRAFT','PUBLISHED','ARCHIVED']),
  seo:z.object({title:optionalText(70),description:optionalText(170),keywords:z.array(cleanText(2,80)).max(20).default([]),noIndex:z.boolean().default(false)})
}).superRefine((data,ctx)=>{if(data.publicationStatus==='PUBLISHED'){if(!data.publishedAt)ctx.addIssue({code:'custom',path:['publishedAt'],message:'Published articles require a publication date.'});if(!data.reviewerName||!data.reviewedAt)ctx.addIssue({code:'custom',path:['reviewerName'],message:'Published health information requires a reviewer and review date.'});if(!data.seo.description)ctx.addIssue({code:'custom',path:['seo','description'],message:'Published articles require an SEO description.'})}});

export async function listHealthInfo(req,res){
  const query=z.object({q:z.string().trim().max(100).optional(),category:slug.optional()}).parse(req.query);const categoryFilter={active:true};if(query.category)categoryFilter.slug=query.category;
  const categories=await HealthInfoCategory.find(categoryFilter).sort({navigationGroup:1,sortOrder:1,name:1}).lean();const categoryIds=categories.map(item=>item._id);const articleFilter={publicationStatus:'PUBLISHED',category:{$in:categoryIds},'seo.noIndex':{$ne:true}};
  if(query.q)articleFilter.$text={$search:query.q};
  const articles=await HealthInfoArticle.find(articleFilter).populate('category','name slug navigationGroup accent').sort({featured:-1,sortOrder:1,publishedAt:-1}).lean();
  res.set('Cache-Control','public, max-age=120, stale-while-revalidate=600').json({success:true,data:{categories:categories.map(publicCategory),articles:articles.map(publicArticle)}});
}

export async function healthInfoNavigation(_req,res){
  const categories=await HealthInfoCategory.find({active:true}).sort({navigationGroup:1,sortOrder:1,name:1}).lean();const articles=await HealthInfoArticle.find({publicationStatus:'PUBLISHED',category:{$in:categories.map(item=>item._id)},'seo.noIndex':{$ne:true}}).select('title slug category sortOrder').sort({sortOrder:1,title:1}).lean();
  res.set('Cache-Control','public, max-age=300, stale-while-revalidate=900').json({success:true,data:categories.map(category=>({...publicCategory(category),articles:articles.filter(article=>String(article.category)===String(category._id)).slice(0,4).map(article=>({title:article.title,slug:article.slug}))}))});
}

export async function getHealthInfoArticle(req,res){
  const article=await HealthInfoArticle.findOne({slug:slug.parse(req.params.slug),publicationStatus:'PUBLISHED','seo.noIndex':{$ne:true}}).populate('category','name slug navigationGroup accent active').lean();
  if(!article||!article.category?.active)throw new AppError('Health information article not found.',404,'HEALTH_INFO_NOT_FOUND');
  const related=await HealthInfoArticle.find({_id:{$ne:article._id},category:article.category._id,publicationStatus:'PUBLISHED','seo.noIndex':{$ne:true}}).select('title slug summary readMinutes eyebrow').sort({featured:-1,sortOrder:1}).limit(3).lean();
  res.set('Cache-Control','public, max-age=120, stale-while-revalidate=600').json({success:true,data:{...publicArticle(article),related:related.map(item=>({...item,id:String(item._id)}))}});
}

export async function listAdminHealthInfo(_req,res){
  const[categories,articles]=await Promise.all([HealthInfoCategory.find().sort({navigationGroup:1,sortOrder:1,name:1}).lean(),HealthInfoArticle.find().populate('category','name slug navigationGroup accent active').sort({updatedAt:-1}).lean()]);
  res.set('Cache-Control','no-store').json({success:true,data:{categories:categories.map(item=>({...item,id:String(item._id)})),articles:articles.map(item=>({...item,id:String(item._id),reviewedAt:dateOnly(item.reviewedAt),publishedAt:dateOnly(item.publishedAt)}))}});
}

export async function saveHealthInfoCategory(req,res){
  const data=healthInfoCategorySchema.parse(req.body);const id=req.params.id?idSchema.parse(req.params.id):null;const duplicate=await HealthInfoCategory.exists({slug:data.slug,...(id?{_id:{$ne:id}}:{})});if(duplicate)throw new AppError('That health category slug is already in use.',409,'HEALTH_CATEGORY_SLUG_EXISTS');
  const category=id?await HealthInfoCategory.findByIdAndUpdate(id,data,{returnDocument:'after',runValidators:true}):await HealthInfoCategory.create(data);if(!category)throw new AppError('Health category not found.',404,'HEALTH_CATEGORY_NOT_FOUND');
  await audit(req,id?'HEALTH_CATEGORY_UPDATED':'HEALTH_CATEGORY_CREATED','HealthInfoCategory',category._id,{name:category.name,slug:category.slug});res.status(id?200:201).json({success:true,data:{...category.toObject(),id:String(category._id)}});
}

export async function removeHealthInfoCategory(req,res){
  const id=idSchema.parse(req.params.id);const category=await HealthInfoCategory.findById(id);if(!category)throw new AppError('Health category not found.',404,'HEALTH_CATEGORY_NOT_FOUND');const inUse=await HealthInfoArticle.exists({category:id});
  if(inUse){category.active=false;await category.save();await audit(req,'HEALTH_CATEGORY_ARCHIVED','HealthInfoCategory',id,{name:category.name});return res.json({success:true,message:'This category contains articles, so it was hidden instead of deleted.'})}
  await category.deleteOne();await audit(req,'HEALTH_CATEGORY_DELETED','HealthInfoCategory',id,{name:category.name});res.json({success:true,message:'Health category deleted.'});
}

export async function saveHealthInfoArticle(req,res){
  const data=healthInfoArticleSchema.parse(req.body);const id=req.params.id?idSchema.parse(req.params.id):null;const category=await HealthInfoCategory.findById(data.category).lean();if(!category)throw new AppError('Choose a valid health category.',422,'HEALTH_CATEGORY_INVALID');if(data.publicationStatus==='PUBLISHED'&&!category.active)throw new AppError('Published articles require a visible category.',409,'HEALTH_CATEGORY_INACTIVE');
  const duplicate=await HealthInfoArticle.exists({slug:data.slug,...(id?{_id:{$ne:id}}:{})});if(duplicate)throw new AppError('That article slug is already in use.',409,'HEALTH_ARTICLE_SLUG_EXISTS');const normalized={...data,reviewedAt:data.reviewedAt||undefined,publishedAt:data.publishedAt||undefined};
  const article=id?await HealthInfoArticle.findByIdAndUpdate(id,normalized,{returnDocument:'after',runValidators:true}):await HealthInfoArticle.create(normalized);if(!article)throw new AppError('Health article not found.',404,'HEALTH_ARTICLE_NOT_FOUND');await audit(req,id?'HEALTH_ARTICLE_UPDATED':'HEALTH_ARTICLE_CREATED','HealthInfoArticle',article._id,{title:article.title,slug:article.slug,status:article.publicationStatus});res.status(id?200:201).json({success:true,data:{...article.toObject(),id:String(article._id)}});
}

export async function archiveHealthInfoArticle(req,res){const id=idSchema.parse(req.params.id);const article=await HealthInfoArticle.findByIdAndUpdate(id,{publicationStatus:'ARCHIVED'},{returnDocument:'after'});if(!article)throw new AppError('Health article not found.',404,'HEALTH_ARTICLE_NOT_FOUND');await audit(req,'HEALTH_ARTICLE_ARCHIVED','HealthInfoArticle',id,{title:article.title});res.json({success:true,message:'Article archived and removed from public health information.'})}

function publicCategory(item){return{id:String(item._id),name:item.name,slug:item.slug,description:item.description,navigationGroup:item.navigationGroup,accent:item.accent,sortOrder:item.sortOrder}}
function publicArticle(item){return{id:String(item._id),title:item.title,slug:item.slug,category:item.category&&{id:String(item.category._id),name:item.category.name,slug:item.category.slug,navigationGroup:item.category.navigationGroup,accent:item.category.accent},eyebrow:item.eyebrow,summary:item.summary,heroImageUrl:item.heroImageUrl,heroImageAlt:item.heroImageAlt,readMinutes:item.readMinutes,takeaways:item.takeaways,sections:item.sections,faq:item.faq,sources:item.sources,authorName:item.authorName,reviewerName:item.reviewerName,reviewedAt:item.reviewedAt,publishedAt:item.publishedAt,featured:item.featured,seo:item.seo}}
function dateOnly(value){return value?new Date(value).toISOString().slice(0,10):''}
async function audit(req,action,resourceType,resourceId,metadata){await AuditLog.create({actor:req.user.sub,action,resourceType,resourceId:String(resourceId),requestId:req.id,metadata})}
