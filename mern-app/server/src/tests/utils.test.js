const { describe, it } = require('node:test');
const assert = require('node:assert');
const createSlug = require('../utils/createSlug');

describe('Utility Tests', () => {
  it('createSlug generates lowercase dashed string with optional suffix', () => {
    const slug = createSlug('DevVerse Realtime Platform', '123456');
    assert.strictEqual(slug, 'devverse-realtime-platform-123456');
  });

  it('createSlug removes special characters and trims dashes', () => {
    const slug = createSlug('!Hello, World! & Node.js?');
    assert.strictEqual(slug, 'hello-world-node-js');
  });
});
