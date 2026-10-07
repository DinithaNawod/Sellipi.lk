import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import Inscription from '../models/Inscription.js';
import { processImage } from '../utils/imageProcessor.js';
import { runOcr } from '../utils/ocrEngine.js';
import { translateText } from '../utils/translator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

export const getInscriptions = async (req, res, next) => {
  try {
    const { search, location, historicalPeriod, scriptType, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (search?.trim()) filter.$text = { $search: search.trim() };
    if (location) filter['location.name'] = { $regex: location, $options: 'i' };
    if (historicalPeriod) filter.historicalPeriod = { $regex: historicalPeriod, $options: 'i' };
    if (scriptType) filter.scriptType = scriptType;

    const skip = (Number(page) - 1) * Number(limit);
    const [inscriptions, total] = await Promise.all([
      Inscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Inscription.countDocuments(filter),
    ]);

    res.json({
      inscriptions,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getInscriptionById = async (req, res, next) => {
  try {
    const inscription = await Inscription.findById(req.params.id);
    if (!inscription) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }
    res.json(inscription);
  } catch (err) { next(err); }
};

export const createInscription = async (req, res, next) => {
  try {
    const inscription = await Inscription.create(req.body);
    res.status(201).json(inscription);
  } catch (err) { next(err); }
};

export const updateInscription = async (req, res, next) => {
  try {
    const inscription = await Inscription.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!inscription) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }
    res.json(inscription);
  } catch (err) { next(err); }
};

export const deleteInscription = async (req, res, next) => {
  try {
    const inscription = await Inscription.findByIdAndDelete(req.params.id);
    if (!inscription) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }

    // Clean up uploaded files if they exist
    for (const urlField of [inscription.imageUrl, inscription.imageProcessedUrl]) {
      if (urlField?.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, '..', urlField);
        await fs.unlink(filePath).catch(() => {});
      }
    }

    res.json({ message: 'Inscription deleted successfully', id: req.params.id });
  } catch (err) { next(err); }
};

export const getFilterOptions = async (req, res, next) => {
  try {
    const [locations, periods, scripts] = await Promise.all([
      Inscription.distinct('location.name'),
      Inscription.distinct('historicalPeriod'),
      Inscription.distinct('scriptType'),
    ]);
    res.json({
      locations: locations.filter(Boolean).sort(),
      periods: periods.filter(Boolean).sort(),
      scripts: scripts.filter(Boolean).sort(),
    });
  } catch (err) { next(err); }
};

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const e = new Error('No file uploaded'); e.statusCode = 400; return next(e);
    }

    const inscription = await Inscription.findById(req.params.id);
    if (!inscription) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }

    // Remove old uploaded files
    for (const urlField of [inscription.imageUrl, inscription.imageProcessedUrl]) {
      if (urlField?.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, '..', urlField);
        await fs.unlink(filePath).catch(() => {});
      }
    }

    const originalUrl = `/uploads/originals/${req.file.filename}`;
    const processedFilename = `processed_${req.file.filename.replace(/\.[^.]+$/, '.png')}`;
    const processedPath = path.join(UPLOADS_DIR, 'processed', processedFilename);
    const processedUrl = `/uploads/processed/${processedFilename}`;

    // Run preprocessing pipeline
    await processImage(req.file.path, processedPath);

    inscription.imageUrl = originalUrl;
    inscription.imageProcessedUrl = processedUrl;
    await inscription.save();

    res.json({
      imageUrl: originalUrl,
      imageProcessedUrl: processedUrl,
      message: 'Image uploaded and processed successfully',
    });
  } catch (err) { next(err); }
};

export const ocrInscription = async (req, res, next) => {
  try {
    const inscription = await Inscription.findById(req.params.id);
    if (!inscription) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }

    // Prefer processed image for better OCR accuracy
    const imageUrl = inscription.imageProcessedUrl || inscription.imageUrl;
    if (!imageUrl) {
      const e = new Error('No image available for OCR. Upload an image first.'); e.statusCode = 400; return next(e);
    }

    let imagePath;
    if (imageUrl.startsWith('/uploads/')) {
      imagePath = path.join(UPLOADS_DIR, '..', imageUrl);
    } else {
      // External URL — pass directly to tesseract
      imagePath = imageUrl;
    }

    const { text, confidence } = await runOcr(imagePath);
    res.json({ text, confidence });
  } catch (err) { next(err); }
};

export const translateInscription = async (req, res, next) => {
  try {
    const inscription = await Inscription.findById(req.params.id);
    if (!inscription) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }

    const text = req.body.text || inscription.contentRaw;
    if (!text?.trim()) {
      const e = new Error('No text to translate. Add a transcription first.'); e.statusCode = 400; return next(e);
    }

    const translation = await translateText(text, inscription.scriptType);
    res.json({ translation });
  } catch (err) { next(err); }
};
