import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { publicAccount, accountStatus } from '../utils/accounts.js';

function session(account) {
  const token = jwt.sign({ id: String(account._id) }, process.env.JWT_SECRET, { expiresIn: '7d', algorithm: 'HS256' });
  return { token, user: publicAccount(account) };
}

export async function register(req, res, next) {
  try {
    const { username, email, password, role = 'user', institution = '' } = req.body;
    if (typeof username !== 'string' || !username.trim() || username.trim().length > 100 || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 6 || password.length > 200) {
      return res.status(400).json({ message: 'Enter a username, a valid email, and a password between 6 and 200 characters.' });
    }
    if (!['user', 'academic'].includes(role)) return res.status(400).json({ message: 'You can register as a normal user or an academic.' });
    if (typeof institution !== 'string' || institution.trim().length > 200 || (role === 'academic' && !institution.trim())) {
      return res.status(400).json({ message: 'Academic accounts must include their university or institution (up to 200 characters).' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const exists = await Admin.findOne({ $or: [{ email: normalizedEmail }, { username: username.trim() }] });
    if (exists) return res.status(409).json({ message: 'Username or email already taken.' });
    // Explicit allowlist: public registration can never create an admin or set status.
    const account = await Admin.create({ username: username.trim(), email: normalizedEmail, password, role, institution: role === 'academic' ? institution.trim() : '', status: 'active' });
    res.status(201).json(session(account));
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) return res.status(400).json({ message: 'Email and password are required.' });
    const account = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!account || !(await account.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials.' });
    if (accountStatus(account) !== 'active') return res.status(403).json({ message: 'Your account has been suspended. Please contact an administrator.', code: 'ACCOUNT_SUSPENDED' });
    res.json(session(account));
  } catch (err) { next(err); }
}

export function me(req, res) { res.json(publicAccount(req.user)); }
