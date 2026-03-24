import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tripRouter from './routes/trips.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/trips', tripRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});