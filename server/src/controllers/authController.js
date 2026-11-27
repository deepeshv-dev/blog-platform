const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateRegistration, isValidEmail } = require('../utils/validation');
const { setAuthCookie, clearAuthCookie } = require('../utils/authCookie');

function issueToken(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
}

async function register(req, res, next) {
  try {
    const fields = validateRegistration(req.body);
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Please correct the highlighted fields.', fields });
    const email = req.body.email.trim().toLowerCase();
    if (await User.exists({ email })) return res.status(409).json({ error: 'An account with that email already exists.' });
    const user = await User.create({
      username: req.body.username.trim(),
      email,
      passwordHash: await bcrypt.hash(req.body.password, 12)
    });
    setAuthCookie(res, issueToken(user));
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!isValidEmail(email) || password.length === 0 || password.length > 128) {
      return res.status(400).json({ error: 'Enter a valid email and password.' });
    }
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    setAuthCookie(res, issueToken(user));
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({ user: publicUser(req.user) });
}

function logout(req, res) {
  clearAuthCookie(res);
  return res.json({ message: 'Signed out.' });
}

module.exports = { register, login, me, logout };
