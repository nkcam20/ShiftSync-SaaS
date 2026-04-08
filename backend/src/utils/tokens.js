const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');

const generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, businessId: user.business_id },
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiry }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = { generateAccessToken, generateRefreshToken, generateInviteToken, verifyAccessToken };
