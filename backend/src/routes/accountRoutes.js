import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { changeCustomerPassword,getCustomerAccount,listCustomerOrders,revokeOtherCustomerSessions,updateCustomerPreferences,updateCustomerProfile } from '../controllers/accountController.js';

export const accountRoutes=Router();
accountRoutes.use(authenticate);
accountRoutes.get('/',asyncHandler(getCustomerAccount));
accountRoutes.get('/orders',asyncHandler(listCustomerOrders));
accountRoutes.patch('/profile',requireCsrf,asyncHandler(updateCustomerProfile));
accountRoutes.patch('/preferences',requireCsrf,asyncHandler(updateCustomerPreferences));
accountRoutes.post('/password',rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many password attempts. Please try again later.'}}),requireCsrf,asyncHandler(changeCustomerPassword));
accountRoutes.post('/sessions/revoke-others',requireCsrf,asyncHandler(revokeOtherCustomerSessions));
