import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/embody_health'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_URL: z.string().url().default('http://localhost:5174'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-only-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-only-refresh-secret-change-me'),
  COOKIE_SECRET: z.string().min(32).default('development-only-cookie-secret-change-me'),
  OTP_PEPPER: z.string().min(32).default('development-only-otp-pepper-change-me'),
  STRIPE_SECRET_KEY: z.string().optional(), STRIPE_WEBHOOK_SECRET: z.string().optional(),
  USPS_CLIENT_ID: z.string().optional(), USPS_CLIENT_SECRET: z.string().optional(), USPS_BASE_URL: z.string().url().default('https://apis-tem.usps.com'),
  BREVO_API_KEY: z.string().optional(), BREVO_OTP_TEMPLATE_ID: z.coerce.number().int().positive().optional(), BREVO_INVOICE_TEMPLATE_ID: z.coerce.number().int().positive().optional(), BREVO_WEBHOOK_SECRET: z.string().optional(),
  EMAIL_FROM: z.string().email().default('care@example.com'), EMAIL_FROM_NAME: z.string().default('EMBODY Pharmacy'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(), CLOUDINARY_API_KEY: z.string().optional(), CLOUDINARY_API_SECRET: z.string().optional(), CLOUDINARY_UPLOAD_FOLDER: z.string().regex(/^[a-zA-Z0-9/_-]+$/).default('embody-pharmacy'), CLOUDINARY_UPLOAD_PRESET: z.string().regex(/^[a-zA-Z0-9_-]+$/).optional(),
  PHARMACY_LEGAL_NAME: z.string().optional(), PHARMACY_US_ADDRESS: z.string().optional(), PHARMACY_US_PHONE: z.string().optional(), PHARMACIST_CONTACT_EMAIL: z.string().email().optional(), PHARMACY_LICENSES_JSON: z.string().default('{}'), PHARMACY_LICENSED_STATES: z.string().default(''),
  PRESCRIPTION_DISPENSING_ENABLED: z.stringbool().default(false), CONTROLLED_SUBSTANCES_ENABLED: z.stringbool().default(false)
}).superRefine((data,ctx)=>{
  let licenses={};try{licenses=JSON.parse(data.PHARMACY_LICENSES_JSON);if(!licenses||Array.isArray(licenses)||typeof licenses!=='object')throw new Error()}catch{ctx.addIssue({code:'custom',path:['PHARMACY_LICENSES_JSON'],message:'Must be a JSON object keyed by two-letter state code.'})}
  if(data.CONTROLLED_SUBSTANCES_ENABLED&&!data.PRESCRIPTION_DISPENSING_ENABLED)ctx.addIssue({code:'custom',path:['CONTROLLED_SUBSTANCES_ENABLED'],message:'Prescription dispensing must be enabled first.'});
  if(data.PRESCRIPTION_DISPENSING_ENABLED){for(const key of ['PHARMACY_LEGAL_NAME','PHARMACY_US_ADDRESS','PHARMACY_US_PHONE','PHARMACIST_CONTACT_EMAIL'])if(!data[key])ctx.addIssue({code:'custom',path:[key],message:'Required when prescription dispensing is enabled.'});const states=data.PHARMACY_LICENSED_STATES.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);if(!states.length)ctx.addIssue({code:'custom',path:['PHARMACY_LICENSED_STATES'],message:'At least one licensed state is required.'});for(const state of states)if(!/^[A-Z]{2}$/.test(state)||!String(licenses[state]||'').trim())ctx.addIssue({code:'custom',path:['PHARMACY_LICENSES_JSON'],message:`A verified license reference is required for ${state}.`})}
  if(data.NODE_ENV==='production'){const required=['BREVO_API_KEY','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','CLOUDINARY_UPLOAD_PRESET'];for(const key of required)if(!data[key])ctx.addIssue({code:'custom',path:[key],message:'Required in production.'});for(const key of ['FRONTEND_URL','ADMIN_URL'])if(!data[key].startsWith('https://'))ctx.addIssue({code:'custom',path:[key],message:'HTTPS is required in production.'});if(data.EMAIL_FROM.endsWith('@example.com'))ctx.addIssue({code:'custom',path:['EMAIL_FROM'],message:'A verified Brevo sender is required in production.'});const secrets=[data.JWT_ACCESS_SECRET,data.JWT_REFRESH_SECRET,data.COOKIE_SECRET,data.OTP_PEPPER];if(new Set(secrets).size!==secrets.length||secrets.some(value=>value.includes('development-only')||value.includes('change-me')))ctx.addIssue({code:'custom',path:['JWT_ACCESS_SECRET'],message:'Production security secrets must be strong, unique, and non-default.'})}
});
const parsed=schema.safeParse(process.env);
if(!parsed.success){console.error('Invalid environment configuration',parsed.error.flatten().fieldErrors);process.exit(1)}
export const env=parsed.data;
