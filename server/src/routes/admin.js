import { Router } from 'express';
import { verifyToken, adminOnly } from '../middleware/auth.js';
import { getAllCreators, verifyCreator, getAllCampaigns, approveCampaign, postLive, releaseEscrow, closeCampaign } from '../controllers/adminController.js';

const router = Router();
router.use(verifyToken, adminOnly);

router.get('/creators', getAllCreators);
router.put('/creator/:id/verify', verifyCreator);
router.get('/campaigns', getAllCampaigns);
router.put('/campaign/:id/approve', approveCampaign);
router.put('/campaign/:id/post-live', postLive);
router.put('/campaign/:id/release-escrow', releaseEscrow);
router.put('/campaign/:id/close', closeCampaign);

export default router;
