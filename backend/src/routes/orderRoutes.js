import { Router } from 'express';import { authenticate } from '../middleware/auth.js';import { requireCsrf } from '../middleware/csrf.js';import { emailInvoice } from '../controllers/orderController.js';import { asyncHandler } from '../utils/asyncHandler.js';
export const orderRoutes=Router();orderRoutes.post('/:id/invoice/email',authenticate,requireCsrf,asyncHandler(emailInvoice));
