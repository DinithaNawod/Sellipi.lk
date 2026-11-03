import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { myNotes } from '../controllers/noteController.js';
const router = Router();
router.get('/mine', requireAuth, requireRole('academic'), myNotes);
export default router;
