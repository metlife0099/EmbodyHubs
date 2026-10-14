import { z } from 'zod';

const cleanName=value=>value.trim().replace(/\s+/g,' ');

export const newsletterSubscriptionSchema=z.object({
  fullName:z.string().trim().min(2,'Enter your full name.').max(100).transform(cleanName),
  email:z.email('Enter a valid email address.').max(254).transform(value=>value.trim().toLowerCase()),
  consent:z.literal(true,{error:'Consent is required to subscribe.'}),
  website:z.string().max(0).optional().default('')
}).strict();
