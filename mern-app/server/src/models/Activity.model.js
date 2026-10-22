const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['project_created', 'project_liked', 'community_joined', 'community_created', 'codex_created', 'hackathon_registered', 'squad_accepted', 'profile_updated', 'discussion_created'],
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'targetModel',
  },
  targetModel: {
    type: String,
    enum: ['Project', 'Community', 'CodexEntry', 'Hackathon', 'User', 'Discussion'],
  },
  description: { type: String, maxlength: 200 },
}, {
  timestamps: true,
});

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
