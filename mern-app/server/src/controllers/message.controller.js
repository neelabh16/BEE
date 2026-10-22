const mongoose = require('mongoose');
const Message = require('../models/Message.model');
const Conversation = require('../models/Conversation.model');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get messages in a conversation
// @route   GET /api/v1/messages/conversation/:conversationId or GET /api/v1/messages/:conversationId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId || req.params.id;

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error('Valid conversation ID is required');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify participant
  const isParticipant = conversation.participants.some(
    (pId) => pId.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    const error = new Error('You are not authorized to view messages in this conversation');
    error.statusCode = 403;
    throw error;
  }

  const page = Math.max(1, parseInt(req.pagination?.page || req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.pagination?.limit || req.query.limit) || 30));
  const skip = req.pagination?.skip !== undefined ? req.pagination.skip : (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .populate('sender', 'displayName username avatar title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversation: conversationId }),
  ]);

  // Reset unread count for current user
  if (conversation.unreadCount) {
    conversation.unreadCount.set(req.user._id.toString(), 0);
    await conversation.save();
  }

  // Mark unread messages as read
  await Message.updateMany(
    { conversation: conversationId, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({
    success: true,
    data: messages,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
    message: 'Messages retrieved successfully',
  });
});

// @desc    Send a message in a conversation
// @route   POST /api/v1/messages/:conversationId or POST /api/v1/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId || req.params.id || req.body.conversationId;
  const { content } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    const error = new Error('Message content is required');
    error.statusCode = 400;
    throw error;
  }

  if (content.trim().length > 2000) {
    const error = new Error('Message content cannot exceed 2000 characters');
    error.statusCode = 400;
    throw error;
  }

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    const error = new Error('Valid conversation ID is required');
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify participant
  const isParticipant = conversation.participants.some(
    (pId) => pId.toString() === req.user._id.toString()
  );

  if (!isParticipant) {
    const error = new Error('You are not authorized to send messages in this conversation');
    error.statusCode = 403;
    throw error;
  }

  const cleanContent = content.trim();

  // Create message
  const message = await Message.create({
    conversation: conversationId,
    sender: req.user._id,
    content: cleanContent,
    readBy: [req.user._id],
  });

  // Update conversation lastMessage & increment unread counts
  conversation.lastMessage = {
    content: cleanContent.length > 100 ? cleanContent.substring(0, 97) + '...' : cleanContent,
    sender: req.user._id,
    createdAt: new Date(),
  };

  if (!conversation.unreadCount) {
    conversation.unreadCount = new Map();
  }

  conversation.participants.forEach((participantId) => {
    const pStr = participantId.toString();
    if (pStr !== req.user._id.toString()) {
      const currentCount = conversation.unreadCount.get(pStr) || 0;
      conversation.unreadCount.set(pStr, currentCount + 1);
    }
  });

  await conversation.save();

  await message.populate('sender', 'displayName username avatar title');

  res.status(201).json({
    success: true,
    data: message,
    message: 'Message sent successfully',
  });
});

module.exports = {
  getMessages,
  sendMessage,
};
