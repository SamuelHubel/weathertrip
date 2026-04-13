import express from 'express';
import  getTrip  from '../controllers/tripController.js';
import getWeather from '../services/weatherService.js';

const tripRouter = express.Router();

tripRouter.post('/', getTrip);
// tripRouter.get('/', (req, res) => {
//   res.json({message: 'Get all trips - this is a placeholder'});
// });

export default tripRouter;