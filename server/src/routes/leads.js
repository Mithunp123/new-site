import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { getLeads } from '../controllers/leadsController.js';

const router = Router();
router.use(verifyToken);
router.get('/', getLeads);

export default router;
