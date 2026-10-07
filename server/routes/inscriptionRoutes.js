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
import { requireAuth } from '../middleware/auth.js';

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
router.route('/').get(getInscriptions).post(requireAuth, createInscription);
router.route('/:id').get(getInscriptionById).put(requireAuth, updateInscription).delete(requireAuth, deleteInscription);

// AI endpoints (auth required)
router.post('/:id/upload-image', requireAuth, upload.single('image'), uploadImage);
router.post('/:id/ocr', requireAuth, ocrInscription);
router.post('/:id/translate', requireAuth, translateInscription);

export default router;
