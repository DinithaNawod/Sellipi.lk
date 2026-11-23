import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import Inscription from '../models/Inscription.js';
import { processImage } from '../utils/imageProcessor.js';
import { runOcr } from '../utils/ocrEngine.js';
import { translateText } from '../utils/translator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getInscriptions = async (req, res, next) => {
  try {
    const { search, location, historicalPeriod, scriptType, publication, language, inscriptionNumber, page = 1, limit = 12 } = req.query;
    const filter = {};

    if (search?.trim()) {
      const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
      filter.$or = [
        { title: rx },
        { inscriptionNumber: rx },
        { publication: rx },
        { language: rx },
        { description: rx },
        { 'location.name': rx },
        { 'location.district': rx },
        { 'location.province': rx },
        { historicalPeriod: rx },
        { scriptType: rx },
        { contentRaw: rx },
        { contentTranslated: rx },
      ];
    }
    if (location) filter['location.name'] = { $regex: escapeRegex(location), $options: 'i' };
    if (historicalPeriod) filter.historicalPeriod = { $regex: escapeRegex(historicalPeriod), $options: 'i' };
    if (scriptType) filter.scriptType = scriptType;
    if (publication?.trim()) filter.publication = { $regex: `^${escapeRegex(publication.trim())}$`, $options: 'i' };
    if (language?.trim()) filter.language = { $regex: `^${escapeRegex(language.trim())}$`, $options: 'i' };
    if (inscriptionNumber?.trim()) filter.inscriptionNumber = { $regex: escapeRegex(inscriptionNumber.trim()), $options: 'i' };

    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 12));
    const skip = (currentPage - 1) * pageSize;

    const [inscriptions, total] = await Promise.all([
      Inscription.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Inscription.countDocuments(filter),
    ]);

    res.json({
      inscriptions,
      pagination: { total, page: currentPage, limit: pageSize, pages: Math.ceil(total / pageSize) },
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
    const existing = await Inscription.findById(req.params.id);
    if (!existing) { const e = new Error('Inscription not found'); e.statusCode = 404; return next(e); }

    const payload = { ...req.body };
    const imageCleared = payload.imageUrl === '' && (existing.imageUrl || existing.imageProcessedUrl);
    if (imageCleared) {
      payload.imageProcessedUrl = '';
    }

    const inscription = await Inscription.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });

    if (imageCleared) {
      for (const urlField of [existing.imageUrl, existing.imageProcessedUrl]) {
        if (urlField?.startsWith('/uploads/')) {
          const filePath = path.join(UPLOADS_DIR, '..', urlField);
          await fs.unlink(filePath).catch(() => {});
        }
      }
    }

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
    const [locations, periods, scripts, publications, languages] = await Promise.all([
      Inscription.distinct('location.name'),
      Inscription.distinct('historicalPeriod'),
      Inscription.distinct('scriptType'),
      Inscription.distinct('publication'),
      Inscription.distinct('language'),
    ]);
    res.json({
      locations: locations.filter(Boolean).sort(),
      periods: periods.filter(Boolean).sort(),
      scripts: scripts.filter(Boolean).sort(),
      publications: publications.filter(Boolean).sort(),
      languages: languages.filter(Boolean).sort(),
    });
  } catch (err) { next(err); }
};

export const getPublicStats = async (req, res, next) => {
  try {
    const [inscriptions, rawSites, rawScripts, rawLanguages] = await Promise.all([
      Inscription.countDocuments(),
      Inscription.distinct('location.name'),
      Inscription.distinct('scriptType'),
      Inscription.distinct('language'),
    ]);
    const sites = new Set(
      rawSites.map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : '')).filter(Boolean)
    ).size;
    const scripts = new Set(
      rawScripts.map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : '')).filter(Boolean)
    ).size;
    const languages = new Set(
      rawLanguages.map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : '')).filter(Boolean)
    ).size;
    res.set('Cache-Control', 'no-store');
    res.json({ inscriptions, sites, scripts, languages });
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
    let processedUrl = '';

    // Run preprocessing pipeline (best-effort so unsupported canvas formats like WebP/TIFF still save the original)
    try {
      await processImage(req.file.path, processedPath);
      processedUrl = `/uploads/processed/${processedFilename}`;
    } catch (procErr) {
      console.warn(`Image preprocessing skipped for ${req.file.filename}: ${procErr.message}`);
    }

    inscription.imageUrl = originalUrl;
    inscription.imageProcessedUrl = processedUrl;
    await inscription.save();

    res.json({
      imageUrl: originalUrl,
      imageProcessedUrl: processedUrl,
      message: processedUrl ? 'Image uploaded and processed successfully' : 'Image uploaded successfully',
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
