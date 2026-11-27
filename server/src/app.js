const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const { notFound, errorHandler } = require('./middleware/errors');
const mongoose = require('mongoose');
const { getConfiguredClientOrigins, isAllowedClientOrigin } = require('./utils/clientOrigins');

function createApp() {
  const app = express();
  const clientOrigins = getConfiguredClientOrigins();
  app.disable('x-powered-by');
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      callback(null, isAllowedClientOrigin(origin, clientOrigins));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json({ limit: '128kb', strict: false }));
  app.use((req, res, next) => {
    if (req.body !== undefined && (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }
    return next();
  });
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/api/ready', (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    return res.status(ready ? 200 : 503).json({ status: ready ? 'ready' : 'unavailable' });
  });
  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/comments', commentRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
