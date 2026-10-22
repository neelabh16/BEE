const mongoose = require('mongoose');
const validator = require('validator');

function validateObjectId(paramOrReq = 'id', res, next) {
  if (paramOrReq && paramOrReq.params && typeof next === 'function') {
    const req = paramOrReq;
    const id = req.params['id'];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid ID format');
      error.statusCode = 400;
      return next(error);
    }
    return next();
  }

  const paramName = typeof paramOrReq === 'string' ? paramOrReq : 'id';
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error('Invalid ID format');
      error.statusCode = 400;
      return next(error);
    }
    next();
  };
}


const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;
  req.pagination = {
    page: Math.max(1, parseInt(page) || 1),
    limit: Math.min(50, Math.max(1, parseInt(limit) || 12)),
  };
  req.pagination.skip = (req.pagination.page - 1) * req.pagination.limit;
  next();
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return validator.escape(validator.trim(str));
};

const validateRequired = (fields) => (req, res, next) => {
  const missing = fields.filter(f => !req.body[f] || (typeof req.body[f] === 'string' && req.body[f].trim() === ''));
  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.statusCode = 400;
    return next(error);
  }
  next();
};

module.exports = { validateObjectId, validatePagination, sanitizeString, validateRequired };
