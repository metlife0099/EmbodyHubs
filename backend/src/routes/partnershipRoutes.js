import express,{ Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { getMyPartnershipApplication,getPartnerPortal,submitPartnershipApplication,uploadPartnerDocument,verifyPartnershipEmail } from '../controllers/partnershipController.js';

export const partnershipRoutes=Router();
const applicationLimit=rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many partnership application attempts. Please try again later.'}});
const uploadLimit=rateLimit({windowMs:60*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many document upload attempts. Please try again later.'}});
const verificationLimit=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many verification attempts. Please try again later.'}});
partnershipRoutes.get('/verify-email',verificationLimit,asyncHandler(verifyPartnershipEmail));
partnershipRoutes.use(authenticate);
partnershipRoutes.get('/me',asyncHandler(getMyPartnershipApplication));
partnershipRoutes.get('/portal',asyncHandler(getPartnerPortal));
partnershipRoutes.post('/applications',applicationLimit,requireCsrf,asyncHandler(submitPartnershipApplication));
partnershipRoutes.post('/applications/:id/documents',uploadLimit,requireCsrf,express.raw({type:['application/pdf','image/jpeg','image/png','video/mp4'],limit:env.PARTNER_VIDEO_MAX_BYTES}),asyncHandler(uploadPartnerDocument));
