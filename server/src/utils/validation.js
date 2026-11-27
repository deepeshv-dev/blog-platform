const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { POST_CATEGORIES } = require('../constants');

function isValidEmail(value) {
  return typeof value === 'string' && value.length <= 254 && EMAIL_PATTERN.test(value.trim());
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function validateRegistration(value = {}) {
  const { username, email, password } = asObject(value);
  const errors = {};
  if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 30) {
    errors.username = 'Username must be between 2 and 30 characters.';
  }
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (typeof password !== 'string' || password.length < 8 || password.length > 128 || Buffer.byteLength(password, 'utf8') > 72) {
    errors.password = 'Password must be 8–128 characters and no more than 72 UTF-8 bytes.';
  }
  return errors;
}

function validatePost(value = {}) {
  const { title, content, category } = asObject(value);
  const errors = {};
  if (typeof title !== 'string' || title.trim().length < 3 || title.trim().length > 160) {
    errors.title = 'Title must be between 3 and 160 characters.';
  }
  if (typeof content !== 'string' || content.trim().length < 1 || content.trim().length > 30000) {
    errors.content = 'Content must be between 1 and 30,000 characters.';
  }
  if (category !== undefined && (typeof category !== 'string' || !POST_CATEGORIES.includes(category))) {
    errors.category = 'Choose a valid category.';
  }
  return errors;
}

function validateComment(value = {}) {
  const { commentText } = asObject(value);
  return typeof commentText === 'string' && commentText.trim().length > 0 && commentText.trim().length <= 2000
    ? {}
    : { commentText: 'Comment must be between 1 and 2,000 characters.' };
}

module.exports = { isValidEmail, validateRegistration, validatePost, validateComment, POST_CATEGORIES };
