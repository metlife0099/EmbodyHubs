import { Router } from 'express';
import { authRoutes } from './authRoutes.js';import { productRoutes } from './productRoutes.js';import { consultationRoutes } from './consultationRoutes.js';import { adminRoutes } from './adminRoutes.js';
import { AppError } from '../utils/AppError.js';import { shippingService } from '../services/shippingService.js';import { asyncHandler } from '../utils/asyncHandler.js';
export const apiRouter=Router();
apiRouter.use('/auth',authRoutes);apiRouter.use('/products',productRoutes);apiRouter.use('/consultations',consultationRoutes);apiRouter.use('/admin',adminRoutes);
apiRouter.post('/checkout',(_req,_res,next)=>next(new AppError('Live checkout is disabled until approved payment, pharmacy, tax, and shipping providers are configured.',503,'CHECKOUT_NOT_CONFIGURED')));
apiRouter.get('/shipping/tracking/:number',asyncHandler(async(req,res)=>res.json({success:true,data:await shippingService.track(req.params.number)})));
apiRouter.post('/support',(req,res)=>res.status(202).json({success:true,message:'Support request accepted.',data:{reference:`SUP-${Date.now().toString(36).toUpperCase()}`}}));
