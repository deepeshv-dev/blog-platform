const test = require('node:test');
const assert = require('node:assert/strict');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const { updatePost, deletePost } = require('../src/controllers/postController');
const { deleteComment } = require('../src/controllers/commentController');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('a different user cannot update a post', async () => {
  const originalFindById = Post.findById;
  let saved = false;
  Post.findById = async () => ({ author: 'author-id', save: async () => { saved = true; } });
  try {
    const res = response();
    await updatePost({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { title: 'Updated title', content: 'Updated story' },
      user: { id: 'another-user' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 403);
    assert.equal(saved, false);
  } finally {
    Post.findById = originalFindById;
  }
});

test('a different user cannot delete a post', async () => {
  const originalFindById = Post.findById;
  let deleted = false;
  Post.findById = async () => ({ author: 'author-id', deleteOne: async () => { deleted = true; } });
  try {
    const res = response();
    await deletePost({
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: 'another-user' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 403);
    assert.equal(deleted, false);
  } finally {
    Post.findById = originalFindById;
  }
});

test('a different user cannot delete a comment', async () => {
  const originalFindById = Comment.findById;
  let deleted = false;
  Comment.findById = async () => ({ user: 'comment-author', deleteOne: async () => { deleted = true; } });
  try {
    const res = response();
    await deleteComment({
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: 'another-user' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 403);
    assert.equal(deleted, false);
  } finally {
    Comment.findById = originalFindById;
  }
});
