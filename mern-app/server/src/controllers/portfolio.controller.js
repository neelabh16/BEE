const mongoose = require('mongoose');
const validator = require('validator');
const Portfolio = require('../models/Portfolio.model');
const User = require('../models/User.model');
const Project = require('../models/Project.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get portfolio by user ID
// @route   GET /api/v1/portfolios/:userId
// @access  Public
const getPortfolio = asyncHandler(async (req, res) => {
  const userId = req.params.userId || req.params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    const error = new Error('Invalid user ID format');
    error.statusCode = 400;
    throw error;
  }

  const portfolio = await Portfolio.findOne({ user: userId })
    .populate('user', 'displayName username avatar bio skills title githubUrl linkedinUrl websiteUrl twitterUrl location')
    .populate('projects');

  if (!portfolio) {
    const error = new Error('Portfolio not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: portfolio,
    message: 'Portfolio retrieved successfully',
  });
});

// @desc    Get current user's portfolio, creating default if not exists
// @route   GET /api/v1/portfolios/me
// @access  Private
const getMyPortfolio = asyncHandler(async (req, res) => {
  let portfolio = await Portfolio.findOne({ user: req.user._id })
    .populate('user', 'displayName username avatar bio skills title githubUrl linkedinUrl websiteUrl twitterUrl location')
    .populate('projects');

  if (!portfolio) {
    // Create default portfolio if it doesn't exist
    portfolio = await Portfolio.create({
      user: req.user._id,
      headline: req.user.title || `${req.user.displayName}'s Dev Portfolio`,
      about: req.user.bio || '',
      skills: req.user.skills || [],
      experience: [],
      achievements: [],
      projects: [],
      socialLinks: {
        github: req.user.githubUrl || '',
        linkedin: req.user.linkedinUrl || '',
        website: req.user.websiteUrl || '',
        twitter: req.user.twitterUrl || '',
      },
      isPublic: true,
    });

    portfolio = await Portfolio.findById(portfolio._id)
      .populate('user', 'displayName username avatar bio skills title githubUrl linkedinUrl websiteUrl twitterUrl location')
      .populate('projects');
  }

  res.json({
    success: true,
    data: portfolio,
    message: 'Portfolio retrieved successfully',
  });
});

// @desc    Get public portfolio by username
// @route   GET /api/v1/portfolios/user/:username
// @access  Public
const getPublicPortfolio = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    const error = new Error('Username is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const portfolio = await Portfolio.findOne({ user: user._id, isPublic: true })
    .populate('user', 'displayName username avatar bio skills title githubUrl linkedinUrl websiteUrl twitterUrl location')
    .populate({
      path: 'projects',
      match: { status: 'published' },
      populate: { path: 'owner', select: 'displayName username avatar' },
    });

  if (!portfolio) {
    const error = new Error('Public portfolio not found for this user');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: portfolio,
    message: 'Public portfolio retrieved successfully',
  });
});

// @desc    Update current user's portfolio
// @route   PUT /api/v1/portfolios/me
// @access  Private
const updatePortfolio = asyncHandler(async (req, res) => {
  const allowedFields = [
    'headline',
    'about',
    'skills',
    'experience',
    'achievements',
    'socialLinks',
    'projects',
    'isPublic',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.headline !== undefined && typeof updates.headline === 'string') {
    updates.headline = updates.headline.trim().substring(0, 150);
  }

  if (updates.about !== undefined && typeof updates.about === 'string') {
    updates.about = updates.about.trim().substring(0, 3000);
  }

  if (updates.skills !== undefined) {
    updates.skills = Array.isArray(updates.skills)
      ? updates.skills.map((s) => String(s).trim()).filter(Boolean)
      : [];
  }

  if (updates.socialLinks && typeof updates.socialLinks === 'object') {
    const validSocial = {};
    ['github', 'linkedin', 'twitter', 'website'].forEach((platform) => {
      if (updates.socialLinks[platform] !== undefined) {
        const urlVal = String(updates.socialLinks[platform]).trim();
        if (urlVal && !validator.isURL(urlVal, { require_protocol: false })) {
          const error = new Error(`Invalid URL provided for ${platform}`);
          error.statusCode = 400;
          throw error;
        }
        validSocial[platform] = urlVal;
      }
    });
    updates.socialLinks = validSocial;
  }

  if (updates.experience !== undefined && Array.isArray(updates.experience)) {
    updates.experience = updates.experience.map((exp) => ({
      role: String(exp.role || '').trim().substring(0, 100),
      company: String(exp.company || '').trim().substring(0, 100),
      startDate: String(exp.startDate || '').trim(),
      endDate: String(exp.endDate || 'Present').trim(),
      description: String(exp.description || '').trim().substring(0, 1000),
    }));
  }

  if (updates.achievements !== undefined && Array.isArray(updates.achievements)) {
    updates.achievements = updates.achievements.map((ach) => ({
      title: String(ach.title || '').trim().substring(0, 150),
      description: String(ach.description || '').trim().substring(0, 500),
      date: String(ach.date || '').trim(),
    }));
  }

  if (updates.projects !== undefined && Array.isArray(updates.projects)) {
    updates.projects = updates.projects.filter((pId) => mongoose.Types.ObjectId.isValid(pId));
  }

  const portfolio = await Portfolio.findOneAndUpdate(
    { user: req.user._id },
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  )
    .populate('user', 'displayName username avatar bio skills title githubUrl linkedinUrl websiteUrl twitterUrl location')
    .populate('projects');

  res.json({
    success: true,
    data: portfolio,
    message: 'Portfolio updated successfully',
  });
});

module.exports = {
  getPortfolio,
  getMyPortfolio,
  getPublicPortfolio,
  updatePortfolio,
};
