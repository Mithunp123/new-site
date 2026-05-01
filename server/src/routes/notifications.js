import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getNotifications, markAsRead } from '../controllers/notificationsController.js';

const router = Router();
router.use(verifyToken);
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export default router;
