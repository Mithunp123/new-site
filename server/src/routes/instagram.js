const express = require('express');
const instagramController = require('../controllers/instagramController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/auth/facebook', instagramController.redirectToFacebook);
router.get('/auth/facebook/callback', instagramController.facebookCallback);

router.get('/instagram/profile', instagramController.getProfile);
router.get('/instagram/reels', instagramController.getReels);
router.get('/instagram/reel-insights/:mediaId', instagramController.getInsights);
router.post('/instagram/save-current', verifyToken, instagramController.saveCurrentConnection);
router.post('/instagram/disconnect', verifyToken, instagramController.disconnect);

module.exports = router;
