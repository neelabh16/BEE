const express = require('express');
const router = express.Router();
const {
  getCommunities,
  getCommunityBySlug,
  getCommunity,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getMembers,
  getUserCommunities,
} = require('../controllers/community.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/', validatePagination, getCommunities);
router.get('/user/:userId', validateObjectId('userId'), getUserCommunities);
router.get('/slug/:slug', getCommunityBySlug);
router.get('/:id', validateObjectId, getCommunity);
router.post('/', protect, createCommunity);
router.put('/:id', protect, validateObjectId, updateCommunity);
router.delete('/:id', protect, validateObjectId, deleteCommunity);
router.post('/:id/join', protect, validateObjectId, joinCommunity);
router.post('/:id/leave', protect, validateObjectId, leaveCommunity);
router.get('/:id/members', validateObjectId, validatePagination, getMembers);

module.exports = router;
