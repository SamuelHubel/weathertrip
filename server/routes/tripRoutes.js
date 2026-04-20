import express from 'express';
import  getTrip  from '../controllers/tripController.js';
import getLoggedTrips from '../controllers/logController.js';

const tripRouter = express.Router();

tripRouter.post('/', getTrip);
// tripRouter.get('/', (req, res) => {
//   res.json({message: 'Get all trips - this is a placeholder'});
// });

tripRouter.get('/', getLoggedTrips);

export default tripRouter;