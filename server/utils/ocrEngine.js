import Tesseract from 'tesseract.js';

export async function runOcr(imagePath) {
  // Run OCR with Sinhala + English language packs
  // Tesseract.js downloads language data on first use and caches it
  const result = await Tesseract.recognize(imagePath, 'sin+eng', {
    logger: () => {}, // suppress progress logs
  });

  const text = result.data.text.trim();
  const confidence = Math.round(result.data.confidence);

  return { text, confidence };
}
