import { Router } from 'express';
import { getHealthInfoArticle,healthInfoNavigation,listHealthInfo } from '../controllers/healthInfoController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const healthInfoRoutes=Router();
healthInfoRoutes.get('/',asyncHandler(listHealthInfo));
healthInfoRoutes.get('/navigation',asyncHandler(healthInfoNavigation));
healthInfoRoutes.get('/:slug',asyncHandler(getHealthInfoArticle));
