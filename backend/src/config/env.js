import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Workspace commands and `cd backend && npm run dev` must load the same file.
// Existing OS/container variables keep precedence over values in this file.
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
loadEnv({path:path.join(projectRoot,'.env'),quiet:true});

const optional=schema=>z.preprocess(value=>typeof value==='string'&&value.trim()===''?undefined:value,schema.optional());

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/embody_health'),
  MONGODB_DB_NAME: z.string().regex(/^[a-zA-Z0-9_-]{1,63}$/).default('embody_health'),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  ADMIN_URL: z.string().url().default('http://localhost:5174'),
  JWT_ACCESS_SECRET: z.string().min(32).default('development-only-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(32).default('development-only-refresh-secret-change-me'),
  COOKIE_SECRET: z.string().min(32).default('development-only-cookie-secret-change-me'),
  OTP_PEPPER: z.string().min(32).default('development-only-otp-pepper-change-me'),
  ENCRYPTION_KEY:z.string().min(12).default('development-only-partner-encryption-key-change-me'),
  STRIPE_SECRET_KEY: optional(z.string()), STRIPE_WEBHOOK_SECRET: optional(z.string()),
  USPS_CLIENT_ID: optional(z.string()), USPS_CLIENT_SECRET: optional(z.string()), USPS_BASE_URL: z.string().url().default('https://apis-tem.usps.com'),
  BREVO_API_KEY: optional(z.string()), BREVO_OTP_TEMPLATE_ID: optional(z.coerce.number().int().positive()), BREVO_INVOICE_TEMPLATE_ID: optional(z.coerce.number().int().positive()), BREVO_NEWSLETTER_LIST_ID: optional(z.coerce.number().int().positive()), BREVO_WEBHOOK_SECRET: optional(z.string()),
  EMAIL_FROM: z.string().email().default('care@example.com'), EMAIL_FROM_NAME: z.string().default('EMBODY Pharmacy'), SUPPORT_NOTIFICATION_EMAIL: optional(z.string().email()),
  CLOUDINARY_CLOUD_NAME: optional(z.string()), CLOUDINARY_API_KEY: optional(z.string()), CLOUDINARY_API_SECRET: optional(z.string()), CLOUDINARY_UPLOAD_FOLDER: z.string().regex(/^[a-zA-Z0-9/_-]+$/).default('embody-pharmacy'), CLOUDINARY_UPLOAD_PRESET: optional(z.string().regex(/^[a-zA-Z0-9_-]+$/)),
  PARTNER_DOCUMENT_MAX_BYTES:z.coerce.number().int().min(100000).max(5_000_000).default(5_000_000), PARTNER_VIDEO_MAX_BYTES:z.coerce.number().int().min(5_000_000).max(100_000_000).default(50_000_000), MALWARE_SCAN_URL:optional(z.string().url()), TURNSTILE_SECRET_KEY:optional(z.string()),
  PHARMACY_LEGAL_NAME: optional(z.string()), PHARMACY_US_ADDRESS: optional(z.string()), PHARMACY_US_PHONE: optional(z.string()), PHARMACIST_CONTACT_EMAIL: optional(z.string().email()), PHARMACY_LICENSES_JSON: z.string().default('{}'), PHARMACY_LICENSED_STATES: z.string().default(''),
  NPPES_API_URL: z.string().url().default('https://npiregistry.cms.hhs.gov/api/'), NPPES_LOOKUP_ENABLED: z.stringbool().default(true),
  PRESCRIPTION_DISPENSING_ENABLED: z.stringbool().default(false), CONTROLLED_SUBSTANCES_ENABLED: z.stringbool().default(false),
  ADMIN_SEED_EMAIL:optional(z.string().email()),ADMIN_SEED_PASSWORD:optional(z.string().min(12).max(128))
}).superRefine((data,ctx)=>{
  let licenses={};try{licenses=JSON.parse(data.PHARMACY_LICENSES_JSON);if(!licenses||Array.isArray(licenses)||typeof licenses!=='object')throw new Error()}catch{ctx.addIssue({code:'custom',path:['PHARMACY_LICENSES_JSON'],message:'Must be a JSON object keyed by two-letter state code.'})}
  if(data.CONTROLLED_SUBSTANCES_ENABLED&&!data.PRESCRIPTION_DISPENSING_ENABLED)ctx.addIssue({code:'custom',path:['CONTROLLED_SUBSTANCES_ENABLED'],message:'Prescription dispensing must be enabled first.'});
  if(Boolean(data.ADMIN_SEED_EMAIL)!==Boolean(data.ADMIN_SEED_PASSWORD))ctx.addIssue({code:'custom',path:['ADMIN_SEED_EMAIL'],message:'ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be provided together.'});
  if(data.PRESCRIPTION_DISPENSING_ENABLED){for(const key of ['PHARMACY_LEGAL_NAME','PHARMACY_US_ADDRESS','PHARMACY_US_PHONE','PHARMACIST_CONTACT_EMAIL'])if(!data[key])ctx.addIssue({code:'custom',path:[key],message:'Required when prescription dispensing is enabled.'});const states=data.PHARMACY_LICENSED_STATES.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);if(!states.length)ctx.addIssue({code:'custom',path:['PHARMACY_LICENSED_STATES'],message:'At least one licensed state is required.'});for(const state of states)if(!/^[A-Z]{2}$/.test(state)||!String(licenses[state]||'').trim())ctx.addIssue({code:'custom',path:['PHARMACY_LICENSES_JSON'],message:`A verified license reference is required for ${state}.`})}
  if(data.NODE_ENV==='production'&&!data.SUPPORT_NOTIFICATION_EMAIL)ctx.addIssue({code:'custom',path:['SUPPORT_NOTIFICATION_EMAIL'],message:'Required in production for support chat alerts.'});
  if(data.NODE_ENV==='production'){const required=['BREVO_API_KEY','BREVO_NEWSLETTER_LIST_ID','BREVO_WEBHOOK_SECRET','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET','CLOUDINARY_UPLOAD_PRESET','MALWARE_SCAN_URL','TURNSTILE_SECRET_KEY'];for(const key of required)if(!data[key])ctx.addIssue({code:'custom',path:[key],message:'Required in production.'});for(const key of ['FRONTEND_URL','ADMIN_URL'])if(!data[key].startsWith('https://'))ctx.addIssue({code:'custom',path:[key],message:'HTTPS is required in production.'});if(data.EMAIL_FROM.endsWith('@example.com'))ctx.addIssue({code:'custom',path:['EMAIL_FROM'],message:'A verified Brevo sender is required in production.'});const secrets=[data.JWT_ACCESS_SECRET,data.JWT_REFRESH_SECRET,data.COOKIE_SECRET,data.OTP_PEPPER,data.ENCRYPTION_KEY];if(new Set(secrets).size!==secrets.length||secrets.some(value=>value.length<32||value.includes('development-only')||value.includes('change-me')))ctx.addIssue({code:'custom',path:['JWT_ACCESS_SECRET'],message:'Production security secrets must be at least 32 characters, strong, unique, and non-default.'})}
});
const parsed=schema.safeParse(process.env);
if(!parsed.success){console.error('Invalid environment configuration',parsed.error.flatten().fieldErrors);process.exit(1)}
export const env=parsed.data;
