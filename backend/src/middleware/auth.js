const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const redisService = require('../config/redis');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists in database
    const userResult = await pool.query(
      'SELECT id, email, name, academic_level, preferred_language FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token: user not found' });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.user = userResult.rows[0];
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await pool.query(
        'SELECT id, email, name, academic_level, preferred_language FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length > 0) {
        req.userId = decoded.userId;
        req.user = userResult.rows[0];
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

// Rate limiting middleware using Redis
const createRateLimit = (maxRequests = 100, windowMs = 900000, endpoint = 'general') => {
  return async (req, res, next) => {
    try {
      const userId = req.userId || req.ip;
      const rateLimitData = await redisService.incrementApiCall(userId, endpoint, windowMs);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - rateLimitData.count),
        'X-RateLimit-Reset': new Date(rateLimitData.resetTime).toISOString()
      });

      if (rateLimitData.count > maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitData.resetTime - Date.now()) / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue on rate limiting errors
      next();
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  createRateLimit
};
