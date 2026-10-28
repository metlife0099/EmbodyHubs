import { env } from '../config/env.js';
import { PlatformControl } from '../models/PlatformControl.js';
import { PartnerApplication } from '../models/PartnerApplication.js';

export const PRESCRIPTION_RELEASE_GATES=['GATE_A_BUSINESS_MODEL','GATE_B_JURISDICTION_ELIGIBILITY','GATE_C_PRESCRIPTION_TRANSMISSION','GATE_D_CONTROLLED_SUBSTANCES','GATE_E_PRIVACY_SECURITY'];
export async function activeControl(key){return PlatformControl.findOne({key,status:'ACTIVE',effectiveAt:{$lte:new Date()}}).sort({version:-1}).lean()}
export async function prescriptionReadiness({state,controlledSubstance=false}={}){
  const keys=controlledSubstance?PRESCRIPTION_RELEASE_GATES:PRESCRIPTION_RELEASE_GATES.filter(key=>key!=='GATE_D_CONTROLLED_SUBSTANCES');
  const controls=await PlatformControl.find({key:{$in:[...keys,'PRESCRIPTION_INTAKE','GLOBAL_TRANSACTION_PAUSE']},status:'ACTIVE',effectiveAt:{$lte:new Date()}}).sort({version:-1}).lean();
  const current=new Map();for(const control of controls)if(!current.has(control.key))current.set(control.key,control);
  const reasons=[];if(!env.PRESCRIPTION_DISPENSING_ENABLED)reasons.push('PLATFORM_DISPENSING_DISABLED');
  if(current.get('GLOBAL_TRANSACTION_PAUSE')?.value?.enabled)reasons.push('EMERGENCY_PAUSE_ACTIVE');
  if(current.get('PRESCRIPTION_INTAKE')?.value?.enabled!==true)reasons.push('PRESCRIPTION_INTAKE_DISABLED');
  for(const key of keys)if(current.get(key)?.value?.approved!==true)reasons.push(`${key}_INCOMPLETE`);
  if(controlledSubstance&&(!env.CONTROLLED_SUBSTANCES_ENABLED||current.get('GATE_D_CONTROLLED_SUBSTANCES')?.value?.approved!==true))reasons.push('CONTROLLED_SUBSTANCES_DISABLED');
  let candidates=[];
  if(state&&reasons.length===0)candidates=await PartnerApplication.find({status:'ACTIVE_PARTNER','capabilities.partnerPortalEnabled':true,'capabilities.prescriptionFulfillmentEnabled':true,'serviceConfiguration.acceptingNewSubmissions':true,'serviceConfiguration.authorizedStates':state,$and:[{$or:[{'serviceConfiguration.contractExpiresAt':null},{'serviceConfiguration.contractExpiresAt':{$gt:new Date()}}]},{$or:[{'serviceConfiguration.insuranceExpiresAt':null},{'serviceConfiguration.insuranceExpiresAt':{$gt:new Date()}}]}]}).select('applicationReference primaryState serviceConfiguration capabilities').sort({'serviceConfiguration.fallbackPriority':1,updatedAt:1}).lean();
  if(state&&reasons.length===0&&!candidates.length)reasons.push('NO_ELIGIBLE_PHARMACY');
  return{ready:reasons.length===0,reasons,controls:[...current.values()].map(item=>item._id),candidates};
}
export async function platformReadiness(){const controls=await PlatformControl.find({key:{$in:[...PRESCRIPTION_RELEASE_GATES,'PRESCRIPTION_INTAKE','GLOBAL_TRANSACTION_PAUSE']}}).sort({version:-1}).lean();const latest=new Map();for(const control of controls)if(!latest.has(control.key))latest.set(control.key,control);return{dispensingEnvironmentEnabled:env.PRESCRIPTION_DISPENSING_ENABLED,controlledSubstancesEnvironmentEnabled:env.CONTROLLED_SUBSTANCES_ENABLED,gates:PRESCRIPTION_RELEASE_GATES.map(key=>({key,status:latest.get(key)?.status||'NOT_CONFIGURED',approved:latest.get(key)?.value?.approved===true,version:latest.get(key)?.version||0,reviewDueAt:latest.get(key)?.reviewDueAt||null})),intakeEnabled:latest.get('PRESCRIPTION_INTAKE')?.status==='ACTIVE'&&latest.get('PRESCRIPTION_INTAKE')?.value?.enabled===true,emergencyPaused:latest.get('GLOBAL_TRANSACTION_PAUSE')?.status==='ACTIVE'&&latest.get('GLOBAL_TRANSACTION_PAUSE')?.value?.enabled===true}}
