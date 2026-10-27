import { z } from 'zod';
import { US_STATE_CODES } from './registration.js';
import { LICENSE_VERIFICATION_STATUSES,PARTNER_STATUSES } from '../models/PartnerApplication.js';
import { isValidNpi } from '../services/npiRegistryService.js';

const text=(min,max)=>z.string().trim().min(min).max(max);
const optionalText=max=>z.string().trim().max(max).optional().default('');
const yesNoUnsure=z.enum(['YES','NO','NOT_SURE']);
const requiredTrue=z.literal(true);
const license=z.object({
  holderType:z.enum(['PHARMACIST','PHARMACY','PHARMACIST_IN_CHARGE']),
  state:z.enum(US_STATE_CODES),licenseNumber:text(2,100),licenseType:text(2,100),
  applicantReportedStatus:z.enum(['ACTIVE','INACTIVE','PENDING','EXPIRED','UNSURE']),
  expirationDate:z.string().date().optional().or(z.literal(''))
});
const glnIsValid=value=>{
  if(!/^\d{13}$/.test(value))return false;
  let sum=0;
  for(let i=0;i<12;i++)sum+=Number(value[i])*(i%2===0?1:3);
  return(10-(sum%10))%10===Number(value[12]);
};
const sixMonthsFromToday=()=>{
  const date=new Date();date.setUTCHours(0,0,0,0);date.setUTCMonth(date.getUTCMonth()+6);return date;
};

export const partnershipApplicationSchema=z.object({
  applicantType:z.enum(['LICENSED_PHARMACIST','LICENSED_PHARMACY','PHARMACY_ORGANIZATION','OTHER_HEALTHCARE_ORGANIZATION']),
  firstName:text(1,60),middleName:optionalText(60),lastName:text(1,60),preferredName:optionalText(60),
  professionalEmail:z.string().trim().toLowerCase().email().max(254),
  phone:z.string().trim().regex(/^\+?1?[0-9() .-]{10,24}$/,'Enter a valid U.S. phone number.'),
  stateOfResidence:z.enum(US_STATE_CODES),professionalRole:text(2,100),
  yearsExperience:z.enum(['LESS_THAN_1','1_2','3_5','6_10','11_20','20_PLUS']),
  organizationName:optionalText(160),organizationWebsite:z.string().trim().url().optional().or(z.literal('')),
  organizationRole:optionalText(100),authorizedRepresentative:z.enum(['YES','NO','NOT_APPLICABLE','UNSURE']),
  pharmacyLegalName:optionalText(160),pharmacyDbaName:optionalText(160),pharmacyType:optionalText(80),
  pharmacyWebsite:z.string().trim().url().optional().or(z.literal('')),pharmacyPhone:optionalText(24),
  pharmacyPhysicalAddress:z.object({
    line1:optionalText(160),line2:optionalText(120),city:optionalText(100),
    state:z.enum(US_STATE_CODES).optional().or(z.literal('')),
    postalCode:z.string().trim().regex(/^\d{5}(?:-\d{4})?$/).optional().or(z.literal('')),country:z.literal('US')
  }),
  npi:z.string().trim().regex(/^\d{10}$/,'NPI must contain exactly 10 digits.'),
  federalEin:z.string().trim().regex(/^\d{2}-\d{7}$/,'Federal EIN must use the format 12-3456789.'),
  stateTaxId:z.string().trim().regex(/^[A-Za-z0-9-]{2,32}$/,'Enter a valid state tax ID.'),
  gln:z.string().trim().regex(/^\d{13}$/,'GLN must contain exactly 13 digits.'),
  nabpIdentifier:text(2,80),
  deaRegistrationNumber:z.string().trim().toUpperCase().regex(/^[A-Z]{2}\d{7}$/,'DEA registration must contain 2 letters followed by 7 digits.'),
  deaExpirationDate:z.string().date(),
  enterpriseType:optionalText(80),primaryWholesaler:optionalText(160),secondaryWholesaler:optionalText(160),
  pharmacySoftware:optionalText(120),hoursOfOperation:optionalText(500),
  numberOfLocations:z.coerce.number().int().min(1).max(10000).optional(),licenses:z.array(license).min(1).max(20),
  statesServed:z.array(z.enum(US_STATE_CODES)).max(50),onlineOrders:yesNoUnsure,shipsHealthcareProducts:yesNoUnsure,
  dispensesPrescriptions:yesNoUnsure,dispensesControlledSubstances:yesNoUnsure,prescriptionFulfillment:yesNoUnsure,
  otcFulfillment:yesNoUnsure,pharmacistCollaboration:yesNoUnsure,collaborationAreas:z.array(text(2,80)).max(12),
  partnershipInterests:z.array(text(2,80)).min(1).max(12),partnershipModel:text(2,80),
  shippingCapability:z.enum(['NATIONWIDE','SELECTED_STATES','LOCAL_ONLY','NOT_APPLICABLE']),
  geographicCoverage:optionalText(1000),collaborationDescription:optionalText(2000),
  declarationAccuracy:requiredTrue,declarationNoRelationship:requiredTrue,declarationVerification:requiredTrue,
  declarationContact:requiredTrue,declarationNoPhi:requiredTrue,privacyAcknowledged:requiredTrue,
  turnstileToken:optionalText(2048),website:optionalText(0)
}).superRefine((data,ctx)=>{
  const pharmacy=['LICENSED_PHARMACY','PHARMACY_ORGANIZATION'].includes(data.applicantType);
  if(!isValidNpi(data.npi))ctx.addIssue({code:'custom',path:['npi'],message:'Enter a valid 10-digit NPI.'});
  if(!glnIsValid(data.gln))ctx.addIssue({code:'custom',path:['gln'],message:'Enter a valid 13-digit GLN.'});
  if(new Date(`${data.deaExpirationDate}T00:00:00.000Z`)<sixMonthsFromToday())ctx.addIssue({code:'custom',path:['deaExpirationDate'],message:'DEA registration must remain valid for at least six months.'});
  if(pharmacy){
    for(const key of ['pharmacyLegalName','pharmacyType','pharmacyPhone','enterpriseType','primaryWholesaler','pharmacySoftware','hoursOfOperation','numberOfLocations']){
      if(data[key]===undefined||data[key]==='')ctx.addIssue({code:'custom',path:[key],message:'Required for pharmacy applicants.'});
    }
    for(const key of ['line1','city','state','postalCode']){
      if(!data.pharmacyPhysicalAddress[key])ctx.addIssue({code:'custom',path:['pharmacyPhysicalAddress',key],message:'A physical U.S. pharmacy address is required.'});
    }
    const pharmacyLicense=data.licenses.find(item=>item.holderType==='PHARMACY');
    if(!pharmacyLicense)ctx.addIssue({code:'custom',path:['licenses'],message:'Add the state pharmacy license.'});
    else if(!pharmacyLicense.expirationDate)ctx.addIssue({code:'custom',path:['licenses'],message:'State pharmacy license expiration date is required.'});
  }
  if(data.website)ctx.addIssue({code:'custom',path:['website'],message:'Unable to submit this application.'});
});

