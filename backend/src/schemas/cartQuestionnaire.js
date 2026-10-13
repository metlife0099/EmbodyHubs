import { z } from 'zod';

const optionSchema=z.object({value:z.string().trim().min(1).max(80).regex(/^[a-zA-Z0-9_-]+$/),label:z.string().trim().min(1).max(120)});
const cartQuestionObjectSchema=z.object({
  key:z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/),
  prompt:z.string().trim().min(5).max(240),
  helpText:z.string().trim().max(300).optional().default(''),
  responseType:z.enum(['YES_NO','SINGLE_CHOICE','MULTI_CHOICE']),
  options:z.array(optionSchema).max(8).default([]),
  required:z.boolean().default(true),
  active:z.boolean().default(true),
  productSlugs:z.array(z.string().trim().regex(/^[a-z0-9-]{2,100}$/)).max(50).default([]),
  sortOrder:z.number().int().min(0).max(1000).default(0)
});

export const cartQuestionInputSchema=cartQuestionObjectSchema.superRefine((value,ctx)=>{
  if(value.responseType!=='YES_NO'&&value.options.length<2)ctx.addIssue({code:'custom',path:['options'],message:'Choice questions require at least two options.'});
  const optionValues=value.options.map(option=>option.value);
  if(new Set(optionValues).size!==optionValues.length)ctx.addIssue({code:'custom',path:['options'],message:'Option values must be unique.'});
});
export const cartQuestionUpdateSchema=cartQuestionObjectSchema.partial();

export const cartResponseSchema=z.object({
  productSlug:z.string().trim().regex(/^[a-z0-9-]{2,100}$/),
  answers:z.array(z.object({questionId:z.string().regex(/^[a-f\d]{24}$/i),values:z.array(z.string().trim().min(1).max(120)).max(8)})).max(30)
});

export function normalizeOptions(question){
  return question.responseType==='YES_NO'?[{value:'yes',label:'Yes'},{value:'no',label:'No'}]:question.options;
}
