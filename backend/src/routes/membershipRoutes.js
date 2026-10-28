import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';import { requireCsrf } from '../middleware/csrf.js';import { asyncHandler } from '../utils/asyncHandler.js';
import { cancelMembership,enrollMembership,getMyMembership,listMembershipPlans } from '../controllers/membershipController.js';
export const membershipRoutes=Router();membershipRoutes.use(authenticate);membershipRoutes.get('/plans',asyncHandler(listMembershipPlans));membershipRoutes.get('/me',asyncHandler(getMyMembership));membershipRoutes.post('/enroll',requireCsrf,asyncHandler(enrollMembership));membershipRoutes.post('/cancel',requireCsrf,asyncHandler(cancelMembership));
