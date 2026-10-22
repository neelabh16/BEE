const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  validateObjectId,
  validatePagination,
  sanitizeString,
  validateRequired,
} = require('../middleware/validate.middleware');
const { errorHandler } = require('../middleware/error.middleware');

describe('Middleware Unit Tests', () => {
  it('validatePagination defaults to page 1 and limit 12', () => {
    const req = { query: {} };
    let called = false;
    validatePagination(req, {}, () => { called = true; });

    assert.strictEqual(called, true);
    assert.strictEqual(req.pagination.page, 1);
    assert.strictEqual(req.pagination.limit, 12);
    assert.strictEqual(req.pagination.skip, 0);
  });

  it('validatePagination caps limit at maximum 50 and handles offsets', () => {
    const req = { query: { page: '3', limit: '100' } };
    validatePagination(req, {}, () => {});

    assert.strictEqual(req.pagination.page, 3);
    assert.strictEqual(req.pagination.limit, 50);
    assert.strictEqual(req.pagination.skip, 100);
  });

  it('validateObjectId allows valid 24-hex string and rejects malformed ids', () => {
    const validReq = { params: { id: '507f1f77bcf86cd799439011' } };
    let passedValid = false;
    const middleware = validateObjectId();
    middleware(validReq, {}, (err) => {
      if (!err) passedValid = true;
    });
    assert.strictEqual(passedValid, true);

    const invalidReq = { params: { id: 'not-a-valid-object-id' } };
    let caughtErr = null;
    middleware(invalidReq, {}, (err) => {
      caughtErr = err;
    });
    assert.notStrictEqual(caughtErr, null);
    assert.strictEqual(caughtErr.statusCode, 400);
  });

  it('validateRequired catches empty or whitespace-only fields', () => {
    const validator = validateRequired(['title', 'category']);
    const req = { body: { title: '   ', category: 'web' } };
    let errResult = null;
    validator(req, {}, (err) => {
      errResult = err;
    });
    assert.notStrictEqual(errResult, null);
    assert.strictEqual(errResult.statusCode, 400);
    assert.strictEqual(errResult.message.includes('title'), true);
  });

  it('sanitizeString trims whitespace and escapes HTML injection', () => {
    const clean = sanitizeString('  <script>alert("xss")</script>  ');
    assert.strictEqual(clean.includes('<script>'), false);
    assert.strictEqual(clean.includes('&lt;script&gt;'), true);
  });

  it('errorHandler formats Mongoose CastError with 400 status', () => {
    const err = new Error('Cast error');
    err.name = 'CastError';
    err.kind = 'ObjectId';

    let statusSent = 0;
    let jsonSent = null;
    const res = {
      status(code) { statusSent = code; return this; },
      json(payload) { jsonSent = payload; },
    };

    errorHandler(err, {}, res, () => {});
    assert.strictEqual(statusSent, 400);
    assert.strictEqual(jsonSent.success, false);
    assert.strictEqual(jsonSent.message, 'Invalid resource ID');
  });

  it('errorHandler formats duplicate key error code 11000 with 409 status', () => {
    const err = new Error('Duplicate key');
    err.code = 11000;
    err.keyValue = { email: 'test@example.com' };

    let statusSent = 0;
    let jsonSent = null;
    const res = {
      status(code) { statusSent = code; return this; },
      json(payload) { jsonSent = payload; },
    };

    errorHandler(err, {}, res, () => {});
    assert.strictEqual(statusSent, 409);
    assert.strictEqual(jsonSent.success, false);
    assert.strictEqual(jsonSent.message.includes('email'), true);
  });
});
