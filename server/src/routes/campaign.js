import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { getRequests, acceptCampaign, declineCampaign, negotiateCampaign, getMyCampaigns, uploadContent } from '../controllers/campaignController.js';

const router = Router();
router.use(verifyToken);

router.get('/requests', getRequests);
router.get('/campaigns', getMyCampaigns);
router.put('/:id/accept', acceptCampaign);
router.put('/:id/decline', declineCampaign);
router.put('/:id/negotiate', negotiateCampaign);
router.put('/:id/upload-content', upload.single('content'), uploadContent);

export default router;
