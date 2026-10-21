import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getMyProfessionalApplication,submitProfessionalApplication } from '../controllers/healthcareProfessionalController.js';

export const healthcareProfessionalRoutes=Router();
healthcareProfessionalRoutes.use(authenticate);
healthcareProfessionalRoutes.get('/me',asyncHandler(getMyProfessionalApplication));
healthcareProfessionalRoutes.post('/applications',rateLimit({windowMs:60*60*1000,limit:5,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many professional application attempts. Please try again later.'}}),requireCsrf,asyncHandler(submitProfessionalApplication));
