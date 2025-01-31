// const redisClient = require('../config/redis');

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 3600 }); // Default TTL of 1 hour

const cacheMiddleware = (duration = 3600) => {
  return async (req, res, next) => {
    if (process.env.CACHE_DISABLED === 'true') return next();

    const key = `cache:${req.originalUrl || req.url}:${req.user?.id || 'guest'}`;

    try {
      const cachedResponse = cache.get(key);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Modify res.json to store the response in cache
      const originalJson = res.json;
      res.json = function(body) {
        cache.set(key, body, duration);
        originalJson.call(this, body);
      };

      next();
    } catch (error) {
      next(); // Proceed without caching if there's an error
    }
  };
};

module.exports = cacheMiddleware;
