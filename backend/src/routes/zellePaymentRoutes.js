import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getMyZellePayment,getZelleAvailability,submitMyZellePayment } from '../controllers/zellePaymentController.js';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const zellePaymentRoutes=Router();
const limiter=rateLimit({windowMs:15*60*1000,limit:40,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many payment requests. Please try again later.'}});
zellePaymentRoutes.get('/availability',limiter,asyncHandler(getZelleAvailability));
zellePaymentRoutes.get('/orders/:id',limiter,authenticate,asyncHandler(getMyZellePayment));
zellePaymentRoutes.post('/orders/:id/submitted',limiter,authenticate,requireCsrf,asyncHandler(submitMyZellePayment));
