import { connectDatabase,disconnectDatabase } from '../config/database.js';
import { healthInfoArticleSeeds,healthInfoCategorySeeds } from '../data/healthInfoSeed.js';
import { HealthInfoArticle } from '../models/HealthInfoArticle.js';
import { HealthInfoCategory } from '../models/HealthInfoCategory.js';
import { logger } from '../utils/logger.js';

async function seedHealthInfo(){
  await connectDatabase();
  const categories=new Map();
  for(const categoryData of healthInfoCategorySeeds){
    const category=await HealthInfoCategory.findOneAndUpdate({slug:categoryData.slug},{$setOnInsert:categoryData},{upsert:true,returnDocument:'after'});
    categories.set(categoryData.slug,category._id);
  }
  for(const articleData of healthInfoArticleSeeds){
    const{categorySlug,...content}=articleData;
    await HealthInfoArticle.findOneAndUpdate({slug:content.slug},{$setOnInsert:{...content,category:categories.get(categorySlug)}},{upsert:true,returnDocument:'after'});
  }
  logger.info({categories:healthInfoCategorySeeds.length,articles:healthInfoArticleSeeds.length},'Health information seed complete. Existing admin edits were preserved.');
  await disconnectDatabase();
}

seedHealthInfo().catch(async error=>{logger.error(error);await disconnectDatabase();process.exit(1)});
