import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const client=env.BREVO_API_KEY&&env.BREVO_NEWSLETTER_LIST_ID?new BrevoClient({apiKey:env.BREVO_API_KEY,timeoutInSeconds:20,maxRetries:2}):null;
const escapeHtml=value=>String(value||'').replace(/[&<>'"]/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[character]));
const safeCampaignName=value=>String(value).replace(/[^a-zA-Z0-9 _-]/g,'').slice(0,70);

export function campaignDeliveryReady(){return Boolean(client)}
export function buildCampaignHtml(campaign){
  const content=campaign.content;
  const paragraphs=escapeHtml(content.body).split(/\r?\n/).filter(Boolean).map(line=>`<p style="margin:0 0 18px;line-height:1.7;color:#43565d;font-size:16px">${line}</p>`).join('');
  const image=content.imageUrl?`<img src="${escapeHtml(content.imageUrl)}" alt="" style="display:block;width:100%;max-height:360px;object-fit:cover;border-radius:16px;margin:0 0 28px"/>`:'';
  const cta=content.ctaLabel&&content.ctaUrl?`<p style="margin:30px 0"><a href="${escapeHtml(content.ctaUrl)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#0b1f2a;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(content.ctaLabel)}</a></p>`:'';
  return `<!doctype html><html><body style="margin:0;background:#f3f6f4;font-family:Arial,sans-serif;color:#0b1f2a"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(campaign.previewText)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:auto;background:#fff;border-radius:22px;overflow:hidden"><tr><td style="padding:24px 36px;background:#0b1f2a;color:#fff"><strong style="font-size:24px;letter-spacing:.08em">EMBODY</strong><div style="font-size:11px;color:#9dd0c6;margin-top:4px">PHARMACY CARE</div></td></tr><tr><td style="padding:38px 36px">${image}<div style="font-size:12px;color:#28766e;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${escapeHtml(content.eyebrow||campaign.type.replaceAll('_',' '))}</div><h1 style="margin:10px 0 22px;font-size:36px;line-height:1.08">${escapeHtml(content.headline)}</h1>${paragraphs}${cta}</td></tr><tr><td style="padding:24px 36px;background:#edf3f0;color:#60726e;font-size:12px;line-height:1.6">You received this because you subscribed to EMBODY updates. <a href="{{ unsubscribe }}" style="color:#176c64">Unsubscribe</a> at any time.<br/>This email provides general information and is not medical advice.</td></tr></table></td></tr></table></body></html>`;
}

function requireClient(){if(!client)throw new AppError('Brevo campaigns are not configured. Add BREVO_API_KEY and BREVO_NEWSLETTER_LIST_ID.',503,'CAMPAIGN_PROVIDER_NOT_CONFIGURED')}
export async function createCampaignAudienceList(campaign){
  requireClient();
  const sourceList=await client.contacts.getList({listId:env.BREVO_NEWSLETTER_LIST_ID});
  const result=await client.contacts.createList({folderId:sourceList.folderId,name:`EMBODY ${safeCampaignName(campaign.name)} ${String(campaign._id).slice(-6)}`});
  return result.id;
}
export async function importCampaignAudience(listId,subscribers){
  requireClient();
  const jsonBody=subscribers.map(subscriber=>{const names=subscriber.fullName.trim().split(/\s+/);return{email:subscriber.email,attributes:{FNAME:names[0],LNAME:names.slice(1).join(' ')||names[0]}}});
  const result=await client.contacts.importContacts({jsonBody,listIds:[listId],updateExistingContacts:true,disableNotification:true});
  return result.processId;
}
export async function getImportStatus(processId){requireClient();return client.process.getProcess({processId})}
export async function createBrevoCampaign(campaign){
  requireClient();
  const result=await client.emailCampaigns.createEmailCampaign({
    name:`EMBODY | ${campaign.name}`,
    sender:{email:env.EMAIL_FROM,name:env.EMAIL_FROM_NAME},
    replyTo:env.PHARMACIST_CONTACT_EMAIL||env.EMAIL_FROM,
    subject:campaign.subject,
    previewText:campaign.previewText,
    htmlContent:buildCampaignHtml(campaign),
    recipients:{listIds:[campaign.brevo.listId]},
    mirrorActive:true,
    inlineImageActivation:false,
    tag:`embody-${campaign.type.toLowerCase()}`,
    utmCampaign:safeCampaignName(campaign.name)
  });
  return result.id;
}
export async function sendBrevoCampaign(campaignId){requireClient();await client.emailCampaigns.sendEmailCampaignNow({campaignId})}
export async function getBrevoCampaign(campaignId){requireClient();return client.emailCampaigns.getEmailCampaign({campaignId,excludeHtmlContent:true})}
