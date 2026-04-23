import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// create a token that expires in 7 days
// so user doesnt have to log in every single time
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });



// function to create an account
export const register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });
// check if email is already in use
  const existing = await User.findOne({ email });
  if (existing)
    return res.status(409).json({ error: 'Email already in use' });
// encrypt the password and create the user
  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, password: hash });
// return a token for the new user
  res.json({ token: signToken(user._id), email: user.email });
};


// function to log in
export const login = async (req, res) => {
  const { email, password } = req.body;
  //check if provided email and password belong to an existing user
  const user = await User.findOne({ email });
  // if not, return an error
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });

    // if valid, return a token for the user
  res.json({ token: signToken(user._id), email: user.email });
};