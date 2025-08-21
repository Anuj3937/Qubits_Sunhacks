const redis = require('redis');
require('dotenv').config();

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        console.log('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('error', (err) => {
        console.error('Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('end', () => {
        console.log('Redis client connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error('Redis connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // Cache study materials processing status
  async cacheProcessingStatus(materialId, status, ttl = 3600) {
    if (!this.isConnected) return false;
    
    try {
      const key = `processing:${materialId}`;
      await this.client.setEx(key, ttl, JSON.stringify({
        status,
        timestamp: new Date().toISOString()
      }));
      return true;
    } catch (error) {
      console.error('Redis cache error:', error);
      return false;
    }
  }

  async getProcessingStatus(materialId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `processing:${materialId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Cache user progress data
  async cacheUserProgress(userId, progressData, ttl = 1800) {
    if (!this.isConnected) return false;
    
    try {
      const key = `progress:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify(progressData));
      return true;
    } catch (error) {
      console.error('Redis cache error:', error);
      return false;
    }
  }

  async getUserProgress(userId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `progress:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Cache flashcards for spaced repetition
  async cacheFlashcardsDue(userId, flashcards, ttl = 900) {
    if (!this.isConnected) return false;
    
    try {
      const key = `flashcards:due:${userId}`;
      await this.client.setEx(key, ttl, JSON.stringify(flashcards));
      return true;
    } catch (error) {
      console.error('Redis cache error:', error);
      return false;
    }
  }

  async getFlashcardsDue(userId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `flashcards:due:${userId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  // Rate limiting for API calls
  async incrementApiCall(userId, endpoint, windowMs = 900000) { // 15 minutes default
    if (!this.isConnected) return { count: 1, resetTime: Date.now() + windowMs };
    
    try {
      const key = `ratelimit:${userId}:${endpoint}`;
      const current = await this.client.get(key);
      
      if (!current) {
        await this.client.setEx(key, Math.ceil(windowMs / 1000), '1');
        return { count: 1, resetTime: Date.now() + windowMs };
      }
      
      const count = await this.client.incr(key);
      const ttl = await this.client.ttl(key);
      
      return { 
        count, 
        resetTime: Date.now() + (ttl * 1000)
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      return { count: 1, resetTime: Date.now() + windowMs };
    }
  }

  // Session management
  async setSession(sessionId, userData, ttl = 86400) { // 24 hours default
    if (!this.isConnected) return false;
    
    try {
      const key = `session:${sessionId}`;
      await this.client.setEx(key, ttl, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Redis session error:', error);
      return false;
    }
  }

  async getSession(sessionId) {
    if (!this.isConnected) return null;
    
    try {
      const key = `session:${sessionId}`;
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis session get error:', error);
      return null;
    }
  }

  async deleteSession(sessionId) {
    if (!this.isConnected) return false;
    
    try {
      const key = `session:${sessionId}`;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis session delete error:', error);
      return false;
    }
  }
}

// Create singleton instance
const redisService = new RedisService();

// Initialize connection
redisService.connect().catch(error => {
  console.error('Failed to connect to Redis:', error);
});

module.exports = redisService;
