import { connectDatabase,disconnectDatabase } from '../config/database.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { CartQuestion } from '../models/CartQuestion.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ComparisonOption } from '../models/ComparisonOption.js';
import { Comparison } from '../models/Comparison.js';
import { defaultComparison } from '../controllers/comparisonController.js';
import { HealthInfoCategory } from '../models/HealthInfoCategory.js';
import { HealthInfoArticle } from '../models/HealthInfoArticle.js';
import { healthInfoArticleSeeds,healthInfoCategorySeeds } from '../data/healthInfoSeed.js';
import { PlatformControl } from '../models/PlatformControl.js';

const controlTemplates=[
  ['GATE_A_BUSINESS_MODEL','LEGAL_GATE','Business model and contracts','Qualified counsel has approved the operating entities, contracts, seller, merchant-of-record, fulfillment, refund, and settlement model.',{approved:false}],
  ['GATE_B_JURISDICTION_ELIGIBILITY','LEGAL_GATE','Jurisdiction and pharmacy authorization','Every enabled activity, state, pharmacy location, license, pharmacist-in-charge, and product restriction has been reviewed.',{approved:false}],
  ['GATE_C_PRESCRIPTION_TRANSMISSION','LEGAL_GATE','Prescription intake and transmission','Qualified reviewers have approved intake, validation, transmission, receipt, clarification, cancellation, retention, and customer communication.',{approved:false}],
  ['GATE_D_CONTROLLED_SUBSTANCES','LEGAL_GATE','Controlled-substance release','Controlled-substance functionality has separate federal, DEA, state, pharmacy, security, and legal approval. It must remain disabled otherwise.',{approved:false}],
  ['GATE_E_PRIVACY_SECURITY','LEGAL_GATE','Privacy, security, and vendor agreements','Risk analysis, access controls, incident response, retention, vendor agreements, and BAAs where applicable have been approved and tested.',{approved:false}],
  ['PRESCRIPTION_INTAKE','PRESCRIPTION_WORKFLOW','Prescription intake switch','Versioned platform switch for secure prescription intake after every applicable release gate is active.',{enabled:false}],
  ['GLOBAL_TRANSACTION_PAUSE','EMERGENCY','Global emergency pause','Emergency suspension control for regulated transactions and prescription routing.',{enabled:false}]
];

