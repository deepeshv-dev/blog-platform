function ownsResource(resourceOwnerId, userId) {
  return Boolean(resourceOwnerId && userId && String(resourceOwnerId) === String(userId));
}

module.exports = { ownsResource };
