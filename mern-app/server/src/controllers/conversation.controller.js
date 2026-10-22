const mongoose = require('mongoose');
const Conversation = require('../models/Conversation.model');
const User = require('../models/User.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all conversations for current user
// @route   GET /api/v1/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate('participants', 'displayName username avatar title bio')
    .populate('lastMessage.sender', 'displayName username avatar')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: conversations,
    message: 'Conversations retrieved successfully',
  });
});

// @desc    Get or create conversation between current user and another user
// @route   POST /api/v1/conversations
// @access  Private
const getOrCreateConversation = asyncHandler(async (req, res) => {
  const { participantId, userId, recipientId } = req.body;
  const targetUserId = participantId || userId || recipientId;

  if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    const error = new Error('Valid participant ID is required');
    error.statusCode = 400;
    throw error;
  }

  if (targetUserId.toString() === req.user._id.toString()) {
    const error = new Error('Cannot create a conversation with yourself');
    error.statusCode = 400;
    throw error;
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    const error = new Error('Participant user not found');
    error.statusCode = 404;
    throw error;
  }

  // Look for existing conversation between these two exact participants
  let conversation = await Conversation.findOne({
    participants: {
      $all: [req.user._id, targetUserId],
      $size: 2,
    },
  })
    .populate('participants', 'displayName username avatar title bio')
    .populate('lastMessage.sender', 'displayName username avatar');

  if (!conversation) {
    const initialUnread = new Map();
    initialUnread.set(req.user._id.toString(), 0);
    initialUnread.set(targetUserId.toString(), 0);

    conversation = await Conversation.create({
      participants: [req.user._id, targetUserId],
      unreadCount: initialUnread,
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'displayName username avatar title bio')
      .populate('lastMessage.sender', 'displayName username avatar');
  }

  res.json({
    success: true,
    data: conversation,
    message: 'Conversation ready',
  });
});

// @desc    Get single conversation by ID and reset unread count
// @route   GET /api/v1/conversations/:id
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conversation = await Conversation.findById(id)
    .populate('participants', 'displayName username avatar title bio')
    .populate('lastMessage.sender', 'displayName username avatar');

  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify participant
  const isParticipant = conversation.participants.some(
    (p) => p._id.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    const error = new Error('You are not authorized to view this conversation');
    error.statusCode = 403;
    throw error;
  }

  // Reset unread count for current user
  if (conversation.unreadCount) {
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();
  }

  res.json({
    success: true,
    data: conversation,
    message: 'Conversation retrieved successfully',
  });
});

module.exports = {
  getConversations,
  getOrCreateConversation,
  getConversation,
};
