import { BrevoClient } from '@getbrevo/brevo';
import { env } from '../config/env.js';

const client=env.BREVO_API_KEY&&env.BREVO_NEWSLETTER_LIST_ID?new BrevoClient({apiKey:env.BREVO_API_KEY,timeoutInSeconds:12,maxRetries:2}):null;

export async function syncNewsletterContact({email,fullName}){
  if(!client)return{status:'NOT_CONFIGURED'};
  const parts=fullName.split(' ');
  await client.contacts.createContact({
    email,
    attributes:{FNAME:parts[0],LNAME:parts.slice(1).join(' ')||parts[0]},
    listIds:[env.BREVO_NEWSLETTER_LIST_ID],
    updateEnabled:true
  });
  return{status:'SYNCED',syncedAt:new Date()};
}
