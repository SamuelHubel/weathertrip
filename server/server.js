import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tripRouter from './routes/tripRoutes.js';
import mongoose from 'mongoose';
import authRouter from './routes/authRoutes.js';


dotenv.config();


const allowedOrigins = [
  process.env.FRONTEND_URL,         
  'http://localhost:3000',           
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


app.use('/api/trip', tripRouter);
app.use('/api/auth', authRouter);

// connect to MongoDB using Mongoose
// shortcut: no retry after a failed first connect, restart the server once the database is back
mongoose.connect(process.env.MONGODB_URI)
  .catch((error) => console.error('MongoDB connection failed:', error.message));



// start server
// use PORT from environment variable or default to 5000 (localhost:5000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});