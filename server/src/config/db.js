const mongoose = require('mongoose');

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (typeof uri !== 'string' || !uri.trim()) {
    throw new Error('MONGODB_URI is required. Copy server/.env.example to server/.env and configure it.');
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2) return mongoose.connection.asPromise();
  await mongoose.connect(uri.trim());
  return mongoose.connection;
}

module.exports = connectDatabase;
