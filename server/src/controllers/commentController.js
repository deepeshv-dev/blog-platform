const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { validateComment } = require('../utils/validation');
const { ownsResource } = require('../utils/ownership');

async function listComments(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) return res.status(400).json({ error: 'Invalid post identifier.' });
    if (!(await Post.exists({ _id: req.params.postId }))) return res.status(404).json({ error: 'Post not found.' });
    const comments = await Comment.find({ post: req.params.postId })
      .populate('user', 'username')
      .sort({ createdAt: 1 })
      .lean();
    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
}

async function createComment(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.postId)) return res.status(400).json({ error: 'Invalid post identifier.' });
    const fields = validateComment(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields });
    if (!(await Post.exists({ _id: req.params.postId }))) return res.status(404).json({ error: 'Post not found.' });
    const comment = await Comment.create({
      post: req.params.postId,
      user: req.user.id,
      commentText: req.body.commentText.trim()
    });
    await comment.populate('user', 'username');
    return res.status(201).json({ comment });
  } catch (error) {
    return next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid comment identifier.' });
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (!ownsResource(comment.user, req.user.id)) return res.status(403).json({ error: 'You can only delete your own comments.' });
    await comment.deleteOne();
    return res.json({ message: 'Comment deleted.' });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listComments, createComment, deleteComment };
