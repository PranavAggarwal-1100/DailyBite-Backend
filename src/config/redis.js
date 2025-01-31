const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: true
};

const redis = new Redis(redisConfig);

redis.on('error', (error) => {
  logger.error('Redis error:', error);
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

module.exports = redis;
