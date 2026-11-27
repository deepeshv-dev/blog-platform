const test = require('node:test');
const assert = require('node:assert/strict');
const connectDatabase = require('../src/config/db');

test('database setup fails clearly without a configured connection URI', async () => {
  const originalUri = process.env.MONGODB_URI;
  delete process.env.MONGODB_URI;
  try {
    await assert.rejects(connectDatabase(), /MONGODB_URI is required/);
  } finally {
    if (originalUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalUri;
  }
});
