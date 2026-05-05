const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

// Works for both brand and creator — verifyToken reads role from JWT
router.use(verifyToken);

router.get('/conversations', chatController.getConversations);
router.get('/unread', chatController.getUnreadCount);
router.get('/:campaignId/messages', chatController.getMessages);
router.post('/:campaignId/messages', chatController.sendMessage);

module.exports = router;
