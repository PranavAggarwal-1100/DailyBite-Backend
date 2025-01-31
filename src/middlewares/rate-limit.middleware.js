// const rateLimit = require('express-rate-limit');
// const { createClient } = require('@redis/client');
// const { RedisStore } = require('rate-limit-redis');
const rateLimit = require('express-rate-limit');

const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes by default
    max: options.max || 100, // Limit each IP/user to 100 requests per windowMs
    message: options.message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      return req.user ? req.user.id : req.ip;
    }
  });
};

module.exports = {
  apiLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100
  }),

  authLimiter: createRateLimiter({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 5,
    message: 'Too many login attempts, please try again after an hour'
  }),

  uploadLimiter: createRateLimiter({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 10,
    message: 'Too many uploads, please try again later'
  }),

  aiLimiter: createRateLimiter({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 50,
    message: 'AI request limit reached, please try again later'
  })
};
