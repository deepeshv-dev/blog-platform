const DEVELOPMENT_LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1']);

function getConfiguredClientOrigins(value = process.env.CLIENT_URL) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('CLIENT_URL must contain at least one absolute HTTP or HTTPS origin.');
  }

  const entries = value.split(',');
  if (entries.some((entry) => !entry.trim())) {
    throw new Error('CLIENT_URL contains an empty origin.');
  }

  const origins = new Set();
  for (const entry of entries) {
    let url;
    try {
      url = new URL(entry.trim());
    } catch {
      throw new Error('CLIENT_URL must contain absolute HTTP or HTTPS origins.');
    }

    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('CLIENT_URL entries must be origins without credentials, paths, queries, or fragments.');
    }
    origins.add(url.origin);
  }

  return [...origins];
}

function isAllowedClientOrigin(origin, configuredOrigins, nodeEnv = process.env.NODE_ENV) {
  if (typeof origin !== 'string' || !origin) return false;

  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (url.origin !== origin || url.username || url.password) return false;
  if (
    ['development', 'test'].includes(nodeEnv) &&
    url.protocol === 'http:' &&
    DEVELOPMENT_LOOPBACK_HOSTS.has(url.hostname)
  ) {
    return true;
  }

  return configuredOrigins.includes(url.origin);
}

module.exports = { getConfiguredClientOrigins, isAllowedClientOrigin };
