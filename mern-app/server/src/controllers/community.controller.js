const validator = require('validator');
const Community = require('../models/Community.model');
const Discussion = require('../models/Discussion.model');
const Activity = require('../models/Activity.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all communities with pagination, search, and topic filter
// @route   GET /api/v1/communities
// @access  Public
const getCommunities = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const { topic, search, q, sort } = req.query;
  const filter = {};

  if (topic) {
    filter.topic = topic.trim().toLowerCase();
  }

  if (req.query.member) {
    filter.members = req.query.member;
  }

  const queryStr = (search || q || '').trim();
  if (queryStr) {
    const regex = new RegExp(queryStr, 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
    ];
  }

  const sortOption = sort === 'newest'
    ? { createdAt: -1 }
    : { membersCount: -1, createdAt: -1 };

  const [communities, total] = await Promise.all([
    Community.find(filter)
      .populate('owner', 'displayName username avatar title')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Community.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: communities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Communities retrieved successfully',
  });
});

// @desc    Get community by ID
// @route   GET /api/v1/communities/:id
// @access  Public
const getCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const community = await Community.findById(id).populate(
    'owner',
    'displayName username avatar bio skills title'
  );

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: community,
    message: 'Community retrieved successfully',
  });
});

// @desc    Get community by slug
// @route   GET /api/v1/communities/slug/:slug
// @access  Public
const getCommunityBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const community = await Community.findOne({ slug: slug.toLowerCase() }).populate(
    'owner',
    'displayName username avatar bio skills title'
  );

  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: community,
    message: 'Community retrieved successfully',
  });
});

// @desc    Create a new community
// @route   POST /api/v1/communities
// @access  Private
const createCommunity = asyncHandler(async (req, res) => {
  const { name, description, topic, avatar } = req.body;

  if (!name || !description || !topic) {
    const error = new Error('Please provide name, description, and topic');
    error.statusCode = 400;
    throw error;
  }

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    const error = new Error('Community name must be between 2 and 80 characters');
    error.statusCode = 400;
    throw error;
  }

  if (typeof description !== 'string' || description.trim().length === 0 || description.trim().length > 2000) {
    const error = new Error('Description must be between 1 and 2000 characters');
    error.statusCode = 400;
    throw error;
  }

  const validTopics = [
    'frontend',
    'backend',
    'fullstack',
    'mobile',
    'devops',
    'ai-ml',
    'blockchain',
    'cybersecurity',
    'design',
    'career',
    'general',
  ];

  if (!validTopics.includes(topic.trim().toLowerCase())) {
    const error = new Error(`Topic must be one of: ${validTopics.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const community = await Community.create({
    name: name.trim(),
    description: description.trim(),
    topic: topic.trim().toLowerCase(),
    avatar: avatar ? avatar.trim() : '',
    owner: req.user._id,
    members: [req.user._id],
    membersCount: 1,
  });

  // Create Activity
  await Activity.create({
    user: req.user._id,
    type: 'community_created',
    target: community._id,
    targetModel: 'Community',
    description: `Created community "${community.name}"`,
  });

  // Increment user score (+8)
  await User.findByIdAndUpdate(req.user._id, { $inc: { score: 8 } });

  await community.populate('owner', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: community,
    message: 'Community created successfully',
  });
});

// @desc    Update community
// @route   PUT /api/v1/communities/:id
// @access  Private
const updateCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const community = await Community.findById(id);
  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership
  if (community.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this community');
    error.statusCode = 403;
    throw error;
  }

  const { name, description, topic, avatar } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
      const error = new Error('Community name must be between 2 and 80 characters');
      error.statusCode = 400;
      throw error;
    }
    community.name = name.trim();
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length === 0 || description.trim().length > 2000) {
      const error = new Error('Description must be between 1 and 2000 characters');
      error.statusCode = 400;
      throw error;
    }
    community.description = description.trim();
  }

  if (topic !== undefined) {
    const validTopics = [
      'frontend',
      'backend',
      'fullstack',
      'mobile',
      'devops',
      'ai-ml',
      'blockchain',
      'cybersecurity',
      'design',
      'career',
      'general',
    ];
    if (!validTopics.includes(topic.trim().toLowerCase())) {
      const error = new Error(`Topic must be one of: ${validTopics.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    community.topic = topic.trim().toLowerCase();
  }

  if (avatar !== undefined) {
    community.avatar = avatar ? avatar.trim() : '';
  }

  await community.save();
  await community.populate('owner', 'displayName username avatar title');

  res.json({
    success: true,
    data: community,
    message: 'Community updated successfully',
  });
});

// @desc    Delete community
// @route   DELETE /api/v1/communities/:id
// @access  Private
const deleteCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const community = await Community.findById(id);
  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  if (community.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to delete this community');
    error.statusCode = 403;
    throw error;
  }

  await Community.findByIdAndDelete(id);

  // Delete associated discussions & activities
  await Promise.all([
    Discussion.deleteMany({ community: id }),
    Activity.deleteMany({ target: id, targetModel: 'Community' }),
  ]);

  res.json({
    success: true,
    data: null,
    message: 'Community deleted successfully',
  });
});

