import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getInscriptions,
  getInscriptionById,
  createInscription,
  updateInscription,
  deleteInscription,
  getFilterOptions,
  uploadImage,
  ocrInscription,
  translateInscription,
} from '../controllers/inscriptionController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { publicNotes, submitNote } from '../controllers/noteController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'originals'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|tiff|bmp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, png, webp, tiff, bmp)'));
    }
  },
});

const router = Router();

router.get('/filters', getFilterOptions);
router.route('/').get(getInscriptions).post(requireAuth, requireRole('admin'), createInscription);
router.route('/:id').get(getInscriptionById).put(requireAuth, requireRole('admin'), updateInscription).delete(requireAuth, requireRole('admin'), deleteInscription);

export const noteLimiter = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many notes submitted. Please try again in a minute.' } });
router.get('/:id/notes', publicNotes);
router.post('/:id/notes', requireAuth, requireRole('academic'), noteLimiter, submitNote);

// AI endpoints (auth required)
router.post('/:id/upload-image', requireAuth, requireRole('admin'), upload.single('image'), uploadImage);
router.post('/:id/ocr', requireAuth, requireRole('admin'), ocrInscription);
router.post('/:id/translate', requireAuth, requireRole('admin'), translateInscription);

export default router;
