import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: { type: String, default: 'site' },
  values: { type: Map, of: String, default: {} },
  revision: { type: Number, default: 0 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });
export default mongoose.model('SiteContent', schema);
