// router for trip retrieval and trip logging
import express from 'express';
import rateLimit from 'express-rate-limit';
import  getTrip  from '../controllers/tripController.js';
import getLoggedTrips, { renameTrip, deleteTrip } from '../controllers/logController.js';
import optionalAuth from '../middleware/authMiddleware.js';

const tripRouter = express.Router();

const tripReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// planning costs geocoder quota (up to 10 lookups a trip), so it gets a tighter limit than the log routes
const tripPlanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many trips planned, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

tripRouter.post('/', tripPlanLimiter, optionalAuth, getTrip);

tripRouter.get('/', tripReadLimiter, optionalAuth, getLoggedTrips);

tripRouter.patch('/:id', tripReadLimiter, optionalAuth, renameTrip);

tripRouter.delete('/:id', tripReadLimiter, optionalAuth, deleteTrip);



export default tripRouter;