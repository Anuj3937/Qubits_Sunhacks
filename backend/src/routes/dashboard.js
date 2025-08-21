const express = require('express');
const { param, query } = require('express-validator');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticateToken);
router.use(generalLimiter);

// Get main dashboard data
router.get('/', dashboardController.getDashboardData);

// Get study progress overview
router.get('/progress', dashboardController.getStudyProgress);

// Get progress for specific time period
router.get('/progress/:period',
  [
    param('period')
      .isIn(['week', 'month', 'quarter', 'year'])
      .withMessage('Period must be one of: week, month, quarter, year')
  ],
  dashboardController.getProgressByPeriod
);

// Get study streak information
router.get('/streak', dashboardController.getStudyStreak);

// Get knowledge heatmap data
router.get('/heatmap', dashboardController.getKnowledgeHeatmap);

// Get weak areas analysis
router.get('/weak-areas',
  [
    query('materialId')
      .optional()
      .isInt()
      .withMessage('Material ID must be a valid integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 20 })
      .withMessage('Limit must be between 1 and 20')
  ],
  dashboardController.getWeakAreas
);

// Get study statistics by topic
router.get('/stats/topics', dashboardController.getTopicStats);

// Get study statistics by material
router.get('/stats/materials', dashboardController.getMaterialStats);

// Get recent activity
router.get('/activity',
  [
    query('days')
      .optional()
      .isInt({ min: 1, max: 90 })
      .withMessage('Days must be between 1 and 90'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be between 1 and 50')
  ],
  dashboardController.getRecentActivity
);

// Get study goals and achievements
router.get('/achievements', dashboardController.getAchievements);

// Set or update study goals
router.post('/goals',
  [
    body('dailyStudyMinutes')
      .optional()
      .isInt({ min: 5, max: 480 })
      .withMessage('Daily study minutes must be between 5 and 480'),
    body('weeklyQuizGoal')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Weekly quiz goal must be between 1 and 50'),
    body('flashcardReviewGoal')
      .optional()
      .isInt({ min: 5, max: 200 })
      .withMessage('Flashcard review goal must be between 5 and 200')
  ],
  dashboardController.setStudyGoals
);

// Get export data for user (for data portability)
router.get('/export',
  [
    query('format')
      .optional()
      .isIn(['json', 'csv'])
      .withMessage('Format must be json or csv'),
    query('includeContent')
      .optional()
      .isBoolean()
      .withMessage('Include content must be a boolean')
  ],
  dashboardController.exportUserData
);

module.exports = router;
