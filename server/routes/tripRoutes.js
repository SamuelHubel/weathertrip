import express from 'express';
import rateLimit from 'express-rate-limit';
import  getTrip  from '../controllers/tripController.js';
import getLoggedTrips from '../controllers/logController.js';

const tripRouter = express.Router();

const tripReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

tripRouter.post('/', getTrip);

tripRouter.get('/', tripReadLimiter, getLoggedTrips);

export default tripRouter;