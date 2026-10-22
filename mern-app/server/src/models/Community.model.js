const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true,
    maxlength: [80, 'Name cannot exceed 80 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
    enum: ['frontend', 'backend', 'fullstack', 'mobile', 'devops', 'ai-ml', 'blockchain', 'cybersecurity', 'design', 'career', 'general'],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  membersCount: { type: Number, default: 1 },
  avatar: { type: String, default: '' },
}, {
  timestamps: true,
});

communitySchema.index({ slug: 1 });
communitySchema.index({ owner: 1 });
communitySchema.index({ topic: 1 });
communitySchema.index({ membersCount: -1 });
communitySchema.index({ name: 'text', description: 'text' });

communitySchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('Community', communitySchema);
