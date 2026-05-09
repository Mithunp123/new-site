const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken);

router.get('/:id', campaignController.getCampaignDetail);
router.put('/:id/accept', campaignController.acceptCampaign);
router.put('/:id/decline', campaignController.declineCampaign);
router.put('/:id/upload-content', upload.single('content'), campaignController.uploadContent);
router.get('/:id/analytics', campaignController.getAnalytics);
router.post('/:id/dispute', campaignController.raiseDispute);
router.post('/:id/negotiate', campaignController.submitNegotiation);
router.put('/:id/accept-offer', campaignController.acceptOffer);

module.exports = router;
