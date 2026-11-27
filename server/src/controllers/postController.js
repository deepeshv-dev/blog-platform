const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { validatePost } = require('../utils/validation');
const { ownsResource } = require('../utils/ownership');
const { buildPostListQuery } = require('../utils/postQuery');

async function listPosts(req, res, next) {
  try {
    const { errors, filter, page, limit, sort } = buildPostListQuery(req.query);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Please correct the query parameters.', fields: errors });
    const [total, posts] = await Promise.all([
      Post.countDocuments(filter),
      Post.find(filter)
        .populate('author', 'username')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);
    return res.json({ posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return next(error);
  }
}

async function getPost(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid post identifier.' });
    const post = await Post.findById(req.params.id).populate('author', 'username').lean();
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    return res.json({ post });
  } catch (error) {
    return next(error);
  }
}

async function createPost(req, res, next) {
  try {
    const fields = validatePost(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields });
    const post = await Post.create({
      title: req.body.title.trim(),
      content: req.body.content.trim(),
      category: req.body.category || 'Other',
      author: req.user.id
    });
    await post.populate('author', 'username');
    return res.status(201).json({ post });
  } catch (error) {
    return next(error);
  }
}

async function updatePost(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid post identifier.' });
    const fields = validatePost(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (!ownsResource(post.author, req.user.id)) return res.status(403).json({ error: 'You can only edit your own posts.' });
    post.title = req.body.title.trim();
    post.content = req.body.content.trim();
    post.category = req.body.category || 'Other';
    await post.save();
    await post.populate('author', 'username');
    return res.json({ post });
  } catch (error) {
    return next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid post identifier.' });
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    if (!ownsResource(post.author, req.user.id)) return res.status(403).json({ error: 'You can only delete your own posts.' });
    await Promise.all([Comment.deleteMany({ post: post.id }), post.deleteOne()]);
    return res.json({ message: 'Post deleted.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listPosts, getPost, createPost, updatePost, deletePost };
