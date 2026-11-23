import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { stats, listUsers, updateUser, listNotes, reviewNote } from '../controllers/adminController.js';
import { updateSiteContent, uploadSiteVideo } from '../controllers/siteContentController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEOS_DIR = path.join(__dirname, '..', 'uploads', 'videos');
fs.mkdirSync(VIDEOS_DIR, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: VIDEOS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.mp4';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (_req, file, cb) => {
    const allowedExt = /^\.(mp4|webm|ogg|ogv|mov|m4v)$/i;
    const allowedMime = /^video\/(mp4|webm|ogg|quicktime|x-m4v)$/i;
    if (allowedExt.test(path.extname(file.originalname)) && allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Only video files are allowed (MP4, WebM, OGG, MOV, M4V).');
      err.statusCode = 400;
      cb(err);
    }
  },
});

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.put('/site-content', updateSiteContent);
router.post('/site-content/upload-video', uploadVideo.single('video'), uploadSiteVideo);
router.get('/stats', stats);
router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.get('/notes', listNotes);
router.patch('/notes/:id', reviewNote);
export default router;
