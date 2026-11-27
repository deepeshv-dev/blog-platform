const test = require('node:test');
const assert = require('node:assert/strict');
const createApp = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_URL = 'http://localhost:5173';
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('health endpoint responds without a database connection', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('readiness endpoint reports database unavailability accurately', async () => {
  const response = await fetch(`${baseUrl}/api/ready`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { status: 'unavailable' });
});

test('CORS allows the configured client origin with credentials', async () => {
  const response = await fetch(`${baseUrl}/api/health`, { headers: { origin: 'http://localhost:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});

test('development CORS allows localhost and 127.0.0.1 on Vite ports', async () => {
  for (const origin of ['http://localhost:5176', 'http://localhost:5182', 'http://127.0.0.1:5176']) {
    const response = await fetch(`${baseUrl}/api/health`, { headers: { origin } });
    assert.equal(response.headers.get('access-control-allow-origin'), origin);
    assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
  }
});

test('development CORS does not reflect non-loopback origins', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { origin: 'https://attacker.example' }
  });
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});

test('protected post mutations reject unauthenticated callers', async () => {
  const response = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: 'A story', content: 'Some writing' })
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, 'Authentication required.');
});

test('malformed JSON receives a consistent client error', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"username":'
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, 'Request body must contain valid JSON.');
});

test('non-object JSON bodies receive a validation response', async () => {
  const response = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: 'null'
  });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'Request body must be a JSON object.' });
});
