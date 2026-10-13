import { Router } from 'express';
import { login, logout, register } from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
export const authRoutes=Router();authRoutes.post('/register',asyncHandler(register));authRoutes.post('/login',asyncHandler(login));authRoutes.post('/logout',asyncHandler(logout));
