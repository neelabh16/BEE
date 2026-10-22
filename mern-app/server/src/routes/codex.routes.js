const express = require('express');
const router = express.Router();
const {
  getEntries,
  getEntryBySlug,
  getEntry,
  createEntry,
  updateEntry,
  deleteEntry,
  toggleBookmark,
} = require('../controllers/codex.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/', validatePagination, getEntries);
router.get('/slug/:slug', getEntryBySlug);
router.get('/:id', validateObjectId, getEntry);
router.post('/', protect, createEntry);
router.put('/:id', protect, validateObjectId, updateEntry);
router.delete('/:id', protect, validateObjectId, deleteEntry);
router.post('/:id/bookmark', protect, validateObjectId, toggleBookmark);

module.exports = router;
