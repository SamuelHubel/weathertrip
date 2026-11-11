// router for user authentication (register and login)
import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, deleteAccount } from '../controllers/authController.js';
import optionalAuth from '../middleware/authMiddleware.js';

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 failed attempts per IP per window: slows password guessing
  skipSuccessfulRequests: true, // a correct sign-in doesn't use up the limit
  message: { error: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.delete('/me', authLimiter, optionalAuth, deleteAccount);

export default authRouter;