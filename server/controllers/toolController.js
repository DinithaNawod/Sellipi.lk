import path from 'path';
import { fileURLToPath } from 'url';
import { processImage } from '../utils/imageProcessor.js';
import { runOcr } from '../utils/ocrEngine.js';
import { translateText } from '../utils/translator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Public one-shot pipeline: upload image -> preprocess -> OCR -> translate.
// Unlike the per-inscription endpoints, this touches no database and needs no
// auth. It powers the public "Translate" tool.
export const translateImage = async (req, res, next) => {
  try {
    if (!req.file) {
      const e = new Error('No image uploaded'); e.statusCode = 400; return next(e);
    }

    const scriptType = req.body.scriptType || '';

    const originalUrl = `/uploads/originals/${req.file.filename}`;
    const processedFilename = `processed_${req.file.filename.replace(/\.[^.]+$/, '.png')}`;
    const processedPath = path.join(UPLOADS_DIR, 'processed', processedFilename);
    const processedUrl = `/uploads/processed/${processedFilename}`;

    // Enhance the image for OCR (grayscale -> contrast -> blur -> Otsu binarize)
    await processImage(req.file.path, processedPath);

    // OCR runs on the enhanced image for better accuracy
    const { text, confidence } = await runOcr(processedPath);

    // Translation is best-effort: a failure here (e.g. missing API key) must not
    // discard the OCR result the user is waiting for.
    let translation = '';
    let translationError = '';
    if (text.trim()) {
      try {
        translation = await translateText(text, scriptType);
      } catch (err) {
        translationError = err instanceof Error ? err.message : 'Translation failed';
      }
    } else {
      translationError = 'No readable text was detected in the image.';
    }

    res.json({
      imageUrl: originalUrl,
      imageProcessedUrl: processedUrl,
      text,
      confidence,
      translation,
      translationError,
    });
  } catch (err) { next(err); }
};
