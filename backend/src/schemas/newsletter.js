import { z } from 'zod';

const cleanName=value=>value.trim().replace(/\s+/g,' ');

export const newsletterSubscriptionSchema=z.object({
  fullName:z.string().trim().min(2,'Enter your full name.').max(100).transform(cleanName),
  email:z.email('Enter a valid email address.').max(254).transform(value=>value.trim().toLowerCase()),
  consent:z.literal(true,{error:'Use the subscribe button to confirm email consent.'}).optional().default(true),
  website:z.string().max(500).optional()
}).strict();

const objectId=z.string().regex(/^[a-f\d]{24}$/i,'Invalid record identifier.');
const optionalUrl=z.union([z.literal(''),z.url('Enter a complete HTTPS URL.').refine(value=>value.startsWith('https://'),'Only HTTPS URLs are allowed.')]);

export const subscriberGroupSchema=z.object({
  name:z.string().trim().min(2).max(80),
  description:z.string().trim().max(240).optional().default(''),
  subscriberIds:z.array(objectId).max(5000).default([])
}).strict();

const audienceSchema=z.object({
  type:z.enum(['ALL_ACTIVE','SYNCED_ACTIVE','SELECTED','GROUP','FILTERED']),
  subscriberIds:z.array(objectId).max(5000).optional().default([]),
  group:z.union([objectId,z.literal('')]).optional(),
  filters:z.object({
    syncStatus:z.enum(['ANY','SYNCED','PENDING','FAILED','NOT_CONFIGURED']).optional().default('ANY'),
    source:z.enum(['ANY','STOREFRONT','ADMIN_IMPORT']).optional().default('ANY'),
    joinedAfter:z.union([z.iso.date(),z.literal('')]).optional(),
    joinedBefore:z.union([z.iso.date(),z.literal('')]).optional()
  }).strict().optional().default({})
}).strict().superRefine((audience,ctx)=>{
  if(audience.type==='SELECTED'&&!audience.subscriberIds.length)ctx.addIssue({code:'custom',path:['subscriberIds'],message:'Select at least one subscriber.'});
  if(audience.type==='GROUP'&&!audience.group)ctx.addIssue({code:'custom',path:['group'],message:'Choose a subscriber group.'});
  if(audience.filters.joinedAfter&&audience.filters.joinedBefore&&audience.filters.joinedAfter>audience.filters.joinedBefore)ctx.addIssue({code:'custom',path:['filters','joinedBefore'],message:'End date must be after the start date.'});
});

export const campaignSchema=z.object({
  name:z.string().trim().min(2).max(120),
  type:z.enum(['UPDATE','ANNOUNCEMENT','ARTICLE','PRODUCT_ARRIVAL','INFORMATION']),
  subject:z.string().trim().min(3).max(150),
  previewText:z.string().trim().max(190).optional().default(''),
  content:z.object({
    eyebrow:z.string().trim().max(60).optional().default(''),
    headline:z.string().trim().min(3).max(140),
    body:z.string().trim().min(10).max(12000),
    imageUrl:optionalUrl.optional().default(''),
    ctaLabel:z.string().trim().max(50).optional().default(''),
    ctaUrl:optionalUrl.optional().default('')
  }).strict().superRefine((content,ctx)=>{
    if(Boolean(content.ctaLabel)!==Boolean(content.ctaUrl))ctx.addIssue({code:'custom',path:['ctaUrl'],message:'CTA label and URL must be provided together.'});
  }),
  audience:audienceSchema
}).strict();

export const campaignUpdateSchema=campaignSchema.partial();
