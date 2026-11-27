const AUTH_COOKIE = 'margin_session';
const AUTH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getAuthCookie(header = '') {
  const cookie = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${AUTH_COOKIE}=`));
  return cookie ? cookie.slice(AUTH_COOKIE.length + 1) : '';
}

function cookieAttributes() {
  const sameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('COOKIE_SAME_SITE must be lax, strict, or none.');
  }
  const secure = process.env.NODE_ENV === 'production';
  if (sameSite === 'none' && !secure) {
    throw new Error('COOKIE_SAME_SITE=none requires NODE_ENV=production and HTTPS.');
  }
  return `Path=/; HttpOnly; SameSite=${sameSite}${secure ? '; Secure' : ''}`;
}

function setAuthCookie(res, token) {
  res.append('Set-Cookie', `${AUTH_COOKIE}=${token}; Max-Age=${AUTH_MAX_AGE_SECONDS}; ${cookieAttributes()}`);
}

function clearAuthCookie(res) {
  res.append('Set-Cookie', `${AUTH_COOKIE}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${cookieAttributes()}`);
}

module.exports = { AUTH_COOKIE, getAuthCookie, setAuthCookie, clearAuthCookie };
