const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/:conversationId', protect, validateObjectId('conversationId'), validatePagination, getMessages);
router.post('/:conversationId', protect, validateObjectId('conversationId'), sendMessage);

module.exports = router;
