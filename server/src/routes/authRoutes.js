const express = require('express');
const instagramController = require('../controllers/instagramController');

const router = express.Router();

router.get('/facebook', instagramController.redirectToFacebook);
router.get('/facebook/callback', instagramController.facebookCallback);

module.exports = router;
