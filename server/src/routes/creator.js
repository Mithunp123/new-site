const express = require('express');
const router = express.Router();
const creatorController = require('../controllers/creatorController');
const { verifyToken } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(verifyToken);

// Profile
router.get('/profile', creatorController.getProfile);
router.patch('/profile', creatorController.updateProfile);
router.patch('/profile/photo', upload.single('profile_photo'), creatorController.updateProfilePhoto);
router.patch('/password', creatorController.updatePassword);
router.delete('/account', creatorController.deactivateAccount);

// Social & Niche
router.get('/social-profiles', creatorController.getSocialProfiles);
router.post('/social-profiles', creatorController.upsertSocialProfile);
router.get('/niche-details', creatorController.getNicheDetails);
router.post('/niche-details', upload.multiple('screenshots', 5), creatorController.upsertNicheDetails);

// Dashboard
router.get('/dashboard', creatorController.getDashboard);

// Requests & Campaigns
router.get('/requests', creatorController.getRequests);
router.get('/requests/:campaignId', creatorController.getRequestById);
router.put('/requests/:campaignId/accept', creatorController.acceptRequest);
router.put('/requests/:campaignId/decline', creatorController.declineRequest);
router.post('/requests/:campaignId/negotiate', creatorController.negotiateRequest);

router.get('/campaigns', creatorController.getCampaigns);
router.get('/campaigns/:campaignId', creatorController.getCampaignById);
// Accept file upload OR JSON body with content_url
router.post('/campaigns/:campaignId/upload-content', (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.uploadContent(req, res, next);
  } else {
    next(); // JSON body — skip multer
  }
}, creatorController.uploadContent);
router.get('/campaigns/:campaignId/submissions', creatorController.getCampaignSubmissions);

// Earnings
router.get('/earnings', creatorController.getEarnings);
router.post('/earnings/withdraw', creatorController.withdrawEarnings);

// Analytics & Leads
router.get('/analytics', creatorController.getAnalytics);
router.get('/leads', creatorController.getLeads);

// Notifications
router.get('/notifications', creatorController.getNotifications);
router.patch('/notifications/:id/read', creatorController.markNotificationRead);

module.exports = router;
