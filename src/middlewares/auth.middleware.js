const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { AppError } = require('./error.middleware');
const { User } = require('../models');

// In-memory token blacklist with automatic cleanup
class TokenBlacklist {
  constructor() {
    this.blacklist = new Map();
    // Clean up expired tokens every hour
    setInterval(() => this.cleanupExpiredTokens(), 60 * 60 * 1000);
  }

  add(token, expiresIn = 24 * 60 * 60 * 1000) { // Default 24 hours
    this.blacklist.set(token, Date.now() + expiresIn);
  }

  isBlacklisted(token) {
    return this.blacklist.has(token);
  }

  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, expiry] of this.blacklist.entries()) {
      if (expiry < now) {
        this.blacklist.delete(token);
      }
    }
  }
}

const tokenBlacklist = new TokenBlacklist();

const authMiddleware = async (req, res, next) => {
  try {
    // 1) Check if token exists
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError(401, 'You are not logged in. Please log in to get access.'));
    }

    // 2) Check if token is blacklisted
    if (tokenBlacklist.isBlacklisted(token)) {
      return next(new AppError(401, 'Token is no longer valid. Please log in again.'));
    }

    // 3) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 4) Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError(401, 'The user belonging to this token no longer exists.'));
    }

    // 5) Check if user changed password after token was issued
    if (user.passwordChangedAt && decoded.iat < user.passwordChangedAt.getTime() / 1000) {
      return next(new AppError(401, 'User recently changed password. Please log in again.'));
    }

    // Grant access
    req.user = user;
    next();
  } catch (error) {
    next(new AppError(401, 'Invalid token. Please log in again.'));
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
};

// Export the tokenBlacklist for use in logout functionality
module.exports = {
  authMiddleware,
  restrictTo,
  tokenBlacklist
};