import { Router } from 'express';
import { createAdminQuestion,listAdminQuestions,listCustomerQuestions,submitCustomerAnswers,updateAdminQuestion } from '../controllers/cartQuestionController.js';
import { authenticate,authorize } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const cartQuestionRoutes=Router();
cartQuestionRoutes.get('/cart',authenticate,asyncHandler(listCustomerQuestions));
cartQuestionRoutes.post('/cart/responses',authenticate,requireCsrf,asyncHandler(submitCustomerAnswers));
cartQuestionRoutes.get('/admin',authenticate,authorize('questions:write'),asyncHandler(listAdminQuestions));
cartQuestionRoutes.post('/admin',authenticate,requireCsrf,authorize('questions:write'),asyncHandler(createAdminQuestion));
cartQuestionRoutes.patch('/admin/:id',authenticate,requireCsrf,authorize('questions:write'),asyncHandler(updateAdminQuestion));
