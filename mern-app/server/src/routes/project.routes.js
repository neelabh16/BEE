const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectBySlug,
  getUserProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleLike,
  toggleBookmark,
} = require('../controllers/project.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { validateObjectId, validatePagination } = require('../middleware/validate.middleware');

router.get('/', validatePagination, optionalAuth, getProjects);
router.get('/slug/:slug', optionalAuth, getProjectBySlug);
router.get('/user/:userId', validateObjectId('userId'), validatePagination, getUserProjects);
router.get('/:id', validateObjectId, optionalAuth, getProject);
router.post('/', protect, createProject);
router.put('/:id', protect, validateObjectId, updateProject);
router.delete('/:id', protect, validateObjectId, deleteProject);
router.post('/:id/like', protect, validateObjectId, toggleLike);
router.post('/:id/bookmark', protect, validateObjectId, toggleBookmark);

module.exports = router;
