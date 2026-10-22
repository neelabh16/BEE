const mongoose = require('mongoose');

const codexEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [20000, 'Content cannot exceed 20000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['debugging', 'lessons', 'architecture', 'incidents', 'performance', 'career', 'mistakes', 'practices'],
  },
  tags: [{
    type: String,
    trim: true,
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  bookmarksCount: { type: Number, default: 0 },
}, {
  timestamps: true,
});

codexEntrySchema.index({ author: 1 });
codexEntrySchema.index({ category: 1 });
codexEntrySchema.index({ tags: 1 });
codexEntrySchema.index({ createdAt: -1 });
codexEntrySchema.index({ title: 'text', content: 'text' });

codexEntrySchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + this._id.toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('CodexEntry', codexEntrySchema);
