import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createHealthInfoEnquiry,getHealthInfoArticle,healthInfoNavigation,listHealthInfo } from '../controllers/healthInfoController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const healthInfoRoutes=Router();
const enquiryLimiter=rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many enquiries were submitted. Please try again later.'}});
healthInfoRoutes.get('/',asyncHandler(listHealthInfo));
healthInfoRoutes.get('/navigation',asyncHandler(healthInfoNavigation));
healthInfoRoutes.post('/enquiries',enquiryLimiter,asyncHandler(createHealthInfoEnquiry));
healthInfoRoutes.get('/:slug',asyncHandler(getHealthInfoArticle));
