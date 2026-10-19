import { NewsletterCampaign } from '../models/NewsletterCampaign.js';
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js';
import { createBrevoCampaign,createCampaignAudienceList,getBrevoCampaign,getImportStatus,importCampaignAudience,sendBrevoCampaign } from './campaignDeliveryService.js';
import { logger } from '../utils/logger.js';

let timer;
let running=false;
const delay=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

async function failCampaign(campaign,error){
  await NewsletterCampaign.updateOne({_id:campaign._id},{$set:{status:'FAILED',failureMessage:String(error.message||'Campaign delivery failed.').slice(0,500)},$unset:{workerLeaseUntil:1}});
  logger.error({campaignId:String(campaign._id),error:error.message},'Newsletter campaign delivery failed');
}

async function processCampaign(campaign){
  try{
    if(!campaign.brevo?.listId){
      const listId=await createCampaignAudienceList(campaign);
      campaign.brevo={...(campaign.brevo?.toObject?.()||campaign.brevo||{}),listId};
      await campaign.save();
    }
    if(!campaign.brevo.importProcessId){
      const subscribers=await NewsletterSubscriber.find({_id:{$in:campaign.recipientSnapshot},status:'ACTIVE'}).select('fullName email').lean();
      if(!subscribers.length)throw new Error('No active subscribers remain in this audience.');
      const importProcessId=await importCampaignAudience(campaign.brevo.listId,subscribers);
      campaign.brevo.importProcessId=importProcessId;
      campaign.status='PREPARING';
      campaign.skippedCount+=(Math.max(0,campaign.recipientCount-subscribers.length));
      campaign.recipientCount=subscribers.length;
      campaign.workerLeaseUntil=undefined;
      await campaign.save();
      return;
    }
    if(!campaign.brevo.campaignId){
      const providerProcess=await getImportStatus(campaign.brevo.importProcessId);
      campaign.brevo.lastProviderStatus=providerProcess.status;
      if(['failed','cancelled'].includes(providerProcess.status))throw new Error(`Brevo audience import ${providerProcess.status}.`);
      if(providerProcess.status!=='completed'){campaign.workerLeaseUntil=undefined;await campaign.save();return}
      const campaignId=await createBrevoCampaign(campaign);
      campaign.brevo.campaignId=campaignId;
      campaign.status='SENDING';
      await campaign.save();
    }
    if(campaign.status==='SENDING'){
      const provider=await getBrevoCampaign(campaign.brevo.campaignId);
      campaign.brevo.lastProviderStatus=provider.status;
      if(['sent','queued','in_process','in_review'].includes(provider.status)){
        campaign.status='SENT';campaign.sentAt=provider.sentDate?new Date(provider.sentDate):new Date();campaign.failureMessage=undefined;campaign.workerLeaseUntil=undefined;await campaign.save();return;
      }
      if(['suspended','cancelled','archive'].includes(provider.status))throw new Error(`Brevo campaign is ${provider.status}.`);
      await sendBrevoCampaign(campaign.brevo.campaignId);
      campaign.status='SENT';campaign.sentAt=new Date();campaign.failureMessage=undefined;campaign.workerLeaseUntil=undefined;campaign.brevo.lastProviderStatus='queued';await campaign.save();
    }
  }catch(error){await failCampaign(campaign,error)}
}

export async function runCampaignWorker(){
  if(running)return;
  running=true;
  try{
    for(let processed=0;processed<3;processed++){
      const now=new Date();
      const campaign=await NewsletterCampaign.findOneAndUpdate({status:{$in:['QUEUED','PREPARING','SENDING']},$or:[{workerLeaseUntil:{$exists:false}},{workerLeaseUntil:{$lt:now}}]},{$set:{workerLeaseUntil:new Date(Date.now()+90_000)}},{returnDocument:'after',sort:{queuedAt:1}});
      if(!campaign)break;
      await processCampaign(campaign);
      await delay(100);
    }
  }finally{running=false}
}

export function startCampaignWorker(){
  runCampaignWorker().catch(error=>logger.error({error:error.message},'Campaign worker cycle failed'));
  timer=setInterval(()=>runCampaignWorker().catch(error=>logger.error({error:error.message},'Campaign worker cycle failed')),15_000);
  timer.unref();
  return()=>clearInterval(timer);
}
