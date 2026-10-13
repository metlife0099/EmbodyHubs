import { Router } from 'express';
import { adminLogin,forgotPassword,login,logout,refresh,register,resendOtp,resetPassword,verifyOtp } from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
export const authRoutes=Router();authRoutes.post('/register',asyncHandler(register));authRoutes.post('/verify-otp',asyncHandler(verifyOtp));authRoutes.post('/resend-otp',asyncHandler(resendOtp));authRoutes.post('/login',asyncHandler(login));authRoutes.post('/admin/login',asyncHandler(adminLogin));authRoutes.post('/forgot-password',asyncHandler(forgotPassword));authRoutes.post('/reset-password',asyncHandler(resetPassword));authRoutes.post('/refresh',asyncHandler(refresh));authRoutes.post('/logout',authenticate,requireCsrf,asyncHandler(logout));
