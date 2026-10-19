import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { NewsletterCampaign } from '../models/NewsletterCampaign.js';
import { SubscriberGroup } from '../models/SubscriberGroup.js';
import { AuditLog } from '../models/AuditLog.js';
import { campaignSchema,campaignUpdateSchema,newsletterSubscriptionSchema,subscriberGroupSchema } from '../schemas/newsletter.js';
import { syncNewsletterContact } from '../services/newsletterService.js';
import { campaignDeliveryReady } from '../services/campaignDeliveryService.js';
import { runCampaignWorker } from '../services/campaignWorker.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

const SUCCESS_MESSAGE='Thanks for subscribing. You are on the EMBODY newsletter list.';

export async function subscribe(req,res){
  const data=newsletterSubscriptionSchema.parse(req.body);
  const now=new Date();
  const update={$set:{fullName:data.fullName,status:'ACTIVE',lastSubscribedAt:now,unsubscribedAt:null,'brevoSync.status':'PENDING','brevoSync.lastAttemptAt':now},$setOnInsert:{consentedAt:now,consentVersion:'2026-10-14',consentMethod:'SUBSCRIBE_BUTTON',source:'STOREFRONT'}};
  let subscriber;
  try{subscriber=await NewsletterSubscriber.findOneAndUpdate({email:data.email},update,{returnDocument:'after',upsert:true,runValidators:true,setDefaultsOnInsert:true})}
  catch(error){if(error?.code!==11000)throw error;subscriber=await NewsletterSubscriber.findOneAndUpdate({email:data.email},update,{returnDocument:'after',runValidators:true})}
  try{
    const result=await syncNewsletterContact(subscriber);
    subscriber.brevoSync.status=result.status;
    if(result.syncedAt)subscriber.brevoSync.syncedAt=result.syncedAt;
  }catch(error){
    subscriber.brevoSync.status='FAILED';
    logger.warn({subscriberId:subscriber.id,error:error.message},'Brevo newsletter contact sync failed');
  }
  await subscriber.save();
  res.status(201).json({success:true,message:SUCCESS_MESSAGE});
}

export async function listSubscribers(req,res){
  const page=Math.max(1,Number(req.query.page)||1);
  const limit=Math.min(100,Math.max(1,Number(req.query.limit)||25));
  const q=String(req.query.q||'').trim().slice(0,100);
  const filter={};
  if(q){const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{fullName:{$regex:escaped,$options:'i'}},{email:{$regex:escaped,$options:'i'}}]}
  const status=String(req.query.status||'').toUpperCase();if(['ACTIVE','UNSUBSCRIBED'].includes(status))filter.status=status;
  const sync=String(req.query.sync||'').toUpperCase();if(['SYNCED','PENDING','FAILED','NOT_CONFIGURED'].includes(sync))filter['brevoSync.status']=sync;
  const[items,total,summary]=await Promise.all([
    NewsletterSubscriber.find(filter).select('fullName email status consentedAt lastSubscribedAt createdAt brevoSync.status').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),
    NewsletterSubscriber.countDocuments(filter),
    NewsletterSubscriber.aggregate([{$group:{_id:null,all:{$sum:1},active:{$sum:{$cond:[{$eq:['$status','ACTIVE']},1,0]}},synced:{$sum:{$cond:[{$eq:['$brevoSync.status','SYNCED']},1,0]}},attention:{$sum:{$cond:[{$in:['$brevoSync.status',['FAILED','PENDING']]},1,0]}}}}])
  ]);
  const rawStats=summary[0]||{};const stats={all:rawStats.all||0,active:rawStats.active||0,synced:rawStats.synced||0,attention:rawStats.attention||0};
  res.json({success:true,data:items.map(item=>({id:String(item._id),fullName:item.fullName,email:item.email,status:item.status,consentedAt:item.consentedAt,lastSubscribedAt:item.lastSubscribedAt,createdAt:item.createdAt,syncStatus:item.brevoSync?.status||'NOT_CONFIGURED'})),meta:{page,limit,total,stats,pages:Math.max(1,Math.ceil(total/limit))}});
}

