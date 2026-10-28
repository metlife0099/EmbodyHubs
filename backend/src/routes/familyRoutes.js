import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';import { requireCsrf } from '../middleware/csrf.js';import { asyncHandler } from '../utils/asyncHandler.js';
import { acceptFamilyInvitation,inviteFamilyProfile,listFamilyProfiles,revokeFamilyProfile } from '../controllers/familyController.js';
export const familyRoutes=Router();familyRoutes.use(authenticate);familyRoutes.get('/',asyncHandler(listFamilyProfiles));familyRoutes.post('/',requireCsrf,asyncHandler(inviteFamilyProfile));familyRoutes.post('/:id/accept',requireCsrf,asyncHandler(acceptFamilyInvitation));familyRoutes.post('/:id/revoke',requireCsrf,asyncHandler(revokeFamilyProfile));
