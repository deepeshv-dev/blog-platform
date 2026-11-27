const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me, logout } = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false });

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

module.exports = router;
