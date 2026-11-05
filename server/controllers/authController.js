import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Trip from '../models/Trip.js';

// create a token that expires in 7 days
// so user doesnt have to log in every single time
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });



// function to create an account
export const register = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(400).json({ error: 'Email and password required' });

    const normalizedEmail = email.trim().toLowerCase();
    // only sign-up checks these, so existing accounts with short passwords can still log in
    if (!normalizedEmail.includes('@') || password.length < 8)
      return res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters' });
    // check if email is already in use
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing)
      return res.status(409).json({ error: 'Email already in use' });
    // encrypt the password and create the user
    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ email: normalizedEmail, password: hash });
    // return a token for the new user
    res.json({ token: signToken(user._id), email: user.email });
  } catch (error) {
    // two sign-ups at once can both pass the check above; the unique index stops the second
    if (error.code === 11000)
      return res.status(409).json({ error: 'Email already in use' });
    console.error('Register error:', error.message);
    res.status(500).json({ error: 'Failed to create account' });
  }
};


// function to log in
export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string')
      return res.status(401).json({ error: 'Invalid credentials' });

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password)
      return res.status(401).json({ error: 'Invalid credentials' });

    //check if provided email and password belong to an existing user
    const user = await User.findOne({ email: normalizedEmail });
    // if not, return an error
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    // if valid, return a token for the user
    res.json({ token: signToken(user._id), email: user.email });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Failed to log in' });
  }
};

// function to delete an account and every trip it saved
// wrong password is 403, not 401, so the frontend doesn't treat it as an expired session
export const deleteAccount = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Sign in to delete your account' });
  try {
    const { password } = req.body ?? {};
    if (typeof password !== 'string')
      return res.status(403).json({ error: 'Incorrect password' });

    const user = await User.findById(req.user.id);
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(403).json({ error: 'Incorrect password' });

    // trips first, so a failure part way leaves the account in place to retry
    await Trip.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);
    res.status(204).end();
  } catch (err) {
    console.error('Account delete failed:', err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
