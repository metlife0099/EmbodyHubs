import crypto from 'node:crypto';
import express from 'express';import cors from 'cors';import helmet from 'helmet';import cookieParser from 'cookie-parser';import { rateLimit } from 'express-rate-limit';import pinoHttp from 'pino-http';
import { env } from './config/env.js';import { logger } from './utils/logger.js';import { apiRouter } from './routes/index.js';import { errorHandler,notFound } from './middleware/errors.js';

export const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
app.use((req,res,next)=>{req.id=req.headers['x-request-id']||crypto.randomUUID();res.setHeader('X-Request-ID',req.id);next()});
app.use(pinoHttp({logger,genReqId:req=>req.id,redact:['req.headers.cookie','req.headers.authorization','req.body.password','req.body.answers']}));
app.use(helmet({contentSecurityPolicy:env.NODE_ENV==='production'?undefined:false,crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:[env.FRONTEND_URL,env.ADMIN_URL],credentials:true,methods:['GET','POST','PUT','PATCH','DELETE']}));
app.use(express.json({limit:'250kb'}));app.use(express.urlencoded({extended:false,limit:'100kb'}));app.use(cookieParser(env.COOKIE_SECRET));
app.use('/api/v1/auth',rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many attempts. Please try again later.'}}));
app.get('/health',(req,res)=>res.json({success:true,status:'ok',requestId:req.id}));app.get('/ready',(req,res)=>res.json({success:true,status:'ready',requestId:req.id}));
app.use('/api/v1',apiRouter);app.use(notFound);app.use(errorHandler);
