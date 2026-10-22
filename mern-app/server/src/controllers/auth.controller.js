const validator = require('validator');
const User = require('../models/User.model');
const Portfolio = require('../models/Portfolio.model');
const Activity = require('../models/Activity.model');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { displayName, username, email, password, title, bio } = req.body;

  // Validate presence
  if (!displayName || !username || !email || !password) {
    const error = new Error('Please provide displayName, username, email, and password');
    error.statusCode = 400;
    throw error;
  }

  // Validate displayName length
  if (typeof displayName !== 'string' || displayName.trim().length < 2 || displayName.trim().length > 50) {
    const error = new Error('Display name must be between 2 and 50 characters');
    error.statusCode = 400;
    throw error;
  }

  // Validate username: 3-30 chars, alphanumeric with optional hyphens/underscores
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3 || cleanUsername.length > 30 || !/^[a-z0-9_-]+$/.test(cleanUsername)) {
    const error = new Error('Username must be between 3 and 30 characters and alphanumeric');
    error.statusCode = 400;
    throw error;
  }

  // Validate email format
  const cleanEmail = email.trim().toLowerCase();
  if (!validator.isEmail(cleanEmail)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }

  // Validate password length (min 6 chars)
  if (typeof password !== 'string' || password.length < 6) {
    const error = new Error('Password must be at least 6 characters long');
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate email
  const existingEmail = await User.findOne({ email: cleanEmail });
  if (existingEmail) {
    const error = new Error('An account with this email already exists');
    error.statusCode = 409;
    throw error;
  }

  // Check duplicate username
  const existingUsername = await User.findOne({ username: cleanUsername });
  if (existingUsername) {
    const error = new Error('Username is already taken');
    error.statusCode = 409;
    throw error;
  }

  // Create user
  const user = await User.create({
    displayName: displayName.trim(),
    username: cleanUsername,
    email: cleanEmail,
    password,
    title: title ? title.trim() : '',
    bio: bio ? bio.trim() : '',
    score: 10,
  });

  // Create default portfolio record
  await Portfolio.create({
    user: user._id,
    headline: user.title || `${user.displayName}'s Dev Portfolio`,
    about: user.bio || '',
    skills: user.skills || [],
    isPublic: true,
  });

  // Log activity
  await Activity.create({
    user: user._id,
    type: 'profile_updated',
    target: user._id,
    targetModel: 'User',
    description: 'Joined DevVerse community!',
  });

  // Generate token and cookie
  generateToken(res, user._id);

  res.status(201).json({
    success: true,
    data: user.toSafeObject(),
    message: 'Registration successful',
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    const error = new Error('Please provide email and password');
    error.statusCode = 400;
    throw error;
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!validator.isEmail(cleanEmail)) {
    const error = new Error('Please provide a valid email address');
    error.statusCode = 400;
    throw error;
  }

  // Find user and include select('+password')
  const user = await User.findOne({ email: cleanEmail }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  generateToken(res, user._id);

  res.json({
    success: true,
    data: user.toSafeObject(),
    message: 'Login successful',
  });
});

// @desc    Logout user & clear cookie
// @route   POST /api/v1/auth/logout
// @access  Public
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });

  res.json({
    success: true,
    data: null,
    message: 'Logged out successfully',
  });
});

// @desc    Get currently logged in user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: user.toSafeObject(),
    message: 'User profile retrieved successfully',
  });
});

// @desc    Update current user profile
// @route   PUT /api/v1/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const allowedUpdates = [
    'displayName',
    'bio',
    'avatar',
    'skills',
    'interests',
    'githubUrl',
    'linkedinUrl',
    'websiteUrl',
    'twitterUrl',
    'location',
    'title',
    'theme',
  ];

  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });

  if (updates.skills || updates.title || updates.bio) {
    await Portfolio.findOneAndUpdate(
      { user: user._id },
      {
        ...(updates.skills && { skills: updates.skills }),
        ...(updates.title && { headline: updates.title }),
        ...(updates.bio && { about: updates.bio }),
      }
    );
  }

  res.json({
    success: true,
    data: user.toSafeObject(),
    message: 'Profile updated successfully',
  });
});

// @desc    Update user password
// @route   PUT /api/v1/auth/password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    const error = new Error('Please provide currentPassword and newPassword');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 6) {
    const error = new Error('New password must be at least 6 characters');
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

  generateToken(res, user._id);

  res.json({
    success: true,
    data: null,
    message: 'Password updated successfully',
  });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateMe,
  updatePassword,
};
