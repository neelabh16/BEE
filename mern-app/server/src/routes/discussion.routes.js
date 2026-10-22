const express = require('express');
const router = express.Router();
const {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  deleteReply,
} = require('../controllers/discussion.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/community/:communityId', validateObjectId('communityId'), validatePagination, getDiscussions);
router.get('/:id', validateObjectId, getDiscussion);
router.post('/', protect, createDiscussion);
router.put('/:id', protect, validateObjectId, updateDiscussion);
router.delete('/:id', protect, validateObjectId, deleteDiscussion);
router.post('/:id/replies', protect, validateObjectId, addReply);
router.delete('/:discussionId/replies/:replyId', protect, deleteReply);

module.exports = router;
