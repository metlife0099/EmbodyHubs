import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(){let attempt=0;while(attempt<5){try{await mongoose.connect(env.MONGODB_URI,{serverSelectionTimeoutMS:5000,maxPoolSize:20});logger.info('MongoDB connected');return}catch(error){attempt++;logger.warn({attempt,error:error.message},'MongoDB connection failed');if(attempt===5)throw error;await new Promise(r=>setTimeout(r,Math.min(1000*2**attempt,10000)))}}}
export async function disconnectDatabase(){await mongoose.disconnect()}
