const test = require('node:test');
const assert = require('node:assert/strict');
const Comment = require('../src/models/Comment');
const Post = require('../src/models/Post');
const { listComments, createComment, deleteComment } = require('../src/controllers/commentController');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('comments are listed oldest first with public commenter information', async () => {
  const originalExists = Post.exists;
  const originalFind = Comment.find;
  const calls = {};
  const comments = [{ commentText: 'A response' }];
  Post.exists = async () => true;
  Comment.find = (filter) => {
    calls.filter = filter;
    return {
      populate(value) { calls.populate = value; return this; },
      sort(value) { calls.sort = value; return this; },
      lean: async () => comments
    };
  };
  try {
    const res = response();
    await listComments({ params: { postId: '507f1f77bcf86cd799439011' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.comments, comments);
    assert.deepEqual(calls.filter, { post: '507f1f77bcf86cd799439011' });
    assert.deepEqual(calls.sort, { createdAt: 1 });
  } finally {
    Post.exists = originalExists;
    Comment.find = originalFind;
  }
});

test('authenticated commenter can add a non-empty comment', async () => {
  const originalExists = Post.exists;
  const originalCreate = Comment.create;
  let inserted;
  const comment = {
    _id: 'comment-id',
    populate: async () => comment
  };
  Post.exists = async () => true;
  Comment.create = async (input) => { inserted = input; return comment; };
  try {
    const res = response();
    await createComment({
      params: { postId: '507f1f77bcf86cd799439011' },
      body: { commentText: '  A thoughtful response  ' },
      user: { id: 'user-id' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 201);
    assert.equal(inserted.commentText, 'A thoughtful response');
    assert.equal(inserted.user, 'user-id');
  } finally {
    Post.exists = originalExists;
    Comment.create = originalCreate;
  }
});

test('comment author can delete their own comment', async () => {
  const originalFindById = Comment.findById;
  let deleted = false;
  Comment.findById = async () => ({ user: 'user-id', deleteOne: async () => { deleted = true; } });
  try {
    const res = response();
    await deleteComment({
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: 'user-id' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.equal(deleted, true);
  } finally {
    Comment.findById = originalFindById;
  }
});
