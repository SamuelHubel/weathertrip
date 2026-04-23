import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ error: 'Email already in use' });

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hash });
  res.json({ token: signToken(user._id), email: user.email });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

  res.json({ token: signToken(user._id), email: user.email });
};