const groupOutput=group=>({id:String(group._id),name:group.name,description:group.description||'',subscriberIds:(group.subscriberIds||[]).map(String),memberCount:group.subscriberIds?.length||0,createdAt:group.createdAt,updatedAt:group.updatedAt});
const campaignOutput=campaign=>({
  id:String(campaign._id),name:campaign.name,type:campaign.type,subject:campaign.subject,previewText:campaign.previewText||'',content:campaign.content,audience:{type:campaign.audience.type,subscriberIds:(campaign.audience.subscriberIds||[]).map(String),group:campaign.audience.group?String(campaign.audience.group._id||campaign.audience.group):'',groupName:campaign.audience.group?.name||'',filters:campaign.audience.filters||{}},status:campaign.status,recipientCount:campaign.recipientCount||0,skippedCount:campaign.skippedCount||0,stats:campaign.stats||{},failureMessage:campaign.failureMessage||'',providerStatus:campaign.brevo?.lastProviderStatus||'',createdAt:campaign.createdAt,updatedAt:campaign.updatedAt,queuedAt:campaign.queuedAt,sentAt:campaign.sentAt
});
const uniqueIds=ids=>[...new Set(ids.map(String))];
async function verifySubscribers(ids){
  const unique=uniqueIds(ids);
  const count=await NewsletterSubscriber.countDocuments({_id:{$in:unique}});
  if(count!==unique.length)throw new AppError('One or more selected subscribers no longer exist.',422,'INVALID_SUBSCRIBER_SELECTION');
  return unique;
}
function audit(req,action,resourceType,resourceId,metadata={}){return AuditLog.create({actor:req.user.sub,action,resourceType,resourceId:String(resourceId),requestId:req.id,metadata})}

export async function listSubscriberGroups(_req,res){const groups=await SubscriberGroup.find().sort({updatedAt:-1}).lean();res.json({success:true,data:groups.map(groupOutput)})}
export async function createSubscriberGroup(req,res){
  const data=subscriberGroupSchema.parse(req.body);data.subscriberIds=await verifySubscribers(data.subscriberIds);
  try{const group=await SubscriberGroup.create({...data,nameKey:data.name.toLowerCase(),createdBy:req.user.sub,updatedBy:req.user.sub});await audit(req,'newsletter.group.created','SubscriberGroup',group.id,{memberCount:group.subscriberIds.length});res.status(201).json({success:true,data:groupOutput(group)})}
  catch(error){if(error?.code===11000)throw new AppError('A subscriber group with this name already exists.',409,'GROUP_NAME_EXISTS');throw error}
}
export async function updateSubscriberGroup(req,res){
  const data=subscriberGroupSchema.parse(req.body);data.subscriberIds=await verifySubscribers(data.subscriberIds);
  try{const group=await SubscriberGroup.findByIdAndUpdate(req.params.id,{$set:{...data,nameKey:data.name.toLowerCase(),updatedBy:req.user.sub}},{returnDocument:'after',runValidators:true});if(!group)throw new AppError('Subscriber group not found.',404,'GROUP_NOT_FOUND');await audit(req,'newsletter.group.updated','SubscriberGroup',group.id,{memberCount:group.subscriberIds.length});res.json({success:true,data:groupOutput(group)})}
  catch(error){if(error?.code===11000)throw new AppError('A subscriber group with this name already exists.',409,'GROUP_NAME_EXISTS');throw error}
}
export async function deleteSubscriberGroup(req,res){const group=await SubscriberGroup.findByIdAndDelete(req.params.id);if(!group)throw new AppError('Subscriber group not found.',404,'GROUP_NOT_FOUND');await audit(req,'newsletter.group.deleted','SubscriberGroup',group.id,{memberCount:group.subscriberIds.length});res.status(204).end()}

