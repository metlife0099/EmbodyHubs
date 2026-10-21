import { z } from 'zod';
import { PHARMACIST_SUPPORT_OPTIONS,SERVICE_GOALS,US_STATE_CODES,strongPassword } from './registration.js';

const cleanName=z.string().trim().min(1,'Enter a name.').max(60);
const optionalName=z.string().trim().max(60).default('');
const optionalPhone=z.string().trim().max(24).refine(value=>!value||/^\+?[0-9() .-]{10,24}$/.test(value),'Enter a valid U.S. phone number.').default('');
const address=z.object({
  name:z.string().trim().min(2).max(120),
  line1:z.string().trim().min(3).max(160),
  line2:z.string().trim().max(160).default(''),
  city:z.string().trim().min(2).max(100),
  state:z.enum(US_STATE_CODES),
  postalCode:z.string().trim().regex(/^\d{5}(-\d{4})?$/,'Enter a valid ZIP code.'),
  country:z.literal('US').default('US')
});

export const customerProfileSchema=z.object({
  firstName:cleanName,
  lastName:cleanName,
  preferredName:optionalName,
  phone:optionalPhone,
  defaultShippingAddress:address.nullable().default(null),
  registrationProfile:z.object({
    ageRange:z.enum(['18_29','30_44','45_59','60_PLUS']),
    state:z.enum(US_STATE_CODES),
    serviceGoal:z.enum(SERVICE_GOALS),
    pharmacistSupport:z.enum(PHARMACIST_SUPPORT_OPTIONS)
  })
}).strict();

export const customerPreferencesSchema=z.object({marketingEmail:z.boolean()}).strict();

export const customerPasswordSchema=z.object({
  currentPassword:z.string().min(1).max(128),
  newPassword:strongPassword
}).strict().refine(data=>data.currentPassword!==data.newPassword,{path:['newPassword'],message:'Choose a password different from your current password.'});
