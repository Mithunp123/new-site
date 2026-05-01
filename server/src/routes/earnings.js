import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getEarnings, withdraw } from '../controllers/earningsController.js';

const router = Router();
router.use(verifyToken);
router.get('/', getEarnings);
router.post('/withdraw', withdraw);

export default router;
