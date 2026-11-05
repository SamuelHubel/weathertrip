// router for user authentication (register and login)
import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, deleteAccount } from '../controllers/authController.js';
import optionalAuth from '../middleware/authMiddleware.js';

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.delete('/me', authLimiter, optionalAuth, deleteAccount);

export default authRouter;