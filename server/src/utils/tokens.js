const jwt = require('jsonwebtoken');

function signAccessToken(payload) {
  const secret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  return jwt.sign(payload, secret, { expiresIn });
}

function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
}

function verifyAccessToken(token) {
  const secret = process.env.JWT_ACCESS_SECRET || 'access_secret';
  return jwt.verify(token, secret);
}

function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
  return jwt.verify(token, secret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};