export async function listCampaigns(req,res){
  const page=Math.max(1,Number(req.query.page)||1);const limit=Math.min(50,Math.max(1,Number(req.query.limit)||20));
  const status=String(req.query.status||'').toUpperCase();const filter={};if(['DRAFT','QUEUED','PREPARING','SENDING','SENT','FAILED'].includes(status))filter.status=status;
  const[items,total,summary]=await Promise.all([NewsletterCampaign.find(filter).populate('audience.group','name').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),NewsletterCampaign.countDocuments(filter),NewsletterCampaign.aggregate([{$group:{_id:null,total:{$sum:1},drafts:{$sum:{$cond:[{$eq:['$status','DRAFT']},1,0]}},sent:{$sum:{$cond:[{$eq:['$status','SENT']},1,0]}},deliveredAudience:{$sum:{$cond:[{$eq:['$status','SENT']},'$recipientCount',0]}}}}])]);
  const raw=summary[0]||{};res.json({success:true,data:items.map(campaignOutput),meta:{page,limit,total,pages:Math.max(1,Math.ceil(total/limit)),stats:{total:raw.total||0,drafts:raw.drafts||0,sent:raw.sent||0,deliveredAudience:raw.deliveredAudience||0},providerReady:campaignDeliveryReady()}})
}
function campaignData(data){return{...data,audience:{...data.audience,group:data.audience.group||undefined,filters:{...data.audience.filters,joinedAfter:data.audience.filters?.joinedAfter?new Date(`${data.audience.filters.joinedAfter}T00:00:00.000Z`):undefined,joinedBefore:data.audience.filters?.joinedBefore?new Date(`${data.audience.filters.joinedBefore}T23:59:59.999Z`):undefined}}}}
async function validateCampaignAudience(audience){
  if(audience.type==='SELECTED')audience.subscriberIds=await verifySubscribers(audience.subscriberIds);
  if(audience.type==='GROUP'&&!await SubscriberGroup.exists({_id:audience.group}))throw new AppError('Subscriber group not found.',422,'GROUP_NOT_FOUND');
}
export async function createCampaign(req,res){const parsed=campaignSchema.parse(req.body);const data=campaignData(parsed);await validateCampaignAudience(data.audience);const campaign=await NewsletterCampaign.create({...data,createdBy:req.user.sub,updatedBy:req.user.sub});await audit(req,'newsletter.campaign.created','NewsletterCampaign',campaign.id,{type:campaign.type,audienceType:campaign.audience.type});res.status(201).json({success:true,data:campaignOutput(campaign)})}
export async function updateCampaign(req,res){
  const current=await NewsletterCampaign.findById(req.params.id);if(!current)throw new AppError('Campaign not found.',404,'CAMPAIGN_NOT_FOUND');if(!['DRAFT','FAILED'].includes(current.status))throw new AppError('A queued or sent campaign cannot be edited.',409,'CAMPAIGN_LOCKED');
  const parsed=campaignUpdateSchema.parse(req.body);const merged=campaignSchema.parse({name:parsed.name??current.name,type:parsed.type??current.type,subject:parsed.subject??current.subject,previewText:parsed.previewText??current.previewText,content:parsed.content??current.content.toObject(),audience:parsed.audience??{type:current.audience.type,subscriberIds:current.audience.subscriberIds.map(String),group:current.audience.group?String(current.audience.group):'',filters:{syncStatus:current.audience.filters?.syncStatus||'ANY',source:current.audience.filters?.source||'ANY',joinedAfter:current.audience.filters?.joinedAfter?.toISOString().slice(0,10)||'',joinedBefore:current.audience.filters?.joinedBefore?.toISOString().slice(0,10)||''}}});
  const data=campaignData(merged);await validateCampaignAudience(data.audience);Object.assign(current,data,{status:'DRAFT',updatedBy:req.user.sub,recipientCount:0,skippedCount:0,recipientSnapshot:[],brevo:{},failureMessage:undefined,queuedAt:undefined,sentAt:undefined,workerLeaseUntil:undefined});await current.save();await audit(req,'newsletter.campaign.updated','NewsletterCampaign',current.id,{type:current.type,audienceType:current.audience.type});res.json({success:true,data:campaignOutput(current)})
}
export async function deleteCampaign(req,res){const campaign=await NewsletterCampaign.findOneAndDelete({_id:req.params.id,status:{$in:['DRAFT','FAILED']}});if(!campaign)throw new AppError('Only draft or failed campaigns can be deleted.',409,'CAMPAIGN_LOCKED');await audit(req,'newsletter.campaign.deleted','NewsletterCampaign',campaign.id,{status:campaign.status});res.status(204).end()}

