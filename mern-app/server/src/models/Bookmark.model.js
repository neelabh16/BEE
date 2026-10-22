const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel',
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Project', 'CodexEntry'],
  },
}, {
  timestamps: true,
});

bookmarkSchema.index({ user: 1, target: 1, targetModel: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, targetModel: 1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