export const partnershipWorkflowSchema=z.object({status:z.enum(PARTNER_STATUSES.filter(status=>status!=='EMAIL_VERIFICATION_PENDING')),note:z.string().trim().max(2000).default('')}).superRefine((data,ctx)=>{if(['NOT_A_FIT','DECLINED','VERIFICATION_REQUIRED'].includes(data.status)&&data.note.length<8)ctx.addIssue({code:'custom',path:['note'],message:'Add a clear internal or applicant-facing note.'})});
export const licenseVerificationSchema=z.object({verificationStatus:z.enum(LICENSE_VERIFICATION_STATUSES),sourceName:text(2,160),sourceUrl:z.string().trim().url().max(500),notes:z.string().trim().max(2000).default('')});
export const capabilitySchema=z.object({otcFulfillmentEnabled:z.boolean(),prescriptionFulfillmentEnabled:z.boolean(),controlledSubstanceWorkflowEnabled:z.boolean(),pharmacistContentEnabled:z.boolean(),pharmacistCommunicationEnabled:z.boolean(),partnerPortalEnabled:z.boolean(),confirmation:z.literal('I UNDERSTAND')}).superRefine((data,ctx)=>{if(data.controlledSubstanceWorkflowEnabled&&!data.prescriptionFulfillmentEnabled)ctx.addIssue({code:'custom',path:['controlledSubstanceWorkflowEnabled'],message:'Prescription fulfillment approval is required first.'})});
export const partnershipAssessmentSchema=z.object({businessVerificationStatus:z.enum(['NOT_STARTED','PENDING','VERIFIED','UNABLE_TO_VERIFY','REQUIRES_MANUAL_REVIEW']),complianceStatus:z.enum(['REQUIRED','IN_REVIEW','APPROVED','DECLINED']),note:z.string().trim().max(2000).default('')});
