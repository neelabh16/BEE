const express = require('express');
const router = express.Router();
const {
  sendRequest,
  getMyRequests,
  getSentRequests,
  respondToRequest,
  getConnections,
  searchDevelopers,
} = require('../controllers/squad.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.post('/request', protect, sendRequest);
router.get('/requests/received', protect, getMyRequests);
router.get('/requests/sent', protect, getSentRequests);
router.put('/requests/:id', protect, validateObjectId, respondToRequest);
router.get('/connections', protect, getConnections);
router.get('/search', protect, validatePagination, searchDevelopers);

module.exports = router;
