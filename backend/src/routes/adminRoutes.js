import { Router } from 'express';import { metrics } from '../controllers/adminController.js';import { authenticate,authorize } from '../middleware/auth.js';import { asyncHandler } from '../utils/asyncHandler.js';
export const adminRoutes=Router();adminRoutes.use(authenticate);adminRoutes.get('/metrics',authorize('orders:read','audit:read'),asyncHandler(metrics));
