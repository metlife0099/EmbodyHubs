import { app } from './app.js';import { env } from './config/env.js';import { connectDatabase,disconnectDatabase } from './config/database.js';import { logger } from './utils/logger.js';
let server;
async function start(){await connectDatabase();server=app.listen(env.PORT,()=>logger.info({port:env.PORT},'EMBODY API listening'));server.requestTimeout=15000;server.headersTimeout=20000;server.keepAliveTimeout=5000}
async function shutdown(signal){logger.info({signal},'Graceful shutdown started');server?.close(async()=>{await disconnectDatabase();process.exit(0)});setTimeout(()=>process.exit(1),10000).unref()}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));start().catch(error=>{logger.fatal({err:error},'API startup failed');process.exit(1)});
