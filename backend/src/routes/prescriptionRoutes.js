import express,{ Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cancelMyPrescription,getPrescriptionReadiness,listMyPrescriptions,respondToClarification,submitPrescription } from '../controllers/prescriptionController.js';
export const prescriptionRoutes=Router();const uploadLimit=rateLimit({windowMs:60*60*1000,limit:8,standardHeaders:'draft-8',legacyHeaders:false,message:{success:false,code:'RATE_LIMITED',message:'Too many prescription submissions. Please try again later.'}});
prescriptionRoutes.use(authenticate);prescriptionRoutes.get('/readiness',asyncHandler(getPrescriptionReadiness));prescriptionRoutes.get('/me',asyncHandler(listMyPrescriptions));prescriptionRoutes.post('/',uploadLimit,requireCsrf,express.raw({type:['application/pdf','image/jpeg','image/png'],limit:'5mb'}),asyncHandler(submitPrescription));prescriptionRoutes.post('/:id/cancel',requireCsrf,asyncHandler(cancelMyPrescription));prescriptionRoutes.post('/:id/clarifications/:clarificationId/respond',requireCsrf,asyncHandler(respondToClarification));
