const test = require('node:test');
const assert = require('node:assert/strict');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const { listPosts, getPost, createPost, updatePost, deletePost } = require('../src/controllers/postController');
const { buildPostListQuery } = require('../src/utils/postQuery');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

test('post listing builds safe search, category, sort, and pagination filters', () => {
  const result = buildPostListQuery({
    q: 'garden ideas',
    category: 'Culture',
    author: '507f1f77bcf86cd799439011',
    sort: 'oldest',
    page: '3',
    limit: '12'
  });
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.filter, {
    category: 'Culture',
    author: '507f1f77bcf86cd799439011',
    $text: { $search: 'garden ideas' }
  });
  assert.equal(result.page, 3);
  assert.equal(result.limit, 12);
  assert.deepEqual(result.sort, { createdAt: 1, _id: 1 });
});

test('post listing rejects invalid query values and supports old posts without a category', () => {
  const invalid = buildPostListQuery({ category: 'Unknown', sort: 'random', page: '0', limit: '51' });
  assert.deepEqual(Object.keys(invalid.errors).sort(), ['category', 'limit', 'page', 'sort']);
  const other = buildPostListQuery({ category: 'Other' });
  assert.deepEqual(other.filter.$or, [{ category: 'Other' }, { category: { $exists: false } }]);
});

test('post and comment schemas declare search and lookup indexes', () => {
  const indexes = Post.schema.indexes().map(([definition]) => definition);
  assert.ok(indexes.some((index) => index.title === 'text' && index.content === 'text'));
  assert.ok(indexes.some((index) => index.category === 1 && index.createdAt === -1));
  assert.ok(indexes.some((index) => index.author === 1 && index.createdAt === -1));
  assert.ok(Comment.schema.indexes().some(([index]) => index.post === 1 && index.createdAt === 1));
});

test('list endpoint returns newest page results and the matching total count', async () => {
  const originalFind = Post.find;
  const originalCountDocuments = Post.countDocuments;
  const calls = {};
  const posts = [{ _id: 'one', title: 'Story' }];
  const query = {
    populate(value) { calls.populate = value; return this; },
    sort(value) { calls.sort = value; return this; },
    skip(value) { calls.skip = value; return this; },
    limit(value) { calls.limit = value; return this; },
    lean: async () => posts
  };
  Post.find = (filter) => { calls.filter = filter; return query; };
  Post.countDocuments = async (filter) => { calls.countFilter = filter; return 23; };
  try {
    const res = response();
    await listPosts({ query: { q: 'story', category: 'Writing', page: '2', limit: '10' } }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.posts, posts);
    assert.deepEqual(res.body.pagination, { page: 2, limit: 10, total: 23, totalPages: 3 });
    assert.equal(calls.skip, 10);
    assert.equal(calls.limit, 10);
    assert.deepEqual(calls.countFilter, calls.filter);
  } finally {
    Post.find = originalFind;
    Post.countDocuments = originalCountDocuments;
  }
});

test('create and retrieve posts preserve category and populated author data', async () => {
  const originalCreate = Post.create;
  const originalFindById = Post.findById;
  let inserted;
  const post = {
    _id: '507f1f77bcf86cd799439011',
    title: 'A new story',
    content: 'A useful story',
    category: 'Technology',
    author: 'author-id',
    populate: async () => post
  };
  Post.create = async (input) => { inserted = input; return post; };
  Post.findById = () => ({
    populate() { return this; },
    lean: async () => post
  });
  try {
    const created = response();
    await createPost({ body: { title: ' A new story ', content: ' A useful story ', category: 'Technology' }, user: { id: 'author-id' } }, created, (error) => { throw error; });
    assert.equal(created.statusCode, 201);
    assert.equal(inserted.title, 'A new story');
    assert.equal(inserted.category, 'Technology');
    const retrieved = response();
    await getPost({ params: { id: post._id } }, retrieved, (error) => { throw error; });
    assert.equal(retrieved.body.post, post);
  } finally {
    Post.create = originalCreate;
    Post.findById = originalFindById;
  }
});

test('owner can edit a post and persist its category', async () => {
  const originalFindById = Post.findById;
  const post = {
    author: 'author-id',
    save: async () => {},
    populate: async () => post
  };
  Post.findById = async () => post;
  try {
    const res = response();
    await updatePost({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { title: 'Revised title', content: 'Revised content', category: 'Writing' },
      user: { id: 'author-id' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.equal(post.title, 'Revised title');
    assert.equal(post.category, 'Writing');
  } finally {
    Post.findById = originalFindById;
  }
});

test('owner can delete a post and its comments', async () => {
  const originalFindById = Post.findById;
  const originalDeleteMany = Comment.deleteMany;
  const deleted = { comments: false, post: false };
  Post.findById = async () => ({ id: 'post-id', author: 'author-id', deleteOne: async () => { deleted.post = true; } });
  Comment.deleteMany = async () => { deleted.comments = true; };
  try {
    const res = response();
    await deletePost({
      params: { id: '507f1f77bcf86cd799439011' },
      user: { id: 'author-id' }
    }, res, (error) => { throw error; });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(deleted, { comments: true, post: true });
  } finally {
    Post.findById = originalFindById;
    Comment.deleteMany = originalDeleteMany;
  }
});
