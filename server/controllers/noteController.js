import mongoose from 'mongoose';
import Note from '../models/Note.js';
import Inscription from '../models/Inscription.js';
import { pagination, pageInfo } from '../utils/pagination.js';

async function validInscription(id, res) {
  if (!mongoose.isValidObjectId(id)) { res.status(400).json({ message: 'Invalid inscription ID.' }); return false; }
  if (!(await Inscription.exists({ _id: id }))) { res.status(404).json({ message: 'Inscription not found.' }); return false; }
  return true;
}

export async function publicNotes(req, res, next) {
  try {
    if (!(await validInscription(req.params.id, res))) return;
    const { page, limit, skip } = pagination(req.query);
    // Ignore caller-supplied status/author filters; private fields are never returned.
    const filter = { inscription: req.params.id, status: 'approved' };
    const [notes, total] = await Promise.all([
      Note.find(filter).select('_id text authorName authorInstitution createdAt reviewedAt').sort({ reviewedAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Note.countDocuments(filter),
    ]);
    res.json({ notes, pagination: pageInfo(total, page, limit) });
  } catch (err) { next(err); }
}

export async function submitNote(req, res, next) {
  try {
    const { text } = req.body;
    if (typeof text !== 'string' || !text.trim() || text.trim().length > 3000) return res.status(400).json({ message: 'Enter a note between 1 and 3000 characters.' });
    if (!(await validInscription(req.params.id, res))) return;
    const note = await Note.create({
      inscription: req.params.id,
      author: req.user._id,
      authorName: req.user.username,
      authorInstitution: req.user.institution || '',
      text: text.trim(),
      status: 'pending',
    });
    res.status(201).json({ message: 'Your note has been submitted for admin review. It will appear publicly only after approval.', note: { _id: note._id, text: note.text, status: note.status, createdAt: note.createdAt } });
  } catch (err) { next(err); }
}

export async function myNotes(req, res, next) {
  try {
    const { page, limit, skip } = pagination(req.query);
    const filter = { author: req.user._id };
    const [notes, total] = await Promise.all([
      Note.find(filter).select('-reviewedBy -author').populate('inscription', 'title').sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
      Note.countDocuments(filter),
    ]);
    res.json({ notes, pagination: pageInfo(total, page, limit) });
  } catch (err) { next(err); }
}
