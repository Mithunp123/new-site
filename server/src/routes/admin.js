const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdmin } = require('../middleware/auth');

router.use(verifyAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Creators
router.get('/creators', adminController.getCreators);
router.get('/creator/:id', adminController.getCreatorById);
router.put('/creator/:id/verify', adminController.verifyCreator);
router.put('/creator/:id/unverify', adminController.unverifyCreator);
router.put('/creator/:id/activate', adminController.activateCreator);
router.put('/creator/:id/deactivate', adminController.deactivateCreator);
router.put('/creator/:id/flag-fake', adminController.flagFake);
router.put('/creator/:id/clear-flag', adminController.clearFlag);
router.put('/creator/:id/fake-check', adminController.fakeCheck);

// Brands
router.get('/brands', adminController.getBrands);
router.get('/brand/:id', adminController.getBrandById);
router.put('/brand/:id/activate', adminController.activateBrand);
router.put('/brand/:id/deactivate', adminController.deactivateBrand);

// Campaigns
router.get('/campaigns', adminController.getCampaigns);
router.put('/campaign/:id/approve', adminController.adminApproveCampaign);
router.put('/campaign/:id/post-live', adminController.postLive);
router.put('/campaign/:id/add-analytics', adminController.addAnalytics);
router.put('/campaign/:id/release-escrow', adminController.releaseEscrow);
router.put('/campaign/:id/close', adminController.closeCampaign);

// Disputes
router.get('/disputes', adminController.getDisputes);
router.put('/dispute/:id/review', adminController.reviewDispute);
router.put('/dispute/:id/resolve', adminController.resolveDispute);

// Commissions & Analytics
router.get('/commissions', adminController.getCommissions);
router.get('/analytics', adminController.getAnalytics);
router.get('/suspicious-creators', adminController.getSuspiciousCreators);

// Notifications
router.post('/notifications/send', adminController.sendNotification);

module.exports = router;
