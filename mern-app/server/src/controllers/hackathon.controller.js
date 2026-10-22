const Hackathon = require('../models/Hackathon.model');
const Activity = require('../models/Activity.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all hackathons with filters and pagination
// @route   GET /api/v1/hackathons
// @access  Public
const getHackathons = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const { category, status, difficulty, search, q, sort } = req.query;
  const filter = {};

  if (category) {
    filter.category = category.trim().toLowerCase();
  }

  if (status) {
    filter.status = status.trim().toLowerCase();
  }

  if (difficulty) {
    filter.difficulty = difficulty.trim().toLowerCase();
  }

  const queryStr = (search || q || '').trim();
  if (queryStr) {
    const regex = new RegExp(queryStr, 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { technologies: regex },
    ];
  }

  const sortOption = sort === 'startDate'
    ? { startDate: 1 }
    : { createdAt: -1 };

  const [hackathons, total] = await Promise.all([
    Hackathon.find(filter)
      .populate('organizer', 'displayName username avatar title')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Hackathon.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: hackathons,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Hackathons retrieved successfully',
  });
});

// @desc    Get hackathon by ID
// @route   GET /api/v1/hackathons/:id
// @access  Public
const getHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hackathon = await Hackathon.findById(id).populate(
    'organizer',
    'displayName username avatar bio skills title'
  );

  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: hackathon,
    message: 'Hackathon retrieved successfully',
  });
});

// @desc    Get hackathon by slug
// @route   GET /api/v1/hackathons/slug/:slug
// @access  Public
const getHackathonBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const hackathon = await Hackathon.findOne({ slug: slug.toLowerCase() }).populate(
    'organizer',
    'displayName username avatar bio skills title'
  );

  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: hackathon,
    message: 'Hackathon retrieved successfully',
  });
});

