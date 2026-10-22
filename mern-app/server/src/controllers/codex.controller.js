const CodexEntry = require('../models/CodexEntry.model');
const Bookmark = require('../models/Bookmark.model');
const Activity = require('../models/Activity.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all codex entries with filters and pagination
// @route   GET /api/v1/codex
// @access  Public
const getEntries = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const { category, tag, tags, search, q, sort } = req.query;
  const filter = {};

  if (category) {
    filter.category = category.trim().toLowerCase();
  }

  const tagFilter = tag || tags;
  if (tagFilter) {
    filter.tags = { $in: [new RegExp(`^${tagFilter.trim()}$`, 'i')] };
  }

  const queryStr = (search || q || '').trim();
  if (queryStr) {
    const regex = new RegExp(queryStr, 'i');
    filter.$or = [
      { title: regex },
      { content: regex },
      { tags: regex },
    ];
  }

  const sortOption = sort === 'popular'
    ? { bookmarksCount: -1, createdAt: -1 }
    : { createdAt: -1 };

  const [entries, total] = await Promise.all([
    CodexEntry.find(filter)
      .populate('author', 'displayName username avatar title')
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    CodexEntry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: entries,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Codex entries retrieved successfully',
  });
});

// @desc    Get codex entry by ID
// @route   GET /api/v1/codex/:id
// @access  Public
const getEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await CodexEntry.findById(id).populate(
    'author',
    'displayName username avatar bio skills title'
  );

  if (!entry) {
    const error = new Error('Codex entry not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: entry,
    message: 'Codex entry retrieved successfully',
  });
});

// @desc    Get codex entry by slug
// @route   GET /api/v1/codex/slug/:slug
// @access  Public
const getEntryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const entry = await CodexEntry.findOne({ slug: slug.toLowerCase() }).populate(
    'author',
    'displayName username avatar bio skills title'
  );

  if (!entry) {
    const error = new Error('Codex entry not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: entry,
    message: 'Codex entry retrieved successfully',
  });
});

// @desc    Create a new codex entry
// @route   POST /api/v1/codex
// @access  Private
const createEntry = asyncHandler(async (req, res) => {
  const { title, content, category, tags } = req.body;

  if (!title || !content || !category) {
    const error = new Error('Please provide title, content, and category');
    error.statusCode = 400;
    throw error;
  }

  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 200) {
    const error = new Error('Title must be between 1 and 200 characters');
    error.statusCode = 400;
    throw error;
  }

  if (typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 20000) {
    const error = new Error('Content must be between 1 and 20000 characters');
    error.statusCode = 400;
    throw error;
  }

  const validCategories = [
    'debugging',
    'lessons',
    'architecture',
    'incidents',
    'performance',
    'career',
    'mistakes',
    'practices',
  ];

  if (!validCategories.includes(category.trim().toLowerCase())) {
    const error = new Error(`Category must be one of: ${validCategories.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const tagArray = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const entry = await CodexEntry.create({
    title: title.trim(),
    content: content.trim(),
    category: category.trim().toLowerCase(),
    tags: tagArray,
    author: req.user._id,
  });

  // Create Activity
  await Activity.create({
    user: req.user._id,
    type: 'codex_created',
    target: entry._id,
    targetModel: 'CodexEntry',
    description: `Published codex entry "${entry.title}"`,
  });

  // Increment user score (+5)
  await User.findByIdAndUpdate(req.user._id, { $inc: { score: 5 } });

  await entry.populate('author', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: entry,
    message: 'Codex entry created successfully',
  });
});

// @desc    Update codex entry
// @route   PUT /api/v1/codex/:id
// @access  Private
const updateEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await CodexEntry.findById(id);
  if (!entry) {
    const error = new Error('Codex entry not found');
    error.statusCode = 404;
    throw error;
  }

  if (entry.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this codex entry');
    error.statusCode = 403;
    throw error;
  }

  const { title, content, category, tags } = req.body;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 200) {
      const error = new Error('Title must be between 1 and 200 characters');
      error.statusCode = 400;
      throw error;
    }
    entry.title = title.trim();
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 20000) {
      const error = new Error('Content must be between 1 and 20000 characters');
      error.statusCode = 400;
      throw error;
    }
    entry.content = content.trim();
  }

  if (category !== undefined) {
    const validCategories = [
      'debugging',
      'lessons',
      'architecture',
      'incidents',
      'performance',
      'career',
      'mistakes',
      'practices',
    ];
    if (!validCategories.includes(category.trim().toLowerCase())) {
      const error = new Error(`Category must be one of: ${validCategories.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }
    entry.category = category.trim().toLowerCase();
  }

  if (tags !== undefined) {
    entry.tags = Array.isArray(tags)
      ? tags.map((t) => String(t).trim()).filter(Boolean)
      : [];
  }

  await entry.save();
  await entry.populate('author', 'displayName username avatar title');

  res.json({
    success: true,
    data: entry,
    message: 'Codex entry updated successfully',
  });
});

// @desc    Delete codex entry
// @route   DELETE /api/v1/codex/:id
// @access  Private
const deleteEntry = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await CodexEntry.findById(id);
  if (!entry) {
    const error = new Error('Codex entry not found');
    error.statusCode = 404;
    throw error;
  }

  if (entry.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to delete this codex entry');
    error.statusCode = 403;
    throw error;
  }

  await CodexEntry.findByIdAndDelete(id);

  // Clean up associated bookmarks & activities
  await Promise.all([
    Bookmark.deleteMany({ target: id, targetModel: 'CodexEntry' }),
    Activity.deleteMany({ target: id, targetModel: 'CodexEntry' }),
  ]);

  res.json({
    success: true,
    data: null,
    message: 'Codex entry deleted successfully',
  });
});

// @desc    Toggle bookmark on a codex entry
// @route   POST /api/v1/codex/:id/bookmark
// @access  Private
const toggleBookmark = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const entry = await CodexEntry.findById(id);
  if (!entry) {
    const error = new Error('Codex entry not found');
    error.statusCode = 404;
    throw error;
  }

  const existingBookmark = await Bookmark.findOne({
    user: req.user._id,
    target: id,
    targetModel: 'CodexEntry',
  });

  let isBookmarked;
  let updatedEntry;

  if (existingBookmark) {
    await Bookmark.findByIdAndDelete(existingBookmark._id);
    updatedEntry = await CodexEntry.findByIdAndUpdate(
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
      targetModel: 'CodexEntry',
    });
    updatedEntry = await CodexEntry.findByIdAndUpdate(
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
      bookmarksCount: Math.max(0, updatedEntry ? updatedEntry.bookmarksCount : 0),
    },
    message: isBookmarked ? 'Codex entry bookmarked successfully' : 'Bookmark removed successfully',
  });
});

module.exports = {
  getEntries,
  getEntry,
  getEntryBySlug,
  createEntry,
  updateEntry,
  deleteEntry,
  toggleBookmark,
};
