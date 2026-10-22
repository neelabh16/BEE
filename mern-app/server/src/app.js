const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

// Route imports
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const communityRoutes = require('./routes/community.routes');
const discussionRoutes = require('./routes/discussion.routes');
const codexRoutes = require('./routes/codex.routes');
const portfolioRoutes = require('./routes/portfolio.routes');
const hackathonRoutes = require('./routes/hackathon.routes');
const squadRoutes = require('./routes/squad.routes');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const uploadRoutes = require('./routes/upload.routes');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Auth-specific stricter rate limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});
app.use('/api/v1/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/communities', communityRoutes);
app.use('/api/v1/discussions', discussionRoutes);
app.use('/api/v1/codex', codexRoutes);
app.use('/api/v1/portfolios', portfolioRoutes);
app.use('/api/v1/hackathons', hackathonRoutes);
app.use('/api/v1/squads', squadRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/uploads', uploadRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
