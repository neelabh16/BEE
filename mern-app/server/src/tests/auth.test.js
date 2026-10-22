const { describe, it } = require('node:test');
const assert = require('node:assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Authentication & Cryptography Unit Tests', () => {
  const secret = 'test-jwt-secret-key-32chars-minimum!!';

  it('bcrypt hashes password securely with salt', async () => {
    const raw = 'SuperSecret123!';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(raw, salt);

    assert.notStrictEqual(raw, hash);
    assert.strictEqual(hash.startsWith('$2'), true);

    const match = await bcrypt.compare(raw, hash);
    assert.strictEqual(match, true);

    const mismatch = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(mismatch, false);
  });

  it('JWT generates valid token and verifies claims correctly', () => {
    const userId = '507f1f77bcf86cd799439011';
    const token = jwt.sign({ id: userId }, secret, { expiresIn: '1h' });

    assert.strictEqual(typeof token, 'string');
    assert.strictEqual(token.split('.').length, 3);

    const decoded = jwt.verify(token, secret);
    assert.strictEqual(decoded.id, userId);
  });

  it('JWT rejects expired or tampered token', () => {
    const token = jwt.sign({ id: '123' }, secret, { expiresIn: '1ms' });
    
    // Slight pause to guarantee expiration
    const start = Date.now();
    while (Date.now() - start < 10) {}

    assert.throws(() => {
      jwt.verify(token, secret);
    }, (err) => {
      return err.name === 'TokenExpiredError';
    });

    const validToken = jwt.sign({ id: '123' }, secret, { expiresIn: '1h' });
    const tampered = validToken.slice(0, -4) + 'abcd';
    assert.throws(() => {
      jwt.verify(tampered, secret);
    }, (err) => {
      return err.name === 'JsonWebTokenError';
    });
  });
});
