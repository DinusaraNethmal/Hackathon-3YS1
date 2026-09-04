const express = require('express');
const router = express.Router();
const { handleChatMessage } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');

// POST /api/chat - Interact with RouteLK AI Assistant (Gemini / MongoDB engine)
router.post('/', optionalAuth, handleChatMessage);

module.exports = router;

