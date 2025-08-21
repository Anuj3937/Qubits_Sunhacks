const express = require('express');
const { body, param } = require('express-validator');
const flashcardController = require('../controllers/flashcardController');
const { authenticateToken } = require('../middleware/auth');
const { studyLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// All flashcard routes require authentication
router.use(authenticateToken);

// Generate flashcards from material
router.post('/generate/:materialId',
  studyLimiter,
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer'),
    body('flashcardCount')
      .optional()
      .isInt({ min: 5, max: 30 })
      .withMessage('Flashcard count must be between 5 and 30'),
    body('topics')
      .optional()
      .isArray()
      .withMessage('Topics must be an array')
  ],
  flashcardController.generateFlashcards
);

// Get flashcards for material
router.get('/:materialId',
  [
    param('materialId').isInt().withMessage('Material ID must be a valid integer')
  ],
  flashcardController.getFlashcards
);

// Get due flashcards for spaced repetition
router.get('/due/today', flashcardController.getDueFlashcards);

// Get user's all flashcards
router.get('/user/all', flashcardController.getAllUserFlashcards);

// Update flashcard after review (spaced repetition)
router.post('/review/:flashcardId',
  [
    param('flashcardId').isInt().withMessage('Flashcard ID must be a valid integer'),
    body('quality')
      .isInt({ min: 0, max: 5 })
      .withMessage('Quality must be an integer between 0 and 5')
  ],
  flashcardController.reviewFlashcard
);

// Create custom flashcard
router.post('/custom',
  [
    body('materialId').isInt().withMessage('Material ID must be a valid integer'),
    body('frontText')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Front text must be between 1 and 500 characters'),
    body('backText')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Back text must be between 1 and 1000 characters'),
    body('topic')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Topic must be between 1 and 50 characters'),
    body('difficultyLevel')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Difficulty level must be between 1 and 5')
  ],
  flashcardController.createFlashcard
);

// Update flashcard
router.put('/:flashcardId',
  [
    param('flashcardId').isInt().withMessage('Flashcard ID must be a valid integer'),
    body('frontText')
      .optional()
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('Front text must be between 1 and 500 characters'),
    body('backText')
      .optional()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Back text must be between 1 and 1000 characters'),
    body('topic')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Topic must be between 1 and 50 characters'),
    body('difficultyLevel')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Difficulty level must be between 1 and 5')
  ],
  flashcardController.updateFlashcard
);

// Delete flashcard
router.delete('/:flashcardId',
  [
    param('flashcardId').isInt().withMessage('Flashcard ID must be a valid integer')
  ],
  flashcardController.deleteFlashcard
);

// Get flashcard statistics
router.get('/stats/user', flashcardController.getFlashcardStats);

// Get topic-based statistics
router.get('/stats/topics', flashcardController.getTopicStats);

module.exports = router;
