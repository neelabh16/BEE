const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  role: { type: String, required: true, maxlength: 100 },
  company: { type: String, required: true, maxlength: 100 },
  startDate: { type: String, required: true },
  endDate: { type: String, default: 'Present' },
  description: { type: String, maxlength: 1000, default: '' },
});

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 150 },
  description: { type: String, maxlength: 500, default: '' },
  date: { type: String, default: '' },
});

const portfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  headline: { type: String, maxlength: 150, default: '' },
  about: { type: String, maxlength: 3000, default: '' },
  skills: [{ type: String, trim: true }],
  experience: [experienceSchema],
  achievements: [achievementSchema],
  projects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  }],
  socialLinks: {
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  isPublic: { type: Boolean, default: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Portfolio', portfolioSchema);