const seed=async()=>{
  await connectDatabase();
  const category=await Category.findOneAndUpdate({slug:'allergy-cold'},{name:'Allergy & cold',slug:'allergy-cold',description:'Label-first non-prescription products.',active:true},{upsert:true,new:true});
  await Product.findOneAndUpdate({slug:'cetirizine-10mg'},{name:'Cetirizine',slug:'cetirizine-10mg',category:category.id,activeIngredient:'Cetirizine HCl',description:'OTC antihistamine. Follow the complete Drug Facts label.',warnings:['May cause drowsiness.','Ask a healthcare professional before use if you have liver or kidney disease.'],productType:'OTC',prescriptionRequired:false,controlledSubstance:false,cartQuestionnaireEnabled:false,publicationStatus:'PUBLISHED',variants:[{sku:'CET-10-30',dosage:'10 mg',form:'Tablet',packSize:'30 tablets',priceCents:1200,stock:64}]},{upsert:true,new:true});
  await CartQuestion.findOneAndUpdate({key:'label-reviewed'},{$setOnInsert:{prompt:'Have you reviewed the product label and warnings?',helpText:'Read the complete label before using any over-the-counter product.',responseType:'YES_NO',options:[{value:'yes',label:'Yes'},{value:'no',label:'No'}],required:true,active:true,productSlugs:[],sortOrder:10,revision:1}},{upsert:true,new:true});
  await CartQuestion.findOneAndUpdate({key:'pharmacist-help'},{$setOnInsert:{prompt:'Would you like help from a pharmacist before checkout?',helpText:'Choose yes if you would like the pharmacy team to show available support options.',responseType:'YES_NO',options:[{value:'yes',label:'Yes'},{value:'no',label:'No'}],required:false,active:true,productSlugs:[],sortOrder:20,revision:1}},{upsert:true,new:true});
  await ComparisonOption.findOneAndUpdate({slug:'tadalafil'},{$setOnInsert:{name:'Tadalafil',genericName:'Generic Cialis',slug:'tadalafil',tagline:'A longer-duration prescription option with as-needed and once-daily dosing approaches.',typicalOnset:'Taken before anticipated activity; timing and response vary by person.',typicalDuration:'Effectiveness demonstrated up to 36 hours after an as-needed dose.',frequency:'As needed, no more than once per day; or once daily when prescribed.',prescription:'Required — a licensed prescriber determines suitability.',importantConsiderations:'Must not be combined with nitrate medicines. Alcohol, blood-pressure medicines, alpha blockers, and certain health conditions may affect safety.',priceLabel:'Varies by strength, quantity, pharmacy, and coverage.',highlights:['Longer-duration characteristics may offer a wider planning window.','An approved once-daily approach is available for some patients.','Food does not determine when the labeled dose may be taken.'],source:{label:'DailyMed — Tadalafil prescribing information',url:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=351de7c2-98bf-7c88-e063-6294a90ad811'},publicationStatus:'PUBLISHED',sortOrder:10}},{upsert:true,new:true});
  await ComparisonOption.findOneAndUpdate({slug:'sildenafil'},{$setOnInsert:{name:'Sildenafil',genericName:'Generic Viagra',slug:'sildenafil',tagline:'An established as-needed prescription option taken before anticipated activity.',typicalOnset:'Usually taken about 1 hour before activity; the label allows 30 minutes to 4 hours before.',typicalDuration:'A shorter planning window than tadalafil; individual response varies.',frequency:'As needed, with a maximum recommended frequency of once per day.',prescription:'Required — a licensed prescriber determines suitability.',importantConsiderations:'Must not be combined with nitrate medicines. A high-fat meal may delay response, and interacting medicines or health conditions may change dosing.',priceLabel:'Varies by strength, quantity, pharmacy, and coverage.',highlights:['Established prescription treatment option for erectile dysfunction.','As-needed dosing may suit people who prefer dose-by-dose planning.','Available in multiple strengths selected by a licensed prescriber.'],source:{label:'DailyMed — Sildenafil prescribing information',url:'https://www.dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4df47282-7950-9430-e063-6394a90af579'},publicationStatus:'PUBLISHED',sortOrder:20}},{upsert:true,new:true});
  await Comparison.findOneAndUpdate({slug:defaultComparison.slug},{$setOnInsert:defaultComparison},{upsert:true,new:true});
  const healthCategories=new Map();
  for(const categoryData of healthInfoCategorySeeds){const category=await HealthInfoCategory.findOneAndUpdate({slug:categoryData.slug},{$setOnInsert:categoryData},{upsert:true,returnDocument:'after'});healthCategories.set(categoryData.slug,category._id)}
  for(const articleData of healthInfoArticleSeeds){const{categorySlug,...content}=articleData;await HealthInfoArticle.findOneAndUpdate({slug:content.slug},{$setOnInsert:{...content,category:healthCategories.get(categorySlug)}},{upsert:true,returnDocument:'after'})}
  if(env.ADMIN_SEED_EMAIL&&env.ADMIN_SEED_PASSWORD){const email=env.ADMIN_SEED_EMAIL.toLowerCase();const existing=await User.findOne({email});if(!existing){const now=new Date();await User.create({email,passwordHash:await User.hashPassword(env.ADMIN_SEED_PASSWORD),firstName:'Store',lastName:'Administrator',role:'SUPER_ADMIN',emailVerifiedAt:now,adultConfirmedAt:now,termsAcceptedAt:now,privacyAcknowledgedAt:now,privacyNoticeVersion:'2026-10-13',status:'ACTIVE',mfaRequired:false});logger.info({email},'Initial administrator created.')}else logger.info({email},'Administrator seed skipped because the account already exists.')}
  else logger.warn('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD are unset; no administrator account was created.');
  const controlOwner=await User.findOne({role:'SUPER_ADMIN',status:'ACTIVE'}).sort({createdAt:1});
  if(controlOwner)for(const[key,group,title,description,value]of controlTemplates)await PlatformControl.findOneAndUpdate({key,version:1},{$setOnInsert:{key,group,version:1,title,description,value,status:'DRAFT',reason:'Initial fail-closed control template from the approved platform specification.',requiresLegalReview:group==='LEGAL_GATE',legalReviewConfirmed:false,owner:group==='LEGAL_GATE'?'Legal and Compliance':'Platform Operations',rollbackAvailable:true,createdBy:controlOwner._id}},{upsert:true,new:true});
  else logger.warn('No active super administrator exists; release-gate templates were not created.');
  logger.info({healthCategories:healthInfoCategorySeeds.length,healthArticles:healthInfoArticleSeeds.length},'Synthetic catalog and source-backed health information seeded.');
  await disconnectDatabase();
};
seed().catch(async error=>{logger.error(error);await disconnectDatabase();process.exit(1)});