export async function sendCampaign(req,res){
  if(!campaignDeliveryReady())throw new AppError('Brevo campaigns are not configured. Add BREVO_API_KEY and BREVO_NEWSLETTER_LIST_ID.',503,'CAMPAIGN_PROVIDER_NOT_CONFIGURED');
  const campaign=await NewsletterCampaign.findById(req.params.id);if(!campaign)throw new AppError('Campaign not found.',404,'CAMPAIGN_NOT_FOUND');if(!['DRAFT','FAILED'].includes(campaign.status))throw new AppError('This campaign has already been queued or sent.',409,'CAMPAIGN_ALREADY_QUEUED');
  const query={status:'ACTIVE'};
  if(campaign.audience.type==='SYNCED_ACTIVE')query['brevoSync.status']='SYNCED';
  if(campaign.audience.type==='SELECTED')query._id={$in:campaign.audience.subscriberIds};
  if(campaign.audience.type==='GROUP'){const group=await SubscriberGroup.findById(campaign.audience.group).select('subscriberIds');if(!group)throw new AppError('The selected subscriber group no longer exists.',422,'GROUP_NOT_FOUND');query._id={$in:group.subscriberIds}}
  if(campaign.audience.type==='FILTERED'){
    const filters=campaign.audience.filters||{};if(filters.syncStatus&&filters.syncStatus!=='ANY')query['brevoSync.status']=filters.syncStatus;if(filters.source&&filters.source!=='ANY')query.source=filters.source;
    if(filters.joinedAfter||filters.joinedBefore)query.consentedAt={...(filters.joinedAfter&&{$gte:filters.joinedAfter}),...(filters.joinedBefore&&{$lte:filters.joinedBefore})};
  }
  const subscribers=await NewsletterSubscriber.find(query).select('_id').limit(5001).lean();if(!subscribers.length)throw new AppError('No active subscribers match this audience.',422,'EMPTY_CAMPAIGN_AUDIENCE');if(subscribers.length>5000)throw new AppError('This audience exceeds the 5,000-recipient safety limit. Narrow the audience before sending.',422,'CAMPAIGN_AUDIENCE_TOO_LARGE');
  const requested=campaign.audience.type==='SELECTED'?campaign.audience.subscriberIds.length:campaign.audience.type==='GROUP'?(await SubscriberGroup.findById(campaign.audience.group).select('subscriberIds').lean())?.subscriberIds.length:subscribers.length;
  campaign.status='QUEUED';campaign.recipientSnapshot=subscribers.map(item=>item._id);campaign.recipientCount=subscribers.length;campaign.skippedCount=Math.max(0,(requested||subscribers.length)-subscribers.length);campaign.queuedAt=new Date();campaign.failureMessage=undefined;campaign.brevo={};campaign.updatedBy=req.user.sub;await campaign.save();await audit(req,'newsletter.campaign.queued','NewsletterCampaign',campaign.id,{recipientCount:campaign.recipientCount,skippedCount:campaign.skippedCount,audienceType:campaign.audience.type});
  runCampaignWorker().catch(error=>logger.error({campaignId:campaign.id,error:error.message},'Unable to start campaign worker'));
  res.status(202).json({success:true,message:`Campaign queued for ${campaign.recipientCount} active subscriber${campaign.recipientCount===1?'':'s'}.`,data:campaignOutput(campaign)});
}
