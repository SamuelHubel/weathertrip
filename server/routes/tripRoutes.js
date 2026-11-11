import express from 'express';
import rateLimit from 'express-rate-limit';
import  getTrip  from '../controllers/tripController.js';
import getLoggedTrips, { renameTrip } from '../controllers/logController.js';
import optionalAuth from '../middleware/authMiddleware.js';

const tripRouter = express.Router();

const tripReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

tripRouter.post('/', tripReadLimiter, optionalAuth, getTrip);

tripRouter.get('/', tripReadLimiter, optionalAuth, getLoggedTrips);

tripRouter.patch('/:id', tripReadLimiter, optionalAuth, renameTrip);



export default tripRouter;