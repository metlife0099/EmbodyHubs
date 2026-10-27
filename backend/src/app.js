import crypto from 'node:crypto';
import express from 'express';import cors from 'cors';import helmet from 'helmet';import cookieParser from 'cookie-parser';import { rateLimit } from 'express-rate-limit';import pinoHttp from 'pino-http';import compression from 'compression';
import { env } from './config/env.js';import { logger } from './utils/logger.js';import { apiRouter } from './routes/index.js';import { errorHandler,notFound } from './middleware/errors.js';import { rejectMongoOperators } from './middleware/sanitize.js';

export const app=express();app.disable('x-powered-by');app.set('trust proxy',1);
app.use((req,res,next)=>{req.id=req.headers['x-request-id']||crypto.randomUUID();res.setHeader('X-Request-ID',req.id);next()});
app.use(pinoHttp({logger,genReqId:req=>req.id,redact:['req.headers.cookie','req.headers.authorization','req.body.password','req.body.currentPassword','req.body.newPassword','req.body.answers','req.body.professionalEmail','req.body.phone','req.body.licenses','req.body.npi','req.body.nabpIdentifier','req.body.federalEin','req.body.stateTaxId','req.body.gln','req.body.deaRegistrationNumber','req.body.pharmacyPhysicalAddress','req.body.turnstileToken']}));
app.use(helmet({contentSecurityPolicy:env.NODE_ENV==='production'?{directives:{defaultSrc:["'self'"],scriptSrc:["'self'",'https://challenges.cloudflare.com'],frameSrc:["'self'",'https://challenges.cloudflare.com'],connectSrc:["'self'",env.FRONTEND_URL,env.ADMIN_URL],imgSrc:["'self'",'data:','blob:','https://res.cloudinary.com'],styleSrc:["'self'","'unsafe-inline'"],fontSrc:["'self'",'data:'],objectSrc:["'none'"],baseUri:["'self'"],formAction:["'self'"],frameAncestors:["'self'"]}}:false,crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(cors({origin:[env.FRONTEND_URL,env.ADMIN_URL],credentials:true,methods:['GET','POST','PUT','PATCH','DELETE']}));
app.use(compression());app.use(express.json({limit:'250kb'}));app.use(express.urlencoded({extended:false,limit:'100kb'}));app.use(cookieParser(env.COOKIE_SECRET));app.use(rejectMongoOperators);
app.use('/api/v1/auth',rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many authentication attempts. Please try again later.'}}));
app.get('/health',(req,res)=>res.json({success:true,status:'ok',requestId:req.id}));app.get('/ready',(req,res)=>res.json({success:true,status:'ready',requestId:req.id}));
app.use('/api/v1',apiRouter);app.use(notFound);app.use(errorHandler);