// @desc    Join a community
// @route   POST /api/v1/communities/:id/join
// @access  Private
const joinCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const community = await Community.findById(id);
  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const isAlreadyMember = community.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );

  if (isAlreadyMember) {
    return res.json({
      success: true,
      data: { isMember: true, membersCount: community.membersCount },
      message: 'You are already a member of this community',
    });
  }

  const updatedCommunity = await Community.findByIdAndUpdate(
    id,
    {
      $addToSet: { members: req.user._id },
      $inc: { membersCount: 1 },
    },
    { new: true }
  );

  // Create Activity
  await Activity.create({
    user: req.user._id,
    type: 'community_joined',
    target: community._id,
    targetModel: 'Community',
    description: `Joined community "${community.name}"`,
  });

  res.json({
    success: true,
    data: {
      isMember: true,
      membersCount: updatedCommunity.membersCount,
    },
    message: 'Joined community successfully',
  });
});

// @desc    Leave a community
// @route   POST /api/v1/communities/:id/leave
// @access  Private
const leaveCommunity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const community = await Community.findById(id);
  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  if (community.owner.toString() === req.user._id.toString()) {
    const error = new Error('Community owner cannot leave the community');
    error.statusCode = 400;
    throw error;
  }

  const isMember = community.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    const error = new Error('You are not a member of this community');
    error.statusCode = 400;
    throw error;
  }

  const updatedCommunity = await Community.findByIdAndUpdate(
    id,
    {
      $pull: { members: req.user._id },
      $inc: { membersCount: -1 },
    },
    { new: true }
  );

  res.json({
    success: true,
    data: {
      isMember: false,
      membersCount: Math.max(0, updatedCommunity.membersCount),
    },
    message: 'Left community successfully',
  });
});

// @desc    Get members of a community
// @route   GET /api/v1/communities/:id/members
// @access  Public
const getMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const community = await Community.findById(id).select('members');
  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  const [members, total] = await Promise.all([
    User.find({ _id: { $in: community.members } })
      .select('displayName username avatar title bio skills score')
      .skip(skip)
      .limit(limit)
      .lean(),
    community.members.length,
  ]);

  res.json({
    success: true,
    data: members,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Community members retrieved successfully',
  });
});

// @desc    Get communities joined by user
// @route   GET /api/v1/communities/user/:userId
// @access  Public
const getUserCommunities = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const [communities, total] = await Promise.all([
    Community.find({ members: userId })
      .populate('owner', 'displayName username avatar title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Community.countDocuments({ members: userId }),
  ]);

  res.json({
    success: true,
    data: communities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'User communities retrieved successfully',
  });
});

module.exports = {
  getCommunities,
  getCommunity,
  getCommunityBySlug,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  joinCommunity,
  leaveCommunity,
  getMembers,
  getUserCommunities,
};
