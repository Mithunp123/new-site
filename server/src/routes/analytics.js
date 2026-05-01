import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();
router.use(verifyToken);
router.get('/', getAnalytics);

export default router;
