const mongoose = require('mongoose');
const SquadRequest = require('../models/SquadRequest.model');
const User = require('../models/User.model');
const Activity = require('../models/Activity.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Send a squad connection request
// @route   POST /api/v1/squads/request
// @access  Private
const sendRequest = asyncHandler(async (req, res) => {
  const { receiverId, receiver, message, skills, goals } = req.body;
  const targetId = receiverId || receiver;

  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
    const error = new Error('Valid receiver ID is required');
    error.statusCode = 400;
    throw error;
  }

  // Cannot send to self
  if (targetId.toString() === req.user._id.toString()) {
    const error = new Error('Cannot send a squad request to yourself');
    error.statusCode = 400;
    throw error;
  }

  // Validate receiver exists
  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    const error = new Error('Receiver user not found');
    error.statusCode = 404;
    throw error;
  }

  // Check no existing pending or accepted request between these two users
  const existingRequest = await SquadRequest.findOne({
    $or: [
      { sender: req.user._id, receiver: targetId },
      { sender: targetId, receiver: req.user._id },
    ],
  });

  if (existingRequest) {
    if (existingRequest.status === 'pending') {
      const error = new Error('A squad request between you and this user is already pending');
      error.statusCode = 400;
      throw error;
    }
    if (existingRequest.status === 'accepted') {
      const error = new Error('You are already connected with this user in a squad');
      error.statusCode = 400;
      throw error;
    }
    // If rejected, remove old request to allow re-requesting
    await SquadRequest.findByIdAndDelete(existingRequest._id);
  }

  const skillsArray = Array.isArray(skills)
    ? skills.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const squadRequest = await SquadRequest.create({
    sender: req.user._id,
    receiver: targetId,
    message: message ? String(message).trim().substring(0, 500) : '',
    skills: skillsArray,
    goals: goals ? String(goals).trim().substring(0, 500) : '',
    status: 'pending',
  });

  await squadRequest.populate('sender', 'displayName username avatar title skills');
  await squadRequest.populate('receiver', 'displayName username avatar title skills');

  res.status(201).json({
    success: true,
    data: squadRequest,
    message: 'Squad request sent successfully',
  });
});

// @desc    Get received squad requests
// @route   GET /api/v1/squads/requests/received
// @access  Private
const getMyRequests = asyncHandler(async (req, res) => {
  const requests = await SquadRequest.find({
    receiver: req.user._id,
    status: 'pending',
  })
    .populate('sender', 'displayName username avatar title bio skills score location')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests,
    message: 'Received squad requests retrieved successfully',
  });
});

// @desc    Get sent squad requests
// @route   GET /api/v1/squads/requests/sent
// @access  Private
const getSentRequests = asyncHandler(async (req, res) => {
  const requests = await SquadRequest.find({
    sender: req.user._id,
  })
    .populate('receiver', 'displayName username avatar title bio skills score location')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: requests,
    message: 'Sent squad requests retrieved successfully',
  });
});

// @desc    Respond to squad request (accept or reject)
// @route   PUT /api/v1/squads/requests/:id
// @access  Private
const respondToRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['accepted', 'rejected'].includes(status)) {
    const error = new Error('Status must be either "accepted" or "rejected"');
    error.statusCode = 400;
    throw error;
  }

  const squadRequest = await SquadRequest.findOne({
    _id: id,
    receiver: req.user._id,
  });

  if (!squadRequest) {
    const error = new Error('Squad request not found or you are not authorized to respond');
    error.statusCode = 404;
    throw error;
  }

  if (squadRequest.status !== 'pending') {
    const error = new Error('This request has already been processed');
    error.statusCode = 400;
    throw error;
  }

  squadRequest.status = status;
  await squadRequest.save();

  if (status === 'accepted') {
    // Create Activity for both users
    await Activity.create({
      user: req.user._id,
      type: 'squad_accepted',
      target: squadRequest.sender,
      targetModel: 'User',
      description: 'Connected in a squad',
    });

    await Activity.create({
      user: squadRequest.sender,
      type: 'squad_accepted',
      target: req.user._id,
      targetModel: 'User',
      description: 'Connected in a squad',
    });
  }

  await squadRequest.populate('sender', 'displayName username avatar title skills');
  await squadRequest.populate('receiver', 'displayName username avatar title skills');

  res.json({
    success: true,
    data: squadRequest,
    message: `Squad request ${status} successfully`,
  });
});

// @desc    Get accepted squad connections
// @route   GET /api/v1/squads/connections
// @access  Private
const getConnections = asyncHandler(async (req, res) => {
  const connections = await SquadRequest.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    status: 'accepted',
  })
    .populate('sender', 'displayName username avatar title bio skills score location')
    .populate('receiver', 'displayName username avatar title bio skills score location')
    .sort({ updatedAt: -1 });

  // Map each connection to return the counterpart user
  const formattedConnections = connections.map((item) => {
    const isSender = item.sender._id.toString() === req.user._id.toString();
    const peer = isSender ? item.receiver : item.sender;
    return {
      requestId: item._id,
      user: peer,
      skills: item.skills,
      goals: item.goals,
      connectedAt: item.updatedAt,
    };
  });

  res.json({
    success: true,
    data: formattedConnections,
    message: 'Squad connections retrieved successfully',
  });
});

// @desc    Search developers by skills, interests, and keywords
// @route   GET /api/v1/squads/search
// @access  Private
const searchDevelopers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const { skills, interests, q, search } = req.query;

  // Exclude current user from search
  const filter = { _id: { $ne: req.user._id } };

  if (skills) {
    const skillList = skills.split(',').map((s) => new RegExp(`^${s.trim()}$`, 'i'));
    filter.skills = { $in: skillList };
  }

  if (interests) {
    const interestList = interests.split(',').map((i) => new RegExp(`^${i.trim()}$`, 'i'));
    filter.interests = { $in: interestList };
  }

  const queryStr = (q || search || '').trim();
  if (queryStr) {
    const regex = new RegExp(queryStr, 'i');
    filter.$or = [
      { displayName: regex },
      { username: regex },
      { title: regex },
      { bio: regex },
    ];
  }

  const [developers, total] = await Promise.all([
    User.find(filter)
      .select('displayName username avatar title bio skills interests score location')
      .sort({ score: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: developers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Developers retrieved successfully',
  });
});

module.exports = {
  sendRequest,
  getMyRequests,
  getSentRequests,
  respondToRequest,
  getConnections,
  searchDevelopers,
};
