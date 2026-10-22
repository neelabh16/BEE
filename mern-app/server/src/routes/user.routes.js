const express = require('express');
const router = express.Router();
const {
  searchUsers,
  getProfile,
  updateProfile,
  changePassword,
  getUserStats,
  getUserActivities,
  getUserBookmarks,
} = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/', validatePagination, searchUsers);
router.get('/bookmarks', protect, getUserBookmarks);
router.get('/profile/:username', getProfile);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/:id/stats', validateObjectId, getUserStats);
router.get('/:id/activities', validateObjectId, getUserActivities);

module.exports = router;
