import { app } from './app.js';import { env } from './config/env.js';import { connectDatabase,disconnectDatabase } from './config/database.js';import { logger } from './utils/logger.js';
import { startCampaignWorker } from './services/campaignWorker.js';
import { startOrderNotificationWorker } from './services/orderNotificationService.js';
let server;let stopCampaignWorker=()=>{};let stopOrderNotificationWorker=()=>{};
async function start(){await connectDatabase();stopCampaignWorker=startCampaignWorker();stopOrderNotificationWorker=startOrderNotificationWorker();server=app.listen(env.PORT,()=>logger.info({port:env.PORT},'Embody Hubs API listening'));server.requestTimeout=15000;server.headersTimeout=20000;server.keepAliveTimeout=5000}
async function shutdown(signal){logger.info({signal},'Graceful shutdown started');stopCampaignWorker();stopOrderNotificationWorker();server?.close(async()=>{await disconnectDatabase();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));start().catch(error=>{logger.fatal({err:error},'API startup failed');process.exit(1)});
