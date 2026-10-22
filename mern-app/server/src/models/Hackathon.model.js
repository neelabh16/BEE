const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Hackathon title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: ['web', 'mobile', 'ai-ml', 'blockchain', 'iot', 'open', 'social-good', 'fintech', 'healthtech', 'edtech'],
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all-levels'],
    default: 'all-levels',
  },
  startDate: { type: Date, required: [true, 'Start date is required'] },
  endDate: { type: Date, required: [true, 'End date is required'] },
  rules: { type: String, maxlength: 5000, default: '' },
  judgingCriteria: { type: String, maxlength: 3000, default: '' },
  prizes: { type: String, maxlength: 2000, default: '' },
  maxParticipants: { type: Number, default: 0 },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  participantsCount: { type: Number, default: 0 },
  technologies: [{ type: String, trim: true }],
  coverImage: { type: String, default: '' },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming',
  },
  isSampleData: { type: Boolean, default: false },
}, {
  timestamps: true,
});

hackathonSchema.index({ organizer: 1 });
hackathonSchema.index({ status: 1 });
hackathonSchema.index({ startDate: 1 });
hackathonSchema.index({ category: 1 });
hackathonSchema.index({ title: 'text', description: 'text' });

hackathonSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('Hackathon', hackathonSchema);
