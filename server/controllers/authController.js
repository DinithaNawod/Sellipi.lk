import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

function signToken(admin) {
  return jwt.sign(
    { id: admin._id, username: admin.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, and password are required' });
    }
    const exists = await Admin.findOne({ $or: [{ email }, { username }] });
    if (exists) {
      return res.status(409).json({ message: 'Username or email already taken' });
    }
    const admin = await Admin.create({ username, email, password });
    res.status(201).json({ token: signToken(admin), username: admin.username });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }
    const admin = await Admin.findOne({ email });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({ token: signToken(admin), username: admin.username });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res) {
  res.json({ id: req.admin.id, username: req.admin.username });
}
