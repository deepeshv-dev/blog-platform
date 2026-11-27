const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getAuthCookie } = require('../utils/authCookie');
const { getConfiguredClientOrigins, isAllowedClientOrigin } = require('../utils/clientOrigins');

async function requireAuth(req, res, next) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  const cookieToken = getAuthCookie(req.get('cookie') || '');
  const token = match ? match[1] : cookieToken;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  if (!process.env.JWT_SECRET) return res.status(500).json({ error: 'Authentication is not configured.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload.sub) return res.status(401).json({ error: 'Invalid or expired session.' });
    if (!match && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      if (!isAllowedClientOrigin(req.get('origin'), getConfiguredClientOrigins())) {
        return res.status(403).json({ error: 'Request origin is not allowed.' });
      }
    }
    const user = await User.findById(payload.sub).select('_id username email');
    if (!user) return res.status(401).json({ error: 'Session is no longer valid.' });
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }
    return next(error);
  }
}

module.exports = requireAuth;
