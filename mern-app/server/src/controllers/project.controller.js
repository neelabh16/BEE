const validator = require('validator');
const Project = require('../models/Project.model');
const Bookmark = require('../models/Bookmark.model');
const Activity = require('../models/Activity.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all projects with filters and pagination
// @route   GET /api/v1/projects
// @access  Public
const getProjects = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const { category, technology, search, q, sort } = req.query;
  const filter = { status: 'published' };

  if (category) {
    filter.category = category.trim().toLowerCase();
  }

  if (technology) {
    filter.technologies = { $in: [new RegExp(`^${technology.trim()}$`, 'i')] };
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

  const sortOption = sort === 'likes'
    ? { likesCount: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'displayName username avatar title')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Projects retrieved successfully',
  });
});

// @desc    Get project by ID
// @route   GET /api/v1/projects/:id
// @access  Public
const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id).populate(
    'owner',
    'displayName username avatar bio skills title githubUrl'
  );

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: project,
    message: 'Project retrieved successfully',
  });
});

// @desc    Get project by slug
// @route   GET /api/v1/projects/slug/:slug
// @access  Public
const getProjectBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const project = await Project.findOne({ slug: slug.toLowerCase() }).populate(
    'owner',
    'displayName username avatar bio skills title githubUrl'
  );

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: project,
    message: 'Project retrieved successfully',
  });
});

// @desc    Create a new project
// @route   POST /api/v1/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    technologies,
    githubUrl,
    liveUrl,
    coverImage,
    status,
  } = req.body;

  if (!title || !description || !category) {
    const error = new Error('Please provide title, description, and category');
    error.statusCode = 400;
    throw error;
  }

  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 100) {
    const error = new Error('Title must be between 1 and 100 characters');
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
    'devtools',
    'blockchain',
    'gamedev',
    'iot',
    'cloud',
    'cybersecurity',
    'data',
    'other',
  ];

  if (!validCategories.includes(category)) {
    const error = new Error(`Category must be one of: ${validCategories.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (githubUrl && githubUrl.trim() !== '' && !validator.isURL(githubUrl.trim(), { require_protocol: false })) {
    const error = new Error('Please provide a valid GitHub URL');
    error.statusCode = 400;
    throw error;
  }

  if (liveUrl && liveUrl.trim() !== '' && !validator.isURL(liveUrl.trim(), { require_protocol: false })) {
    const error = new Error('Please provide a valid live demo URL');
    error.statusCode = 400;
    throw error;
  }

  const techArray = Array.isArray(technologies)
    ? technologies.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const project = await Project.create({
    title: title.trim(),
    description: description.trim(),
    category,
    technologies: techArray,
    githubUrl: githubUrl ? githubUrl.trim() : '',
    liveUrl: liveUrl ? liveUrl.trim() : '',
    coverImage: coverImage ? coverImage.trim() : '',
    status: status === 'draft' ? 'draft' : 'published',
    owner: req.user._id,
  });

  // Create Activity record
  await Activity.create({
    user: req.user._id,
    type: 'project_created',
    target: project._id,
    targetModel: 'Project',
    description: `Created project "${project.title}"`,
  });

  // Increment user score (+10 for publishing project)
  await User.findByIdAndUpdate(req.user._id, { $inc: { score: 10 } });

  await project.populate('owner', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully',
  });
});

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private
const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership
  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this project');
    error.statusCode = 403;
    throw error;
  }

  const allowedFields = [
    'title',
    'description',
    'category',
    'technologies',
    'githubUrl',
    'liveUrl',
    'coverImage',
    'status',
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (updates.title !== undefined) {
    if (typeof updates.title !== 'string' || updates.title.trim().length === 0 || updates.title.trim().length > 100) {
      const error = new Error('Title must be between 1 and 100 characters');
      error.statusCode = 400;
      throw error;
    }
    updates.title = updates.title.trim();
  }

  if (updates.description !== undefined) {
    if (typeof updates.description !== 'string' || updates.description.trim().length === 0 || updates.description.trim().length > 5000) {
      const error = new Error('Description must be between 1 and 5000 characters');
      error.statusCode = 400;
      throw error;
    }
    updates.description = updates.description.trim();
  }

  if (updates.category !== undefined) {
    const validCategories = [
      'web',
      'mobile',
      'ai-ml',
      'devtools',
      'blockchain',
      'gamedev',
      'iot',
      'cloud',
      'cybersecurity',
      'data',
      'other',
    ];
    if (!validCategories.includes(updates.category)) {
      const error = new Error(`Category must be one of: ${validCategories.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
  }

  if (updates.githubUrl && updates.githubUrl.trim() !== '') {
    if (!validator.isURL(updates.githubUrl.trim(), { require_protocol: false })) {
      const error = new Error('Please provide a valid GitHub URL');
      error.statusCode = 400;
      throw error;
    }
    updates.githubUrl = updates.githubUrl.trim();
  }

  if (updates.liveUrl && updates.liveUrl.trim() !== '') {
    if (!validator.isURL(updates.liveUrl.trim(), { require_protocol: false })) {
      const error = new Error('Please provide a valid live demo URL');
      error.statusCode = 400;
      throw error;
    }
    updates.liveUrl = updates.liveUrl.trim();
  }

  if (updates.technologies !== undefined) {
    updates.technologies = Array.isArray(updates.technologies)
      ? updates.technologies.map((t) => String(t).trim()).filter(Boolean)
      : [];
  }

  Object.assign(project, updates);
  await project.save();

  await project.populate('owner', 'displayName username avatar title');

  res.json({
    success: true,
    data: project,
    message: 'Project updated successfully',
  });
});

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Private
const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership
  if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to delete this project');
    error.statusCode = 403;
    throw error;
  }

  await Project.findByIdAndDelete(id);

  // Clean up associated bookmarks & activities
  await Promise.all([
    Bookmark.deleteMany({ target: id, targetModel: 'Project' }),
    Activity.deleteMany({ target: id, targetModel: 'Project' }),
  ]);

  res.json({
    success: true,
    data: null,
    message: 'Project deleted successfully',
  });
});

