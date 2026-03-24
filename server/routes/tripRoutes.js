import express from 'express';
import  getTrip  from '../controllers/tripController.js';

const tripRouter = express.Router();

tripRouter.post('/', getTrip);

export default tripRouter;