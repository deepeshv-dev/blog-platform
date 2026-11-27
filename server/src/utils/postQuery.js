const mongoose = require('mongoose');
const { POST_CATEGORIES } = require('../constants');

function buildPostListQuery(query = {}) {
  const errors = {};
  const filter = {};
  let search = '';
  let page = 1;
  let limit = 9;
  let direction = -1;

  if (query.q !== undefined) {
    if (typeof query.q !== 'string' || query.q.trim().length > 100) {
      errors.q = 'Search must be a string of at most 100 characters.';
    } else {
      search = query.q.trim();
    }
  }
  if (query.category !== undefined && query.category !== '') {
    if (typeof query.category !== 'string' || !POST_CATEGORIES.includes(query.category)) {
      errors.category = 'Choose a valid category.';
    } else if (query.category === 'Other') {
      filter.$or = [{ category: 'Other' }, { category: { $exists: false } }];
    } else {
      filter.category = query.category;
    }
  }
  if (query.author !== undefined) {
    if (typeof query.author !== 'string' || !mongoose.isValidObjectId(query.author)) {
      errors.author = 'Author identifier is invalid.';
    } else {
      filter.author = query.author;
    }
  }
  if (query.sort !== undefined) {
    if (!['newest', 'oldest'].includes(query.sort)) errors.sort = 'Sort must be newest or oldest.';
    else direction = query.sort === 'oldest' ? 1 : -1;
  }
  for (const [name, maximum] of [['page', 1000000], ['limit', 50]]) {
    if (query[name] === undefined || query[name] === '') continue;
    const value = Number(query[name]);
    if (!Number.isInteger(value) || value < 1 || value > maximum) {
      errors[name] = `${name} must be a positive integer${name === 'page' ? ' no greater than 1000000' : ' no greater than 50'}.`;
    } else if (name === 'page') {
      page = value;
    } else {
      limit = value;
    }
  }
  if (search) filter.$text = { $search: search };

  return {
    errors,
    filter,
    page,
    limit,
    sort: { createdAt: direction, _id: direction }
  };
}

module.exports = { buildPostListQuery };
