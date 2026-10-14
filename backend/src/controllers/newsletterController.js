import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { newsletterSubscriptionSchema } from '../schemas/newsletter.js';
import { syncNewsletterContact } from '../services/newsletterService.js';
import { logger } from '../utils/logger.js';

const SUCCESS_MESSAGE='Thanks for subscribing. You are on the EMBODY newsletter list.';

export async function subscribe(req,res){
  const data=newsletterSubscriptionSchema.parse(req.body);
  const now=new Date();
  const update={$set:{fullName:data.fullName,status:'ACTIVE',lastSubscribedAt:now,unsubscribedAt:null,'brevoSync.status':'PENDING','brevoSync.lastAttemptAt':now},$setOnInsert:{consentedAt:now,consentVersion:'2026-10-14',consentMethod:'SUBSCRIBE_BUTTON',source:'STOREFRONT'}};
  let subscriber;
  try{subscriber=await NewsletterSubscriber.findOneAndUpdate({email:data.email},update,{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true})}
  catch(error){if(error?.code!==11000)throw error;subscriber=await NewsletterSubscriber.findOneAndUpdate({email:data.email},update,{new:true,runValidators:true})}
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
