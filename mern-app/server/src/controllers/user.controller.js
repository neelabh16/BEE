const validator = require('validator');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const Community = require('../models/Community.model');
const CodexEntry = require('../models/CodexEntry.model');
const Portfolio = require('../models/Portfolio.model');
const Activity = require('../models/Activity.model');
const Hackathon = require('../models/Hackathon.model');
const Bookmark = require('../models/Bookmark.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user public profile by username
// @route   GET /api/v1/users/profile/:username
// @access  Public
const getProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    const error = new Error('Username parameter is required');
    error.statusCode = 400;
    throw error;
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = await User.findOne({ username: cleanUsername })
    .select('-email')
    .lean();

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const [portfolio, projects, stats] = await Promise.all([
    Portfolio.findOne({ user: user._id, isPublic: true }).lean(),
    Project.find({ owner: user._id, status: 'published' })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Promise.all([
      Project.countDocuments({ owner: user._id, status: 'published' }),
      Community.countDocuments({ members: user._id }),
      CodexEntry.countDocuments({ author: user._id }),
    ]),
  ]);

  res.json({
    success: true,
    data: {
      ...user,
      portfolio,
      projects,
      stats: {
        projects: stats[0],
        communities: stats[1],
        codexEntries: stats[2],
      },
    },
    message: 'User profile retrieved successfully',
  });
});

// @desc    Update current user profile
// @route   PUT /api/v1/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'displayName',
    'bio',
    'skills',
    'interests',
    'avatar',
    'githubUrl',
    'linkedinUrl',
    'websiteUrl',
    'twitterUrl',
    'location',
    'title',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (typeof req.body[field] === 'string') {
        updates[field] = req.body[field].trim();
      } else {
        updates[field] = req.body[field];
      }
    }
  });

  // Validate displayName if provided
  if (updates.displayName !== undefined) {
    if (updates.displayName.length < 2 || updates.displayName.length > 50) {
      const error = new Error('Display name must be between 2 and 50 characters');
      error.statusCode = 400;
      throw error;
    }
  }

  // Validate URLs if provided
  const urlFields = ['githubUrl', 'linkedinUrl', 'websiteUrl', 'twitterUrl'];
  for (const urlField of urlFields) {
    if (updates[urlField] && updates[urlField] !== '') {
      if (!validator.isURL(updates[urlField], { require_protocol: false })) {
        const error = new Error(`Please provide a valid URL for ${urlField}`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // Ensure skills/interests are arrays if provided
  if (updates.skills !== undefined) {
    updates.skills = Array.isArray(updates.skills)
      ? updates.skills.map((s) => String(s).trim()).filter(Boolean)
      : [];
  }
  if (updates.interests !== undefined) {
    updates.interests = Array.isArray(updates.interests)
      ? updates.interests.map((i) => String(i).trim()).filter(Boolean)
      : [];
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  // Synchronize basic portfolio fields
  if (updates.skills || updates.title || updates.bio) {
    await Portfolio.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(updates.skills && { skills: updates.skills }),
        ...(updates.title && { headline: updates.title }),
        ...(updates.bio && { about: updates.bio }),
      }
    );
  }

  // Log activity
  await Activity.create({
    user: req.user._id,
    type: 'profile_updated',
    target: req.user._id,
    targetModel: 'User',
    description: 'Updated profile information',
  });

  res.json({
    success: true,
    data: updatedUser.toSafeObject ? updatedUser.toSafeObject() : updatedUser,
    message: 'Profile updated successfully',
  });
});

// @desc    Change current user password
// @route   PUT /api/v1/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    const error = new Error('Both currentPassword and newPassword are required');
    error.statusCode = 400;
    throw error;
  }

  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await user.comparePassword(currentPassword))) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 401;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    data: null,
    message: 'Password changed successfully',
  });
});

// @desc    Search users by displayName or username with pagination
// @route   GET /api/v1/users
// @access  Public
const searchUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const searchQuery = (req.query.q || req.query.search || '').trim();
  const filter = {};

  if (searchQuery) {
    const regex = new RegExp(searchQuery, 'i');
    filter.$or = [
      { displayName: regex },
      { username: regex },
      { title: regex },
    ];
  }

  if (req.query.skill) {
    filter.skills = { $in: [new RegExp(`^${req.query.skill.trim()}$`, 'i')] };
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-email')
      .sort({ score: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Users retrieved successfully',
  });
});

// @desc    Get counts of user projects, communities, and codex entries
// @route   GET /api/v1/users/:id/stats
// @access  Public
const getUserStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id).select('_id');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const [projectsCount, communitiesCount, codexEntriesCount, hackathonsCount] = await Promise.all([
    Project.countDocuments({ owner: id }),
    Community.countDocuments({ members: id }),
    CodexEntry.countDocuments({ author: id }),
    Hackathon.countDocuments({ $or: [{ organizer: id }, { participants: id }] }),
  ]);

  res.json({
    success: true,
    data: {
      projects: projectsCount,
      communities: communitiesCount,
      codexEntries: codexEntriesCount,
      codex: codexEntriesCount,
      hackathons: hackathonsCount,
    },
    message: 'User stats retrieved successfully',
  });
});

// Backward-compatibility aliases
const getUsers = searchUsers;
const getUserByUsername = getProfile;
const getUserActivities = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 15));
  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    Activity.find({ user: id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('target')
      .lean(),
    Activity.countDocuments({ user: id }),
  ]);

  res.json({
    success: true,
    data: activities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'User activities retrieved successfully',
  });
});

// @desc    Get current user bookmarked projects and codex entries
// @route   GET /api/v1/users/bookmarks
// @access  Private
const getUserBookmarks = asyncHandler(async (req, res) => {
  const [projectBookmarks, codexBookmarks] = await Promise.all([
    Bookmark.find({ user: req.user._id, targetModel: 'Project' }).lean(),
    Bookmark.find({ user: req.user._id, targetModel: 'CodexEntry' }).lean(),
  ]);

  const projectIds = projectBookmarks.map((b) => b.target);
  const codexIds = codexBookmarks.map((b) => b.target);

  const [projects, codexEntries] = await Promise.all([
    Project.find({ _id: { $in: projectIds } })
      .populate('owner', 'displayName username avatar title')
      .lean(),
    CodexEntry.find({ _id: { $in: codexIds } })
      .populate('author', 'displayName username avatar title')
      .lean(),
  ]);

  res.json({
    success: true,
    data: {
      projects,
      codex: codexEntries,
    },
    message: 'Bookmarks retrieved successfully',
  });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
  getUserStats,
  getUsers,
  getUserByUsername,
  getUserActivities,
  getUserBookmarks,
};
