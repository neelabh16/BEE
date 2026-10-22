const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateConversation,
  getConversation,
} = require('../controllers/conversation.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');

router.get('/', protect, getConversations);
router.post('/', protect, getOrCreateConversation);
router.get('/:id', protect, validateObjectId, getConversation);

module.exports = router;
