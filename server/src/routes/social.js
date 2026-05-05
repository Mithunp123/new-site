const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');

router.get('/instagram', socialController.fetchInstagramData);
router.get('/youtube', socialController.fetchYoutubeData);

module.exports = router;
