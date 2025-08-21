const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const quizRoutes = require('./routes/quiz');
const flashcardRoutes = require('./routes/flashcard');
const tutorRoutes = require('./routes/tutor');
const dashboardRoutes = require('./routes/dashboard');

// Import middleware
const { generalLimiter } = require('./middleware/rateLimit');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' 
}));

// Apply general rate limiting
app.use('/api/', generalLimiter);

// Static files (for uploaded files, if serving them directly)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/flashcard', flashcardRoutes);
app.use('/api/tutor', tutorRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint (placeholder)
app.get('/api', (req, res) => {
  res.json({
    name: 'StudyGenie API',
    version: '1.0.0',
    description: 'AI-powered personalized study guide generator',
    endpoints: {
      auth: '/api/auth',
      upload: '/api/upload',
      quiz: '/api/quiz',
      flashcard: '/api/flashcard',
      tutor: '/api/tutor',
      dashboard: '/api/dashboard'
    }
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', {
    error: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      maxSize: '10MB'
    });
  }

  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Resource already exists'
    });
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Referenced resource not found'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : error.message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error
      })
    }
  });
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app;
