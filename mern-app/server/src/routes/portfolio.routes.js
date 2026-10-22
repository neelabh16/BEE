const express = require('express');
const router = express.Router();
const {
  getMyPortfolio,
  getPublicPortfolio,
  getPortfolio,
  updatePortfolio,
} = require('../controllers/portfolio.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId } = require('../middleware/validate.middleware');

router.get('/me', protect, getMyPortfolio);
router.get('/user/:username', getPublicPortfolio);
router.get('/:userId', validateObjectId('userId'), getPortfolio);
router.put('/me', protect, updatePortfolio);

module.exports = router;
