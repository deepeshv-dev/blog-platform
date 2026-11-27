const test = require('node:test');
const assert = require('node:assert/strict');
const { errorHandler } = require('../src/middleware/errors');

test('production errors return a generic message without leaking error details', () => {
  const originalEnvironment = process.env.NODE_ENV;
  const originalError = console.error;
  let log = '';
  process.env.NODE_ENV = 'production';
  console.error = (message) => { log = message; };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
  try {
    const error = Object.assign(new Error('mongodb://user:private-password@host/db'), { name: 'MongoServerError', code: 91 });
    errorHandler(error, {}, res, (nextError) => { throw nextError; });
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'An unexpected server error occurred.' });
    assert.equal(log, 'API request failed: MongoServerError (91)');
    assert.equal(log.includes('private-password'), false);
  } finally {
    if (originalEnvironment === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalEnvironment;
    console.error = originalError;
  }
});
