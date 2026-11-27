const mongoose = require('mongoose');
const { POST_CATEGORIES } = require('../constants');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, minlength: 3, maxlength: 160 },
  content: { type: String, required: true, trim: true, minlength: 1, maxlength: 30000 },
  category: { type: String, required: true, enum: POST_CATEGORIES, default: 'Other' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
