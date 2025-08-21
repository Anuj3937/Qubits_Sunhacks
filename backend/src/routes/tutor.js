const express = require('express');
const { body, param } = require('express-validator');
const tutorController = require('../controllers/tutorController');
const { authenticateToken } = require('../middleware/auth');
const { aiProcessingLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// All tutor routes require authentication
router.use(authenticateToken);

// Ask question to AI tutor
router.post('/ask/:materialId',
  aiProcessingLimiter,
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer'),
    body('question')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Question must be between 5 and 500 characters'),
    body('language')
      .optional()
      .isIn(['English', 'Hindi', 'Marathi'])
      .withMessage('Language must be one of: English, Hindi, Marathi'),
    body('complexity')
      .optional()
      .isIn(['simple', 'detailed', 'advanced'])
      .withMessage('Complexity must be one of: simple, detailed, advanced')
  ],
  tutorController.askQuestion
);

// Get conversation history with tutor for a material
router.get('/history/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer')
  ],
  tutorController.getConversationHistory
);

// Clear conversation history
router.delete('/history/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer')
  ],
  tutorController.clearConversationHistory
);

// Get suggested questions for a material
router.get('/suggestions/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer')
  ],
  tutorController.getSuggestedQuestions
);

// Explain wrong quiz answer
router.post('/explain-answer',
  [
    body('question').trim().notEmpty().withMessage('Question is required'),
    body('correctAnswer').trim().notEmpty().withMessage('Correct answer is required'),
    body('userAnswer').trim().notEmpty().withMessage('User answer is required'),
    body('context')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Context must be less than 2000 characters'),
    body('language')
      .optional()
      .isIn(['English', 'Hindi', 'Marathi'])
      .withMessage('Language must be one of: English, Hindi, Marathi')
  ],
  tutorController.explainAnswer
);

module.exports = router;
