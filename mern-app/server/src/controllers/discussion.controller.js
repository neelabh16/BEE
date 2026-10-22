const mongoose = require('mongoose');
const Discussion = require('../models/Discussion.model');
const Community = require('../models/Community.model');
const Activity = require('../models/Activity.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get discussions for a community
// @route   GET /api/v1/discussions/community/:communityId
// @access  Public
const getDiscussions = asyncHandler(async (req, res) => {
  const { communityId } = req.params;
  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 12));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const filter = { community: communityId };

  const [discussions, total] = await Promise.all([
    Discussion.find(filter)
      .populate('author', 'displayName username avatar title')
      .select('-replies') // Exclude full replies array in listing for optimal performance
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Discussion.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: discussions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Discussions retrieved successfully',
  });
});

// @desc    Get discussion by ID with author and replies
// @route   GET /api/v1/discussions/:id
// @access  Public
const getDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const discussion = await Discussion.findById(id)
    .populate('author', 'displayName username avatar title bio')
    .populate('replies.author', 'displayName username avatar title');

  if (!discussion) {
    const error = new Error('Discussion not found');
    error.statusCode = 404;
    throw error;
  }

  res.json({
    success: true,
    data: discussion,
    message: 'Discussion retrieved successfully',
  });
});

// @desc    Create a new discussion
// @route   POST /api/v1/discussions
// @access  Private
const createDiscussion = asyncHandler(async (req, res) => {
  const { title, content, communityId } = req.body;

  if (!title || !content || !communityId) {
    const error = new Error('Please provide title, content, and communityId');
    error.statusCode = 400;
    throw error;
  }

  if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 200) {
    const error = new Error('Title must be between 1 and 200 characters');
    error.statusCode = 400;
    throw error;
  }

  if (typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 10000) {
    const error = new Error('Content must be between 1 and 10000 characters');
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(communityId)) {
    const error = new Error('Invalid community ID format');
    error.statusCode = 400;
    throw error;
  }

  const community = await Community.findById(communityId);
  if (!community) {
    const error = new Error('Community not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify user is a member of the community
  const isMember = community.members.some(
    (memberId) => memberId.toString() === req.user._id.toString()
  );

  if (!isMember) {
    const error = new Error('You must be a member of this community to create a discussion');
    error.statusCode = 403;
    throw error;
  }

  const discussion = await Discussion.create({
    title: title.trim(),
    content: content.trim(),
    community: communityId,
    author: req.user._id,
    replies: [],
    repliesCount: 0,
  });

  // Create Activity
  await Activity.create({
    user: req.user._id,
    type: 'discussion_created',
    target: discussion._id,
    targetModel: 'Discussion',
    description: `Started discussion "${discussion.title}" in ${community.name}`,
  });

  // Increment user score (+3)
  await User.findByIdAndUpdate(req.user._id, { $inc: { score: 3 } });

  await discussion.populate('author', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: discussion,
    message: 'Discussion created successfully',
  });
});

// @desc    Update discussion
// @route   PUT /api/v1/discussions/:id
// @access  Private
const updateDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const discussion = await Discussion.findById(id);
  if (!discussion) {
    const error = new Error('Discussion not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify author
  if (discussion.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    const error = new Error('Not authorized to update this discussion');
    error.statusCode = 403;
    throw error;
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 200) {
      const error = new Error('Title must be between 1 and 200 characters');
      error.statusCode = 400;
      throw error;
    }
    discussion.title = title.trim();
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.trim().length === 0 || content.trim().length > 10000) {
      const error = new Error('Content must be between 1 and 10000 characters');
      error.statusCode = 400;
      throw error;
    }
    discussion.content = content.trim();
  }

  await discussion.save();
  await discussion.populate('author', 'displayName username avatar title');

  res.json({
    success: true,
    data: discussion,
    message: 'Discussion updated successfully',
  });
});

// @desc    Delete discussion
// @route   DELETE /api/v1/discussions/:id
// @access  Private
const deleteDiscussion = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const discussion = await Discussion.findById(id);
  if (!discussion) {
    const error = new Error('Discussion not found');
    error.statusCode = 404;
    throw error;
  }

  const community = await Community.findById(discussion.community);
  const isAuthor = discussion.author.toString() === req.user._id.toString();
  const isCommunityOwner = community && community.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isAuthor && !isCommunityOwner && !isAdmin) {
    const error = new Error('Not authorized to delete this discussion');
    error.statusCode = 403;
    throw error;
  }

  await Discussion.findByIdAndDelete(id);

  // Delete associated activity
  await Activity.deleteMany({ target: id, targetModel: 'Discussion' });

  res.json({
    success: true,
    data: null,
    message: 'Discussion deleted successfully',
  });
});

// @desc    Add reply to a discussion
// @route   POST /api/v1/discussions/:id/replies
// @access  Private
const addReply = asyncHandler(async (req, res) => {
  const discussionId = req.params.id || req.params.discussionId;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    const error = new Error('Reply content is required');
    error.statusCode = 400;
    throw error;
  }

  if (content.trim().length > 3000) {
    const error = new Error('Reply content cannot exceed 3000 characters');
    error.statusCode = 400;
    throw error;
  }

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    const error = new Error('Discussion not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify community membership
  const community = await Community.findById(discussion.community);
  if (community) {
    const isMember = community.members.some(
      (mId) => mId.toString() === req.user._id.toString()
    );
    if (!isMember) {
      const error = new Error('You must be a member of this community to reply');
      error.statusCode = 403;
      throw error;
    }
  }

  if (discussion.replies.length >= 200) {
    const error = new Error('Discussion has reached maximum limit of 200 replies');
    error.statusCode = 400;
    throw error;
  }

  discussion.replies.push({
    content: content.trim(),
    author: req.user._id,
  });

  discussion.repliesCount = discussion.replies.length;
  await discussion.save();

  await discussion.populate('author', 'displayName username avatar title');
  await discussion.populate('replies.author', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: discussion,
    message: 'Reply added successfully',
  });
});

// @desc    Delete reply from discussion
// @route   DELETE /api/v1/discussions/:discussionId/replies/:replyId
// @access  Private
const deleteReply = asyncHandler(async (req, res) => {
  const { discussionId, replyId } = req.params;

  const discussion = await Discussion.findById(discussionId);
  if (!discussion) {
    const error = new Error('Discussion not found');
    error.statusCode = 404;
    throw error;
  }

  const reply = discussion.replies.id(replyId);
  if (!reply) {
    const error = new Error('Reply not found');
    error.statusCode = 404;
    throw error;
  }

  const isReplyAuthor = reply.author.toString() === req.user._id.toString();
  const isDiscussionAuthor = discussion.author.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isReplyAuthor && !isDiscussionAuthor && !isAdmin) {
    const error = new Error('Not authorized to delete this reply');
    error.statusCode = 403;
    throw error;
  }

  discussion.replies.pull(replyId);
  discussion.repliesCount = discussion.replies.length;
  await discussion.save();

  await discussion.populate('author', 'displayName username avatar title');
  await discussion.populate('replies.author', 'displayName username avatar title');

  res.json({
    success: true,
    data: discussion,
    message: 'Reply deleted successfully',
  });
});

module.exports = {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  addReply,
  deleteReply,
};
