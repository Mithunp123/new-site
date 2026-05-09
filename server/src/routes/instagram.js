const express = require('express');
const instagramController = require('../controllers/instagramController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/auth/facebook', instagramController.redirectToFacebook);
router.get('/auth/facebook/callback', instagramController.facebookCallback);

router.get('/instagram/pages', instagramController.getPages);
router.get('/instagram/profile', instagramController.getProfile);
router.get('/instagram/media', instagramController.getMedia);
router.get('/instagram/insights/:mediaId', instagramController.getInsights);
router.post('/instagram/save-current', verifyToken, instagramController.saveCurrentConnection);
router.post('/instagram/disconnect', verifyToken, instagramController.disconnect);

module.exports = router;
