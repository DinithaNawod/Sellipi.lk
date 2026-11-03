import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import { accountRole, accountStatus } from '../utils/accounts.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please sign in to continue.' });
  }
  let claims;
  try {
    claims = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    if (!claims || typeof claims !== 'object' || !mongoose.isValidObjectId(claims.id)) throw new Error('Invalid identity');
  } catch {
    return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
  }
  try {
    // Resolve permissions from MongoDB on every request, never from a stale JWT.
    const account = await Admin.findById(claims.id);
    if (!account) return res.status(401).json({ message: 'This account no longer exists.' });
    if (accountStatus(account) !== 'active') {
      return res.status(403).json({ message: 'Your account has been suspended. Please contact an administrator.', code: 'ACCOUNT_SUSPENDED' });
    }
    req.user = account;
    next();
  } catch (err) { next(err); }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Please sign in to continue.' });
    if (!roles.includes(accountRole(req.user))) return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    next();
  };
}
