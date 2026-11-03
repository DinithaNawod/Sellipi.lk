import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  inscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Inscription', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  authorName: { type: String, required: true },
  authorInstitution: { type: String, default: '' },
  text: { type: String, trim: true, required: true, maxlength: 3000 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  reviewedAt: { type: Date, default: null },
  moderationReason: { type: String, trim: true, maxlength: 1000, default: '' },
}, { timestamps: true });

noteSchema.index({ inscription: 1, status: 1, reviewedAt: -1 });
noteSchema.index({ author: 1, createdAt: -1 });
noteSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model('Note', noteSchema);
