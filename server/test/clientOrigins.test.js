const test = require('node:test');
const assert = require('node:assert/strict');
const { getConfiguredClientOrigins, isAllowedClientOrigin } = require('../src/utils/clientOrigins');

test('CLIENT_URL parses a comma-separated exact origin allow-list', () => {
  assert.deepEqual(
    getConfiguredClientOrigins('https://blog.example.com, https://www.example.com/'),
    ['https://blog.example.com', 'https://www.example.com']
  );
});

test('development allows only HTTP localhost and 127.0.0.1 across ports', () => {
  const configured = getConfiguredClientOrigins('http://127.0.0.1:5176');
  assert.equal(isAllowedClientOrigin('http://localhost:5176', configured, 'development'), true);
  assert.equal(isAllowedClientOrigin('http://127.0.0.1:5190', configured, 'development'), true);
  assert.equal(isAllowedClientOrigin('http://192.168.1.20:5176', configured, 'development'), false);
  assert.equal(isAllowedClientOrigin('https://localhost:5176', configured, 'development'), false);
  assert.equal(isAllowedClientOrigin('http://localhost.evil.example:5176', configured, 'development'), false);
  assert.equal(isAllowedClientOrigin('http://localhost:5176', configured, 'staging'), false);
});

test('production allows only exact environment-configured origins', () => {
  const configured = getConfiguredClientOrigins('https://blog.example.com,https://www.example.com');
  assert.equal(isAllowedClientOrigin('https://blog.example.com', configured, 'production'), true);
  assert.equal(isAllowedClientOrigin('https://www.example.com', configured, 'production'), true);
  assert.equal(isAllowedClientOrigin('https://preview.example.com', configured, 'production'), false);
  assert.equal(isAllowedClientOrigin('http://localhost:5176', configured, 'production'), false);
});

test('CLIENT_URL rejects malformed and non-origin values', () => {
  for (const value of ['', 'http://localhost:5176,', 'ftp://blog.example.com', 'https://blog.example.com/path']) {
    assert.throws(() => getConfiguredClientOrigins(value));
  }
});
