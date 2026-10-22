const express = require('express');
const router = express.Router();
const {
  getHackathons,
  getHackathonBySlug,
  getHackathon,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  registerForHackathon,
  unregisterFromHackathon,
  getParticipants,
} = require('../controllers/hackathon.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/', validatePagination, getHackathons);
router.get('/slug/:slug', getHackathonBySlug);
router.get('/:id', validateObjectId, getHackathon);
router.post('/', protect, createHackathon);
router.put('/:id', protect, validateObjectId, updateHackathon);
router.delete('/:id', protect, validateObjectId, deleteHackathon);
router.post('/:id/register', protect, validateObjectId, registerForHackathon);
router.post('/:id/unregister', protect, validateObjectId, unregisterFromHackathon);
router.get('/:id/participants', validateObjectId, getParticipants);

module.exports = router;
