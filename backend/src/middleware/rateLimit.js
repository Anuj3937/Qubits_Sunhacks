const rateLimit = require('express-rate-limit');
const redisService = require('../config/redis');

// Custom store using Redis
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.expiry = options.expiry || 900; // 15 minutes in seconds
  }

  async increment(key) {
    try {
      const redisKey = this.prefix + key;
      const current = await redisService.client.get(redisKey);
      
      if (!current) {
        await redisService.client.setEx(redisKey, this.expiry, '1');
        return { totalHits: 1, resetTime: new Date(Date.now() + this.expiry * 1000) };
      }
      
      const totalHits = await redisService.client.incr(redisKey);
      const ttl = await redisService.client.ttl(redisKey);
      
      return {
        totalHits,
        resetTime: new Date(Date.now() + ttl * 1000)
      };
    } catch (error) {
      console.error('Redis rate limit store error:', error);
      // Fallback to allowing the request
      return { totalHits: 1, resetTime: new Date(Date.now() + this.expiry * 1000) };
    }
  }

  async decrement(key) {
    try {
      const redisKey = this.prefix + key;
      await redisService.client.decr(redisKey);
    } catch (error) {
      console.error('Redis rate limit decrement error:', error);
    }
  }

  async resetKey(key) {
    try {
      const redisKey = this.prefix + key;
      await redisService.client.del(redisKey);
    } catch (error) {
      console.error('Redis rate limit reset error:', error);
    }
  }
}

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'general:' }),
  keyGenerator: (req) => {
    return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
  }
});

// Upload-specific rate limit (more restrictive)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit uploads to 10 per hour
  message: {
    error: 'Upload limit exceeded',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'upload:', expiry: 3600 }),
  keyGenerator: (req) => {
    return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
  },
  skip: (req) => {
    // Skip rate limiting for certain user levels (future enhancement)
    return false;
  }
});

// AI processing rate limit
const aiProcessingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit AI processing to 50 requests per hour
  message: {
    error: 'AI processing limit exceeded',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'ai:', expiry: 3600 }),
  keyGenerator: (req) => {
    return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
  }
});

// Quiz generation rate limit
const quizLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // Limit quiz generation to 20 requests per 10 minutes
  message: {
    error: 'Quiz generation limit exceeded',
    retryAfter: '10 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'quiz:', expiry: 600 }),
  keyGenerator: (req) => {
    return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
  }
});

// Flashcard study rate limit (generous for studying)
const studyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Allow frequent study sessions
  message: {
    error: 'Study session limit exceeded',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({ prefix: 'study:', expiry: 900 }),
  keyGenerator: (req) => {
    return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
  }
});

module.exports = {
  generalLimiter,
  uploadLimiter,
  aiProcessingLimiter,
  quizLimiter,
  studyLimiter,
  RedisStore
};
