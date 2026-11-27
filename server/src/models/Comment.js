const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commentText: { type: String, required: true, trim: true, minlength: 1, maxlength: 2000 }
}, { timestamps: { createdAt: true, updatedAt: false } });

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
