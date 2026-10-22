const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [5000, 'Description cannot exceed 5000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['web', 'mobile', 'ai-ml', 'devtools', 'blockchain', 'gamedev', 'iot', 'cloud', 'cybersecurity', 'data', 'other'],
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  githubUrl: {
    type: String,
    default: '',
  },
  liveUrl: {
    type: String,
    default: '',
  },
  coverImage: {
    type: String,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  likesCount: { type: Number, default: 0 },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  bookmarksCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published',
  },
}, {
  timestamps: true,
});

projectSchema.index({ slug: 1 });
projectSchema.index({ owner: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ technologies: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ likesCount: -1 });
projectSchema.index({ title: 'text', description: 'text' });

projectSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
