const express = require('express');
const { body, param } = require('express-validator');
const quizController = require('../controllers/quizController');
const { authenticateToken } = require('../middleware/auth');
const { quizLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// All quiz routes require authentication
router.use(authenticateToken);

// Generate quiz from material
router.post('/generate/:materialId',
  quizLimiter,
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer'),
    body('questionCount')
      .optional()
      .isInt({ min: 5, max: 20 })
      .withMessage('Question count must be between 5 and 20'),
    body('difficultyLevel')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty level must be easy, medium, or hard'),
    body('topics')
      .optional()
      .isArray()
      .withMessage('Topics must be an array')
  ],
  quizController.generateQuiz
);

// Get quiz questions
router.get('/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer')
  ],
  quizController.getQuiz
);

// Submit quiz answers
router.post('/submit/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer'),
    body('answers')
      .isArray({ min: 1 })
      .withMessage('Answers array is required and must not be empty'),
    body('timeTaken')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Time taken must be a positive integer'),
    body('answers.*.questionId')
      .notEmpty()
      .withMessage('Question ID is required for each answer'),
    body('answers.*.selectedAnswer')
      .notEmpty()
      .withMessage('Selected answer is required for each question')
  ],
  quizController.submitQuiz
);

// Get quiz results
router.get('/results/:attemptId',
  [
    param('attemptId').isInt().withMessage('Attempt ID must be a valid integer')
  ],
  quizController.getQuizResults
);

// Get user's quiz history
router.get('/history/user', quizController.getQuizHistory);

// Get quiz history for specific material
router.get('/history/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer')
  ],
  quizController.getMaterialQuizHistory
);

// Delete a quiz attempt
router.delete('/attempt/:attemptId',
  [
    param('attemptId').isInt().withMessage('Attempt ID must be a valid integer')
  ],
  quizController.deleteQuizAttempt
);

module.exports = router;
