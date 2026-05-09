const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const notificationsController = require('../controllers/notificationsController');

router.use(verifyToken);

router.put('/read-all', notificationsController.markAllRead);

module.exports = router;
