const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Reply content is required'],
    maxlength: [3000, 'Reply cannot exceed 3000 characters'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Discussion title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Discussion content is required'],
    maxlength: [10000, 'Content cannot exceed 10000 characters'],
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  replies: {
    type: [replySchema],
    validate: [v => v.length <= 200, 'Discussion cannot have more than 200 replies'],
  },
  repliesCount: { type: Number, default: 0 },
  isPinned: { type: Boolean, default: false },
}, {
  timestamps: true,
});

discussionSchema.index({ community: 1, createdAt: -1 });
discussionSchema.index({ author: 1 });
discussionSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Discussion', discussionSchema);
