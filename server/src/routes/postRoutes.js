const express = require('express');
const requireAuth = require('../middleware/auth');
const { listPosts, getPost, createPost, updatePost, deletePost } = require('../controllers/postController');

const router = express.Router();
router.get('/', listPosts);
router.get('/:id', getPost);
router.post('/', requireAuth, createPost);
router.put('/:id', requireAuth, updatePost);
router.delete('/:id', requireAuth, deletePost);

module.exports = router;
