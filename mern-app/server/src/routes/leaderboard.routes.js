const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  recalculateScores,
} = require('../controllers/leaderboard.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

router.get('/', getLeaderboard);
router.post('/recalculate', protect, adminOnly, recalculateScores);

module.exports = router;
