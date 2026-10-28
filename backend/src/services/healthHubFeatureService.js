import { env } from '../config/env.js';
import { PlatformControl } from '../models/PlatformControl.js';

export const HEALTH_HUB_FLAGS=['HEALTH_HUB','JOURNEY_PERSISTENCE','ANONYMOUS_JOURNEY_MIGRATION','HUB_SUPPORT','HUB_BENEFITS','HUB_FAMILY_ACCESS','HUB_PRESCRIPTION_CONTEXT','AI_PERSONAL_COMPANION'];
export async function healthHubCapabilities(){
  const controls=await PlatformControl.find({key:{$in:HEALTH_HUB_FLAGS},status:'ACTIVE',effectiveAt:{$lte:new Date()}}).sort({version:-1}).lean();
  const latest=new Map();for(const control of controls)if(!latest.has(control.key))latest.set(control.key,control);
  const defaultEnabled=env.NODE_ENV!=='production';
  return Object.fromEntries(HEALTH_HUB_FLAGS.map(key=>[key,latest.has(key)?latest.get(key).value?.enabled===true:defaultEnabled]));
}
export const healthHubLifecycle=()=>[
  {category:'Purchases',purpose:'Fulfillment, receipts, returns, and legal accounting',retention:'Retained as required for transaction, tax, fraud, and legal obligations',customerControl:'View and request access; deletion may be limited by law'},
  {category:'Saved items',purpose:'Remember only items you explicitly save',retention:'Until you remove the item or delete the account',customerControl:'Add and remove individually'},
  {category:'Journeys',purpose:'Help you resume a customer-chosen task',retention:'Until archived, removed, or required for an active transaction',customerControl:'Pause, resume, archive, or remove eligible journeys'},
  {category:'Support cases',purpose:'Resolve a customer request and maintain an auditable service record',retention:'Per support and legal-retention policy',customerControl:'View customer-facing history and submit a privacy request'},
  {category:'Prescription records',purpose:'Restricted pharmacy workflow only',retention:'Separate regulated retention schedule and legal holds',customerControl:'Restricted access and formal privacy-request workflow'},
  {category:'Temporary assistant context',purpose:'Answer the current request',retention:'Not stored after the response',customerControl:'No persistent memory'},
  {category:'Saved assistant conversations',purpose:'Resume a conversation only after explicit opt-in',retention:'90 days unless deleted sooner',customerControl:'Opt in, list, and delete'},
  {category:'Security events',purpose:'Protect accounts and investigate abuse',retention:'Security retention schedule',customerControl:'Review active sessions and revoke access'},
  {category:'Recently viewed',purpose:'Not enabled',retention:'No server-side browsing history is created by Health Hub',customerControl:'Not applicable'}
];
