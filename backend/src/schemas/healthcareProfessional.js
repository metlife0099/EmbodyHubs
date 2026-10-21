import { z } from 'zod';
import { US_STATE_CODES } from './registration.js';
import { isValidNpi } from '../services/npiRegistryService.js';

export const PROFESSIONAL_TYPES=['PHYSICIAN','PHYSICIAN_ASSISTANT','NURSE_PRACTITIONER','PHARMACIST','REGISTERED_NURSE','DENTIST','OTHER'];
export const HCP_STATUSES=['PENDING_REVIEW','APPROVED','NEEDS_INFORMATION','REJECTED','SUSPENDED'];
const requiredConfirmation=z.union([z.literal(true),z.literal('true')]);
const cleanText=(min,max)=>z.string().trim().min(min).max(max);

export const healthcareProfessionalApplicationSchema=z.object({
  professionType:z.enum(PROFESSIONAL_TYPES),
  specialty:cleanText(2,100),
  npi:z.string().trim().regex(/^\d{10}$/,'Enter a 10-digit NPI.').refine(isValidNpi,'Enter a valid NPI.'),
  licenseNumber:cleanText(2,80),
  licenseState:z.enum(US_STATE_CODES),
  practiceName:cleanText(2,140),
  professionalEmail:z.string().trim().toLowerCase().email().max(254),
  practicePhone:z.string().trim().regex(/^\+?[0-9() .-]{10,24}$/,'Enter a valid U.S. phone number.'),
  practiceAddress:z.object({
    line1:cleanText(3,140),
    line2:z.string().trim().max(100).optional().default(''),
    city:cleanText(2,80),
    state:z.enum(US_STATE_CODES),
    postalCode:z.string().trim().regex(/^\d{5}(?:-\d{4})?$/,'Enter a valid ZIP code.')
  }),
  intendedUse:z.enum(['PATIENT_EDUCATION','MEDICATION_SAVINGS','PRACTICE_SUPPORT','OTHER']),
  credentialAttestation:requiredConfirmation,
  noPatientDataAttestation:requiredConfirmation,
  termsAccepted:requiredConfirmation,
  privacyAcknowledged:requiredConfirmation
});

export const healthcareProfessionalReviewSchema=z.object({
  status:z.enum(['APPROVED','NEEDS_INFORMATION','REJECTED','SUSPENDED']),
  note:z.string().trim().max(1000).default('')
}).superRefine((data,ctx)=>{
  if(['NEEDS_INFORMATION','REJECTED','SUSPENDED'].includes(data.status)&&data.note.length<8)ctx.addIssue({code:'custom',path:['note'],message:'Add a clear review note of at least 8 characters.'});
});
