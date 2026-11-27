const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');
const createApp = require('../src/app');
const { register, login, logout } = require('../src/controllers/authController');
const requireAuth = require('../src/middleware/auth');

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE
};
const testSecret = crypto.randomBytes(48).toString('base64url');

function response() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    append(name, value) { this.headers[name] = value; return this; }
  };
}

test.beforeEach(() => {
  process.env.JWT_SECRET = testSecret;
  process.env.NODE_ENV = 'development';
  process.env.CLIENT_URL = 'http://localhost:5173';
  process.env.COOKIE_SAME_SITE = 'lax';
});

test.after(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('registration hashes the password and returns an HttpOnly session cookie without a token body', async () => {
  const originalExists = User.exists;
  const originalCreate = User.create;
  let inserted;
  User.exists = async () => false;
  User.create = async (value) => {
    inserted = value;
    return { ...value, id: 'user-id', createdAt: new Date('2025-01-01T00:00:00Z') };
  };
  try {
    const res = response();
    await register({ body: { username: 'Ada', email: 'ADA@example.com', password: 'strong-password' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 201);
    assert.equal(inserted.email, 'ada@example.com');
    assert.notEqual(inserted.passwordHash, 'strong-password');
    assert.equal(await bcrypt.compare('strong-password', inserted.passwordHash), true);
    assert.match(res.headers['Set-Cookie'], /HttpOnly/);
    assert.match(res.headers['Set-Cookie'], /SameSite=lax/);
    assert.equal('token' in res.body, false);
    assert.equal('passwordHash' in res.body.user, false);
  } finally {
    User.exists = originalExists;
    User.create = originalCreate;
  }
});

test('login sets the same cookie only after verifying the stored password hash', async () => {
  const originalFindOne = User.findOne;
  const passwordHash = await bcrypt.hash('correct-password', 4);
  User.findOne = () => ({ select: async () => ({
    id: 'user-id',
    username: 'Ada',
    email: 'ada@example.com',
    passwordHash,
    createdAt: new Date('2025-01-01T00:00:00Z')
  }) });
  try {
    const res = response();
    await login({ body: { email: 'ADA@example.com', password: 'correct-password' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.match(res.headers['Set-Cookie'], /margin_session=/);
    assert.equal('token' in res.body, false);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('Express login, session restore, and logout endpoints complete with a valid account', async () => {
  const originalFindOne = User.findOne;
  const originalFindById = User.findById;
  const passwordHash = await bcrypt.hash('correct-password', 4);
  const user = {
    id: 'user-id',
    _id: 'user-id',
    username: 'Ada',
    email: 'ada@example.com',
    passwordHash,
    createdAt: new Date('2025-01-01T00:00:00Z')
  };
  User.findOne = () => ({ select: async () => user });
  User.findById = () => ({ select: async () => user });
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: process.env.CLIENT_URL },
      body: JSON.stringify({ email: 'ada@example.com', password: 'correct-password' })
    });
    assert.equal(loginResponse.status, 200);
    const sessionCookie = loginResponse.headers.get('set-cookie').split(';')[0];
    assert.match(loginResponse.headers.get('set-cookie'), /HttpOnly/);
    assert.equal((await loginResponse.json()).user.username, 'Ada');

    const profileResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { cookie: sessionCookie, origin: process.env.CLIENT_URL }
    });
    assert.equal(profileResponse.status, 200);
    assert.equal((await profileResponse.json()).user.email, 'ada@example.com');

    const logoutResponse = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { origin: process.env.CLIENT_URL }
    });
    assert.equal(logoutResponse.status, 200);
    assert.match(logoutResponse.headers.get('set-cookie'), /Max-Age=0/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    User.findOne = originalFindOne;
    User.findById = originalFindById;
  }
});

test('cookie authentication verifies expiry and rejects cross-origin mutations', async () => {
  const originalFindById = User.findById;
  let databaseLookups = 0;
  User.findById = () => {
    databaseLookups += 1;
    return { select: async () => ({ id: 'user-id', username: 'Ada', email: 'ada@example.com' }) };
  };
  const token = jwt.sign({ sub: 'user-id' }, testSecret, { expiresIn: '1h' });
  const makeRequest = (origin, method = 'POST', value = token) => ({
    method,
    get(name) {
      if (name === 'authorization') return '';
      if (name === 'cookie') return `margin_session=${value}`;
      if (name === 'origin') return origin;
      return '';
    }
  });
  try {
    let nextCalled = false;
    await requireAuth(makeRequest('http://localhost:5173'), response(), () => { nextCalled = true; });
    assert.equal(nextCalled, true);
    assert.equal(databaseLookups, 1);

    for (const origin of ['http://localhost:5176', 'http://127.0.0.1:5182']) {
      nextCalled = false;
      await requireAuth(makeRequest(origin), response(), () => { nextCalled = true; });
      assert.equal(nextCalled, true);
    }
    assert.equal(databaseLookups, 3);

    const blocked = response();
    await requireAuth(makeRequest('https://attacker.example'), blocked, () => { throw new Error('unexpected authorization'); });
    assert.equal(blocked.statusCode, 403);
    assert.equal(databaseLookups, 3);

    const expiredToken = jwt.sign({ sub: 'user-id' }, testSecret, { expiresIn: '-1s' });
    const expired = response();
    await requireAuth(makeRequest('http://localhost:5173', 'GET', expiredToken), expired, () => { throw new Error('unexpected authorization'); });
    assert.equal(expired.statusCode, 401);
  } finally {
    User.findById = originalFindById;
  }
});

test('production cookie mutations require an explicitly configured origin', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalClientUrl = process.env.CLIENT_URL;
  const originalFindById = User.findById;
  User.findById = () => ({ select: async () => ({ id: 'user-id', username: 'Ada', email: 'ada@example.com' }) });
  process.env.NODE_ENV = 'production';
  process.env.CLIENT_URL = 'https://blog.example.com,https://www.example.com';
  try {
    const token = jwt.sign({ sub: 'user-id' }, testSecret, { expiresIn: '1h' });
    const allowed = response();
    await requireAuth({
      method: 'POST',
      get(name) {
        if (name === 'authorization') return '';
        if (name === 'cookie') return `margin_session=${token}`;
        if (name === 'origin') return 'https://www.example.com';
        return '';
      }
    }, allowed, () => {});
    assert.equal(allowed.statusCode, 200);

    const unlisted = response();
    await requireAuth({
      method: 'POST',
      get(name) {
        if (name === 'authorization') return '';
        if (name === 'cookie') return `margin_session=${token}`;
        if (name === 'origin') return 'https://preview.example.com';
        return '';
      }
    }, unlisted, () => { throw new Error('unexpected authorization'); });
    assert.equal(unlisted.statusCode, 403);
  } finally {
    User.findById = originalFindById;
    process.env.NODE_ENV = originalNodeEnv;
    process.env.CLIENT_URL = originalClientUrl;
  }
});

test('logout clears the browser session cookie', () => {
  const res = response();
  logout({}, res);
  assert.match(res.headers['Set-Cookie'], /Max-Age=0/);
  assert.match(res.headers['Set-Cookie'], /HttpOnly/);
});

test('production session cookies use Secure with SameSite=None', () => {
  const { setAuthCookie } = require('../src/utils/authCookie');
  process.env.NODE_ENV = 'production';
  process.env.COOKIE_SAME_SITE = 'none';
  const res = response();
  setAuthCookie(res, 'signed-token');
  assert.match(res.headers['Set-Cookie'], /HttpOnly/);
  assert.match(res.headers['Set-Cookie'], /Secure/);
  assert.match(res.headers['Set-Cookie'], /SameSite=none/);
});
