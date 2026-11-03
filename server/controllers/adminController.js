import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import Note from '../models/Note.js';
import Inscription from '../models/Inscription.js';
import { accountRole, accountStatus, publicAccount } from '../utils/accounts.js';
import { pagination, pageInfo } from '../utils/pagination.js';

export async function stats(req, res, next) {
  try {
    const [users, academics, administrators, suspended, inscriptions, pending, approved, rejected] = await Promise.all([
      Admin.countDocuments(), Admin.countDocuments({ role: 'academic' }), Admin.countDocuments({ role: 'admin' }), Admin.countDocuments({ status: 'suspended' }),
      Inscription.countDocuments(), ...['pending', 'approved', 'rejected'].map(status => Note.countDocuments({ status })),
    ]);
    res.json({ users, academics, administrators, normalUsers: users - academics - administrators, suspended, inscriptions, pending, approved, rejected });
  } catch (err) { next(err); }
}

export async function listUsers(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const { search = '', role = '', status = '' } = req.query;
    if (typeof search !== 'string' || search.length > 100 || !['', 'user', 'academic', 'admin'].includes(role) || !['', 'active', 'suspended'].includes(status)) return res.status(400).json({ message: 'Invalid user filters.' });
    const conditions = [];
    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      conditions.push({ $or: [{ username: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }] });
    }
    if (role) conditions.push(role === 'user' ? { $or: [{ role: 'user' }, { role: { $exists: false } }] } : { role });
    if (status) conditions.push(status === 'active' ? { $or: [{ status: 'active' }, { status: { $exists: false } }] } : { status });
    const filter = conditions.length ? { $and: conditions } : {};
    const [users, total] = await Promise.all([
      Admin.find(filter).select('-password').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
      Admin.countDocuments(filter),
    ]);
    res.json({ users: users.map(publicAccount), pagination: pageInfo(total, page, limit) });
  } catch (err) { next(err); }
}

export async function updateUser(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid user ID.' });
    if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'You cannot change your own access.' });
    const { role, status, username, email, institution } = req.body;
    if ((role !== undefined && !['user', 'academic'].includes(role)) || (status !== undefined && !['active', 'suspended'].includes(status)) || [role, status, username, email, institution].every(value => value === undefined)) return res.status(400).json({ message: 'Choose valid profile details, a normal-user or academic role, or an active/suspended status.' });
    if (username !== undefined && (typeof username !== 'string' || !username.trim() || username.trim().length > 100)) return res.status(400).json({ message: 'Enter a username between 1 and 100 characters.' });
    if (email !== undefined && (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (institution !== undefined && (typeof institution !== 'string' || institution.trim().length > 200)) return res.status(400).json({ message: 'Institution must be text up to 200 characters.' });
    const changes = {};
    if (role !== undefined) changes.role = role;
    if (status !== undefined) changes.status = status;
    if (username !== undefined) changes.username = username.trim();
    if (email !== undefined) changes.email = email.trim().toLowerCase();
    if (institution !== undefined) changes.institution = institution.trim();
    // The predicate also protects administrators if another process promotes
    // the target between this request and the update.
    const user = await Admin.findOneAndUpdate({ _id: req.params.id, role: { $ne: 'admin' } }, { $set: changes }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found or administrator accounts cannot be changed here.' });
    res.json({ user: publicAccount(user) });
  } catch (err) { next(err); }
}

export async function listNotes(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const status = req.query.status || 'pending';
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid note status.' });
    const [notes, total] = await Promise.all([
      Note.find({ status }).populate('inscription', 'title').populate('author', 'username email institution role status').populate('reviewedBy', 'username').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Note.countDocuments({ status }),
    ]);
    res.json({ notes, pagination: pageInfo(total, page, limit) });
  } catch (err) { next(err); }
}

export async function reviewNote(req, res, next) {
  try {
    const { status, expectedStatus, moderationReason = '' } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID.' });
    if (!['approved', 'rejected'].includes(status) || !['pending', 'approved', 'rejected'].includes(expectedStatus) || status === expectedStatus || typeof moderationReason !== 'string' || moderationReason.trim().length > 1000) return res.status(400).json({ message: 'Choose a valid review decision and a reason of up to 1000 characters.' });
    const existing = await Note.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Note not found.' });
    if (status === 'approved') {
      if (!(await Inscription.exists({ _id: existing.inscription }))) return res.status(409).json({ message: 'The inscription no longer exists.' });
      const author = await Admin.findById(existing.author);
      if (!author || accountRole(author) !== 'academic' || accountStatus(author) !== 'active') return res.status(409).json({ message: 'Only notes from active academic accounts can be approved.' });
    }
    const note = await Note.findOneAndUpdate({ _id: req.params.id, status: expectedStatus }, { $set: { status, reviewedBy: req.user._id, reviewedAt: new Date(), moderationReason: moderationReason.trim() } }, { new: true, runValidators: true });
    if (!note) return res.status(409).json({ message: 'Another administrator changed this note. Refresh the list before reviewing it.' });
    res.json({ message: status === 'approved' ? 'Note approved and published.' : 'Note rejected and hidden from the public.', note });
  } catch (err) { next(err); }
}
