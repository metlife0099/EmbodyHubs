import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { assistant,assistantMemory,createGuestJourney,createJourney,dashboard,deleteAssistantMemory,getPreferences,lifecycle,listJourneys,listSaved,migrateGuestJourneys,removeJourney,removeSaved,saveItem,updateJourney,updatePreferences } from '../controllers/healthHubController.js';

export const healthHubRoutes=Router();
healthHubRoutes.post('/guest/journeys',rateLimit({windowMs:60*60*1000,limit:20,standardHeaders:'draft-8',legacyHeaders:false}),asyncHandler(createGuestJourney));
healthHubRoutes.use(authenticate);
healthHubRoutes.get('/dashboard',asyncHandler(dashboard));healthHubRoutes.get('/journeys',asyncHandler(listJourneys));healthHubRoutes.post('/journeys',requireCsrf,asyncHandler(createJourney));healthHubRoutes.patch('/journeys/:id',requireCsrf,asyncHandler(updateJourney));healthHubRoutes.delete('/journeys/:id',requireCsrf,asyncHandler(removeJourney));healthHubRoutes.post('/journeys/migrate-guest',requireCsrf,asyncHandler(migrateGuestJourneys));
healthHubRoutes.get('/saved',asyncHandler(listSaved));healthHubRoutes.post('/saved',requireCsrf,asyncHandler(saveItem));healthHubRoutes.delete('/saved/:id',requireCsrf,asyncHandler(removeSaved));
healthHubRoutes.get('/preferences',asyncHandler(getPreferences));healthHubRoutes.patch('/preferences',requireCsrf,asyncHandler(updatePreferences));healthHubRoutes.get('/data-lifecycle',asyncHandler(lifecycle));
healthHubRoutes.post('/assistant',rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:'draft-8',legacyHeaders:false}),requireCsrf,asyncHandler(assistant));healthHubRoutes.get('/assistant/memory',asyncHandler(assistantMemory));healthHubRoutes.delete('/assistant/memory',requireCsrf,asyncHandler(deleteAssistantMemory));
