require('dotenv').config();
const createApp = require('./app');
const connectDatabase = require('./config/db');
const { getConfiguredClientOrigins } = require('./utils/clientOrigins');

const port = process.env.PORT ? Number(process.env.PORT) : 5000;
const requiredEnvironment = ['MONGODB_URI', 'JWT_SECRET', 'CLIENT_URL'];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name] || !process.env[name].trim());

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Unable to start API: PORT must be an integer between 1 and 65535.');
  process.exit(1);
}
if (missingEnvironment.length) {
  console.error(`Unable to start API: missing ${missingEnvironment.join(', ')}. Copy server/.env.example to server/.env and configure each value.`);
  process.exit(1);
}
if (Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
  console.error('Unable to start API: JWT_SECRET must contain at least 32 bytes. Configure a private value in server/.env.');
  process.exit(1);
}
try {
  getConfiguredClientOrigins();
} catch {
  console.error('Unable to start API: CLIENT_URL must contain one or more comma-separated absolute HTTP or HTTPS origins, without paths.');
  process.exit(1);
}
const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(cookieSameSite) || (cookieSameSite === 'none' && process.env.NODE_ENV !== 'production')) {
  console.error('Unable to start API: COOKIE_SAME_SITE must be lax/strict, or none in production over HTTPS.');
  process.exit(1);
}

connectDatabase()
  .then(() => {
    createApp().listen(port, () => console.log(`Blog API listening on port ${port}`));
  })
  .catch((error) => {
    const errorType = error && typeof error.name === 'string' ? error.name : 'DatabaseError';
    const errorCode = error && (typeof error.code === 'string' || typeof error.code === 'number') ? ` (${error.code})` : '';
    console.error(`Unable to start API: ${errorType}${errorCode}. Check MONGODB_URI, network access, and the database allow-list.`);
    process.exitCode = 1;
  });
