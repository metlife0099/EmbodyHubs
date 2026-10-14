import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { subscribe } from '../controllers/newsletterController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const newsletterRoutes=Router();
newsletterRoutes.post('/subscribe',rateLimit({windowMs:60*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many subscription attempts. Please try again later.'}}),asyncHandler(subscribe));