// @desc    Create a new hackathon
// @route   POST /api/v1/hackathons
// @access  Private
const createHackathon = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    difficulty,
    startDate,
    endDate,
    rules,
    judgingCriteria,
    prizes,
    maxParticipants,
    technologies,
    coverImage,
  } = req.body;

  if (!title || !description || !category || !startDate || !endDate) {
    const error = new Error('Please provide title, description, category, startDate, and endDate');
    error.statusCode = 400;
    throw error;
  }

  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 150) {
    const error = new Error('Title must be between 1 and 150 characters');
    error.statusCode = 400;
    throw error;
  }

  if (typeof description !== 'string' || description.trim().length === 0 || description.trim().length > 5000) {
    const error = new Error('Description must be between 1 and 5000 characters');
    error.statusCode = 400;
    throw error;
  }

  const validCategories = [
    'web',
    'mobile',
    'ai-ml',
    'blockchain',
    'iot',
    'open',
    'social-good',
    'fintech',
    'healthtech',
    'edtech',
  ];

  if (!validCategories.includes(category.trim().toLowerCase())) {
    const error = new Error(`Category must be one of: ${validCategories.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);

  if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
    const error = new Error('Invalid date format for startDate or endDate');
    error.statusCode = 400;
    throw error;
  }

  if (parsedEnd <= parsedStart) {
    const error = new Error('End date must be after start date');
    error.statusCode = 400;
    throw error;
  }

  const techArray = Array.isArray(technologies)
    ? technologies.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const hackathon = await Hackathon.create({
    title: title.trim(),
    description: description.trim(),
    category: category.trim().toLowerCase(),
    difficulty: difficulty || 'all-levels',
    startDate: parsedStart,
    endDate: parsedEnd,
    rules: rules ? rules.trim() : '',
    judgingCriteria: judgingCriteria ? judgingCriteria.trim() : '',
    prizes: prizes ? prizes.trim() : '',
    maxParticipants: maxParticipants ? parseInt(maxParticipants) : 0,
    technologies: techArray,
    coverImage: coverImage ? coverImage.trim() : '',
    organizer: req.user._id,
    participants: [],
    participantsCount: 0,
    status: parsedStart > new Date() ? 'upcoming' : 'active',
  });

  // Create Activity
  await Activity.create({
    user: req.user._id,
    type: 'hackathon_registered',
    target: hackathon._id,
    targetModel: 'Hackathon',
    description: `Created hackathon "${hackathon.title}"`,
  });

  await hackathon.populate('organizer', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: hackathon,
    message: 'Hackathon created successfully',
  });
});

// @desc    Update hackathon
// @route   PUT /api/v1/hackathons/:id
// @access  Private
const updateHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hackathon = await Hackathon.findById(id);
  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify organizer
  if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this hackathon');
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = [
    'title',
    'description',
    'category',
    'difficulty',
    'startDate',
    'endDate',
    'rules',
    'judgingCriteria',
    'prizes',
    'maxParticipants',
    'technologies',
    'coverImage',
    'status',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.startDate || updates.endDate) {
    const start = new Date(updates.startDate || hackathon.startDate);
    const end = new Date(updates.endDate || hackathon.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }

    if (end <= start) {
      const error = new Error('End date must be after start date');
      error.statusCode = 400;
      throw error;
    }

    updates.startDate = start;
    updates.endDate = end;
  }

  if (updates.technologies !== undefined) {
    updates.technologies = Array.isArray(updates.technologies)
      ? updates.technologies.map((t) => String(t).trim()).filter(Boolean)
      : [];
  }

  Object.assign(hackathon, updates);
  await hackathon.save();

  await hackathon.populate('organizer', 'displayName username avatar title');

  res.json({
    success: true,
    data: hackathon,
    message: 'Hackathon updated successfully',
  });
});

// @desc    Delete hackathon
// @route   DELETE /api/v1/hackathons/:id
// @access  Private
const deleteHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hackathon = await Hackathon.findById(id);
  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to delete this hackathon');
    error.statusCode = 403;
    throw error;
  }

  await Hackathon.findByIdAndDelete(id);

  // Delete associated activity
  await Activity.deleteMany({ target: id, targetModel: 'Hackathon' });

  res.json({
    success: true,
    data: null,
    message: 'Hackathon deleted successfully',
  });
});

// @desc    Register for a hackathon
// @route   POST /api/v1/hackathons/:id/register
// @access  Private
const registerForHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hackathon = await Hackathon.findById(id);
  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  // Check endDate not past
  if (new Date(hackathon.endDate) < new Date()) {
    const error = new Error('This hackathon has already concluded');
    error.statusCode = 400;
    throw error;
  }

  // Check already registered
  const isRegistered = hackathon.participants.some(
    (pId) => pId.toString() === req.user._id.toString()
  );

  if (isRegistered) {
    const error = new Error('You are already registered for this hackathon');
    error.statusCode = 400;
    throw error;
  }

  // Check participant limits
  if (hackathon.maxParticipants > 0 && hackathon.participantsCount >= hackathon.maxParticipants) {
    const error = new Error('Hackathon registration has reached maximum capacity');
    error.statusCode = 400;
    throw error;
  }

  const updatedHackathon = await Hackathon.findByIdAndUpdate(
    id,
    {
      $addToSet: { participants: req.user._id },
      $inc: { participantsCount: 1 },
    },
    { new: true }
  );

  // Create Activity
  await Activity.create({
    user: req.user._id,
    type: 'hackathon_registered',
    target: hackathon._id,
    targetModel: 'Hackathon',
    description: `Registered for hackathon "${hackathon.title}"`,
  });

  res.json({
    success: true,
    data: {
      isRegistered: true,
      participantsCount: updatedHackathon.participantsCount,
    },
    message: 'Registered for hackathon successfully',
  });
});

// @desc    Unregister from a hackathon
// @route   POST /api/v1/hackathons/:id/unregister
// @access  Private
const unregisterFromHackathon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hackathon = await Hackathon.findById(id);
  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  const isRegistered = hackathon.participants.some(
    (pId) => pId.toString() === req.user._id.toString()
  );

  if (!isRegistered) {
    const error = new Error('You are not registered for this hackathon');
    error.statusCode = 400;
    throw error;
  }

  const updatedHackathon = await Hackathon.findByIdAndUpdate(
    id,
    {
      $pull: { participants: req.user._id },
      $inc: { participantsCount: -1 },
    },
    { new: true }
  );

  res.json({
    success: true,
    data: {
      isRegistered: false,
      participantsCount: Math.max(0, updatedHackathon.participantsCount),
    },
    message: 'Unregistered from hackathon successfully',
  });
});

// @desc    Get participants of a hackathon
// @route   GET /api/v1/hackathons/:id/participants
// @access  Public
const getParticipants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 20));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const hackathon = await Hackathon.findById(id).select('participants');
  if (!hackathon) {
    const error = new Error('Hackathon not found');
    error.statusCode = 404;
    throw error;
  }

  const [participants, total] = await Promise.all([
    User.find({ _id: { $in: hackathon.participants } })
      .select('displayName username avatar title bio skills score')
      .skip(skip)
      .limit(limit)
      .lean(),
    hackathon.participants.length,
  ]);

  res.json({
    success: true,
    data: participants,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Participants retrieved successfully',
  });
});

module.exports = {
  getHackathons,
  getHackathon,
  getHackathonBySlug,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  registerForHackathon,
  unregisterFromHackathon,
  getParticipants,
};
