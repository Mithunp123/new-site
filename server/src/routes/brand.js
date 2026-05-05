const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brandController');
const { verifyBrand } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyBrand);

// Profile & Settings
router.get('/profile', brandController.getProfile);
router.patch('/profile', brandController.updateProfile);
router.post('/logo', upload.single('logo'), brandController.updateLogo);
router.patch('/password', brandController.updatePassword);
router.post('/preferences', brandController.upsertPreferences);
router.post('/verification', brandController.upsertVerification);
router.get('/settings', brandController.getProfile); // Settings is a merge of profile/prefs/verify
router.patch('/settings', brandController.updateProfile);

// Dashboard
router.get('/dashboard', brandController.getDashboard);

// Discovery
router.get('/discover', brandController.discoverCreators);
router.get('/creator/:id', brandController.getCreatorById);
router.post('/creator/:id/save', brandController.saveCreator);
router.delete('/creator/:id/save', brandController.unsaveCreator);
router.get('/saved-creators', brandController.getSavedCreators);

// Collaborations & Campaigns
router.post('/collaboration/send-request', brandController.sendCollaborationRequest);
router.get('/collaboration/requests', brandController.getCollaborationRequests);
router.get('/campaigns/tracking', brandController.getCampaignTracking);

// Brand Campaign Creation & Groups
router.post('/campaign/create', brandController.createCampaign);
router.get('/campaign/matched-creators', brandController.getMatchedCreators);
router.get('/campaigns/groups', brandController.getCampaignGroups);
router.get('/campaigns/group/:groupId', brandController.getCampaignGroupDetails);

// Content Submissions & Approvals
router.get('/campaign/:campaignId/submissions', brandController.getCampaignSubmissions);
router.put('/campaign/:campaignId/approve-content', brandController.approveContent);
router.put('/campaign/:campaignId/request-revision', brandController.requestRevision);
router.put('/campaign/:campaignId/mark-live', brandController.markCampaignLive);
router.put('/campaign/:campaignId/release-payment', brandController.releasePayment);

// Analytics
router.get('/roi-analytics', brandController.getROIAnalytics);
router.get('/lead-management', brandController.getLeadManagement);

// Legacy/Compatibility Routes
router.get('/campaigns', brandController.getCampaigns);
// router.put('/campaign/:id/reject-content', brandController.rejectContent); // Replaced by request-revision
router.post('/payments/fund-escrow', brandController.fundEscrow);

// Notifications
router.get('/notifications', brandController.getNotifications);
router.patch('/notifications/:id/read', brandController.markNotificationRead);

module.exports = router;
