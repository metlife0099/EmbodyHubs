import { connectDatabase,disconnectDatabase } from '../config/database.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { CartQuestion } from '../models/CartQuestion.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const seed=async()=>{
  await connectDatabase();
  const category=await Category.findOneAndUpdate({slug:'allergy-cold'},{name:'Allergy & cold',slug:'allergy-cold',description:'Label-first non-prescription products.',active:true},{upsert:true,new:true});
  await Product.findOneAndUpdate({slug:'cetirizine-10mg'},{name:'Cetirizine',slug:'cetirizine-10mg',category:category.id,activeIngredient:'Cetirizine HCl',description:'OTC antihistamine. Follow the complete Drug Facts label.',warnings:['May cause drowsiness.','Ask a healthcare professional before use if you have liver or kidney disease.'],productType:'OTC',prescriptionRequired:false,controlledSubstance:false,cartQuestionnaireEnabled:false,publicationStatus:'PUBLISHED',variants:[{sku:'CET-10-30',dosage:'10 mg',form:'Tablet',packSize:'30 tablets',priceCents:1200,stock:64}]},{upsert:true,new:true});
  await CartQuestion.findOneAndUpdate({key:'label-reviewed'},{$setOnInsert:{prompt:'Have you reviewed the product label and warnings?',helpText:'Read the complete label before using any over-the-counter product.',responseType:'YES_NO',options:[{value:'yes',label:'Yes'},{value:'no',label:'No'}],required:true,active:true,productSlugs:[],sortOrder:10,revision:1}},{upsert:true,new:true});
  await CartQuestion.findOneAndUpdate({key:'pharmacist-help'},{$setOnInsert:{prompt:'Would you like help from a pharmacist before checkout?',helpText:'Choose yes if you would like the pharmacy team to show available support options.',responseType:'YES_NO',options:[{value:'yes',label:'Yes'},{value:'no',label:'No'}],required:false,active:true,productSlugs:[],sortOrder:20,revision:1}},{upsert:true,new:true});
  if(env.ADMIN_SEED_EMAIL&&env.ADMIN_SEED_PASSWORD){const email=env.ADMIN_SEED_EMAIL.toLowerCase();const existing=await User.findOne({email});if(!existing){const now=new Date();await User.create({email,passwordHash:await User.hashPassword(env.ADMIN_SEED_PASSWORD),firstName:'Store',lastName:'Administrator',role:'SUPER_ADMIN',emailVerifiedAt:now,adultConfirmedAt:now,termsAcceptedAt:now,privacyAcknowledgedAt:now,privacyNoticeVersion:'2026-10-13',status:'ACTIVE'});logger.info({email},'Initial administrator created.')}else logger.info({email},'Administrator seed skipped because the account already exists.')}
  else logger.warn('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are unset; no administrator account was created.');
  logger.info('Synthetic OTC demo catalog and customer questions seeded.');
  await disconnectDatabase();
};
seed().catch(async error=>{logger.error(error);await disconnectDatabase();process.exit(1)});
