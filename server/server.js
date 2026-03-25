import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tripRouter from './routes/tripRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// basic route to test server is running
app.get('/', (req, res) => {
  res.send('Welcome to the Weather Trip API');
});
app.use('/api/trip', tripRouter);

// start server
// use PORT from environment variable or default to 5000 (localhost:5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});