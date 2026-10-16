import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { getCustomerChat,markCustomerChatRead,sendCustomerMessage } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const chatRoutes=Router();
const messageLimiter=rateLimit({windowMs:60*1000,limit:12,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many messages. Please wait a moment before trying again.'}});
chatRoutes.use(authenticate);
chatRoutes.get('/',asyncHandler(getCustomerChat));
chatRoutes.post('/messages',messageLimiter,requireCsrf,asyncHandler(sendCustomerMessage));
chatRoutes.post('/read',requireCsrf,asyncHandler(markCustomerChatRead));
