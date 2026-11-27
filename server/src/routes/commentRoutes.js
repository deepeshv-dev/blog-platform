const express = require('express');
const requireAuth = require('../middleware/auth');
const { listComments, createComment, deleteComment } = require('../controllers/commentController');

const router = express.Router();
router.get('/:postId', listComments);
router.post('/:postId', requireAuth, createComment);
router.delete('/:id', requireAuth, deleteComment);

module.exports = router;
