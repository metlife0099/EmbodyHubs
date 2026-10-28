import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';import { requireCsrf } from '../middleware/csrf.js';import { asyncHandler } from '../utils/asyncHandler.js';
import { createSupportCase,getMySupportCase,listMySupportCases,replyToMySupportCase } from '../controllers/supportCaseController.js';
export const supportCaseRoutes=Router();supportCaseRoutes.use(authenticate);supportCaseRoutes.get('/',asyncHandler(listMySupportCases));supportCaseRoutes.post('/',requireCsrf,asyncHandler(createSupportCase));supportCaseRoutes.get('/:id',asyncHandler(getMySupportCase));supportCaseRoutes.post('/:id/messages',requireCsrf,asyncHandler(replyToMySupportCase));
