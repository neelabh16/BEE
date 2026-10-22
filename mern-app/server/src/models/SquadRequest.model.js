const mongoose = require('mongoose');

const squadRequestSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  skills: [{ type: String, trim: true }],
  goals: { type: String, maxlength: 500, default: '' },
}, {
  timestamps: true,
});

squadRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
squadRequestSchema.index({ receiver: 1, status: 1 });
squadRequestSchema.index({ sender: 1, status: 1 });

module.exports = mongoose.model('SquadRequest', squadRequestSchema);
