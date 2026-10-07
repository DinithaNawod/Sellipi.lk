import mongoose from 'mongoose';

const inscriptionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    imageProcessedUrl: { type: String, trim: true, default: '' },
    location: {
      name: { type: String, trim: true, default: '' },
      district: { type: String, trim: true, default: '' },
      province: { type: String, trim: true, default: '' },
      coordinates: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null },
      },
    },
    historicalPeriod: { type: String, trim: true, default: '' },
    scriptType: {
      type: String,
      enum: ['Brahmi', 'Ancient Sinhala', 'Grantha', 'Tamil Brahmi', 'Proto-Sinhala', 'Other', ''],
      default: '',
    },
    contentRaw: { type: String, trim: true, default: '' },
    contentTranslated: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

inscriptionSchema.index({ title: 'text', description: 'text', contentRaw: 'text' });

export default mongoose.model('Inscription', inscriptionSchema);
