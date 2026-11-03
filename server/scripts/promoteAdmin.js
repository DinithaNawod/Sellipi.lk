import 'dotenv/config';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:promote -- owner@example.com');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('Set MONGO_URI in .env before promoting an account.');
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGO_URI);
  const account = await Admin.findOneAndUpdate({ email }, { $set: { role: 'admin', status: 'active' } }, { new: true, runValidators: true });
  if (!account) {
    console.error('Account not found. Register this email through the website first.');
    process.exitCode = 1;
  } else console.log('Administrator access assigned. Sign out and sign in again to open /admin.');
} catch {
  // Do not log connection strings or credentials from database errors.
  console.error('Unable to update the account. Check MongoDB connectivity and database permissions.');
  process.exitCode = 1;
} finally { await mongoose.disconnect(); }
