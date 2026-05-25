import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tripRouter from './routes/tripRoutes.js';
import mongoose from 'mongoose';
import authRouter from './routes/authRoutes.js';
import { defaultAllowedOrigins } from 'vite';

dotenv.config();

// Allow requests from your Amplify frontend (set FRONTEND_URL env var in Beanstalk)
const allowedOrigins = [
  process.env.FRONTEND_URL,         // e.g. https://main.xxxxxx.amplifyapp.com
  'http://localhost:3000',           // local dev
].filter(Boolean);



const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // allow curl/Postman (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) 
      return callback(null, true);

    callback(new Error(`CORS blocked: ${origin}`));
  },

  credentials: true,

}));

app.use(express.json());

// health check route
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'WeatherTrip API' });
});


// basic route to test server is running
app.get('/', (req, res) => {
  res.send('Welcome to the Weather Trip API');
});
app.use('/api/trip', tripRouter);
app.use('/api/auth', authRouter);

// connect to MongoDB using Mongoose
mongoose.connect(process.env.MONGODB_URI)



// start server
// use PORT from environment variable or default to 5000 (localhost:5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});