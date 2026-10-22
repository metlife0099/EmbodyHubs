import { Router } from 'express';
import { createComparison,listAdminComparisons,listPublicComparisons,removeComparison,updateComparison } from '../controllers/comparisonController.js';
import { authenticate,authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const comparisonRoutes=Router();
comparisonRoutes.get('/',asyncHandler(listPublicComparisons));
comparisonRoutes.get('/admin',authenticate,authorize('compare:read','compare:write','products:write'),asyncHandler(listAdminComparisons));
comparisonRoutes.post('/admin',authenticate,requireCsrf,authorize('compare:write','products:write'),asyncHandler(createComparison));
comparisonRoutes.put('/admin/:id',authenticate,requireCsrf,authorize('compare:write','products:write'),asyncHandler(updateComparison));
comparisonRoutes.delete('/admin/:id',authenticate,requireCsrf,authorize('compare:write','products:write'),asyncHandler(removeComparison));