// @desc    Toggle like on a project
// @route   POST /api/v1/projects/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const isLiked = project.likes.some((uId) => uId.toString() === req.user._id.toString());

  let updatedProject;
  if (isLiked) {
    updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $pull: { likes: req.user._id },
        $inc: { likesCount: -1 },
      },
      { new: true }
    );
  } else {
    updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $addToSet: { likes: req.user._id },
        $inc: { likesCount: 1 },
      },
      { new: true }
    );

    // Create Activity when liked
    await Activity.create({
      user: req.user._id,
      type: 'project_liked',
      target: project._id,
      targetModel: 'Project',
      description: `Liked project "${project.title}"`,
    });
  }

  res.json({
    success: true,
    data: {
      isLiked: !isLiked,
      likesCount: Math.max(0, updatedProject.likesCount),
    },
    message: !isLiked ? 'Project liked successfully' : 'Project unliked successfully',
  });
});

// @desc    Toggle bookmark on a project
// @route   POST /api/v1/projects/:id/bookmark
// @access  Private
const toggleBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  const existingBookmark = await Bookmark.findOne({
    user: req.user._id,
    target: id,
    targetModel: 'Project',
  });

  let isBookmarked;
  let updatedProject;

  if (existingBookmark) {
    await Bookmark.findByIdAndDelete(existingBookmark._id);
    updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $pull: { bookmarks: req.user._id },
        $inc: { bookmarksCount: -1 },
      },
      { new: true }
    );
    isBookmarked = false;
  } else {
    await Bookmark.create({
      user: req.user._id,
      target: id,
      targetModel: 'Project',
    });
    updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        $addToSet: { bookmarks: req.user._id },
        $inc: { bookmarksCount: 1 },
      },
      { new: true }
    );
    isBookmarked = true;
  }

  res.json({
    success: true,
    data: {
      isBookmarked,
      bookmarksCount: Math.max(0, updatedProject ? updatedProject.bookmarksCount : 0),
    },
    message: isBookmarked ? 'Project bookmarked successfully' : 'Bookmark removed successfully',
  });
});

// @desc    Get projects by owner
// @route   GET /api/v1/projects/user/:userId
// @access  Public
const getUserProjects = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const isOwner = req.user && req.user._id.toString() === userId;
  const filter = { owner: userId };
  if (!isOwner) {
    filter.status = 'published';
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'displayName username avatar title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: projects,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'User projects retrieved successfully',
  });
});

module.exports = {
  getProjects,
  getProject,
  getProjectBySlug,
  createProject,
  updateProject,
  deleteProject,
  toggleLike,
  toggleBookmark,
  getUserProjects,
};
