const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isValidEmail, validateRegistration, validatePost, validateComment
} = require('../src/utils/validation');
const { ownsResource } = require('../src/utils/ownership');

test('registration validation checks username, email, and password boundaries', () => {
  assert.deepEqual(validateRegistration({ username: 'Ada', email: 'ada@example.com', password: 'strongpass' }), {});
  assert.ok(validateRegistration({ username: 'x', email: 'invalid', password: 'short' }).username);
  assert.equal(isValidEmail('name@example.org'), true);
  assert.equal(isValidEmail('name@invalid'), false);
  assert.ok(validateRegistration({ username: 'Ada', email: 'ada@example.com', password: '😀'.repeat(20) }).password);
});

test('post and comment validators reject empty or oversized content', () => {
  assert.deepEqual(validatePost({ title: 'A title', content: 'Body' }), {});
  assert.ok(validatePost({ title: 'no', content: '' }).title);
  assert.ok(validatePost(null).title);
  assert.ok(validateComment({ commentText: '   ' }).commentText);
  assert.ok(validateComment(null).commentText);
  assert.deepEqual(validateComment({ commentText: 'Useful comment' }), {});
});

test('ownership compares identifiers safely', () => {
  assert.equal(ownsResource('507f1f77bcf86cd799439011', { toString: () => '507f1f77bcf86cd799439011' }), true);
  assert.equal(ownsResource('owner-a', 'owner-b'), false);
});
