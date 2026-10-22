const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const protect = async (req, res, next) => {
  try {
    let token = req.cookies.token;

    if (!token) {
      const error = new Error('Not authorized, no token');
      error.statusCode = 401;
      throw error;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (error) {
    if (!error.statusCode) error.statusCode = 401;
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) req.user = user;
    }
  } catch (e) {
    // Not authenticated, continue
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const error = new Error('Admin access required');
    error.statusCode = 403;
    next(error);
  }
};

module.exports = { protect, optionalAuth, adminOnly };
