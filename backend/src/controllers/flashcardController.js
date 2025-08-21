const { validationResult } = require('express-validator');
const StudyMaterial = require('../models/StudyMaterial');
const FlashCard = require('../models/FlashCard');
const flashcardGenerator = require('../services/flashcardGenerator');
const redisService = require('../config/redis');

class FlashcardController {
  async generateFlashcards(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const { flashcardCount = 15, topics = [] } = req.body;
      const userId = req.userId;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      if (material.processing_status !== 'completed') {
        return res.status(400).json({ 
          error: 'Material is still being processed',
          status: material.processing_status
        });
      }

      // Check if flashcards already exist for this material
      const existingFlashcards = await FlashCard.findByMaterialId(materialId, userId, { limit: 1 });
      if (existingFlashcards.flashcards.length > 0) {
        return res.status(400).json({ 
          error: 'Flashcards already exist for this material',
          suggestion: 'Use the get flashcards endpoint to retrieve existing ones'
        });
      }

      // Get processed content
      const processedContent = await StudyMaterial.getProcessedContent(materialId, userId);
      if (!processedContent || !processedContent.extractedText) {
        return res.status(400).json({ error: 'No content available for flashcard generation' });
      }

      // Generate flashcards
      const selectedTopics = topics.length > 0 ? topics : processedContent.topics || [];
      const generatedFlashcards = await flashcardGenerator.generateFlashcards(
        processedContent.extractedText,
        selectedTopics,
        flashcardCount
      );

      if (generatedFlashcards.length === 0) {
        return res.status(500).json({ error: 'Failed to generate flashcards' });
      }

      // Save flashcards to database
      const flashcardsToSave = generatedFlashcards.map(card => ({
        materialId: parseInt(materialId),
        userId,
        front: card.front,
        back: card.back,
        difficulty: this.mapDifficultyToNumber(card.difficulty),
        topic: card.topic
      }));

      const savedFlashcards = await FlashCard.createBatch(flashcardsToSave);

      // Cache the flashcards
      const cacheKey = `flashcards:${materialId}:${userId}`;
      await redisService.cacheFlashcardsDue(userId, savedFlashcards);

      res.json({
        success: true,
        flashcards: savedFlashcards.map(card => ({
          id: card.id,
          front: card.front_text,
          back: card.back_text,
          difficulty: card.difficulty_level,
          topic: card.topic,
          nextReview: card.next_review,
          reviewCount: card.review_count
        })),
        totalGenerated: savedFlashcards.length,
        message: 'Flashcards generated successfully'
      });

    } catch (error) {
      console.error('Generate flashcards error:', error);
      res.status(500).json({ error: 'Failed to generate flashcards' });
    }
  }

  async getFlashcards(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const userId = req.userId;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      const result = await FlashCard.findByMaterialId(
        parseInt(materialId), 
        userId, 
        { page: parseInt(page), limit: parseInt(limit) }
      );

      const flashcardsWithStats = result.flashcards.map(card => ({
        id: card.id,
        front: card.front_text,
        back: card.back_text,
        difficulty: card.difficulty_level,
        topic: card.topic,
        nextReview: card.next_review,
        reviewCount: card.review_count,
        easeFactor: card.ease_factor,
        isDue: new Date(card.next_review) <= new Date()
      }));

      res.json({
        success: true,
        flashcards: flashcardsWithStats,
        material: {
          id: material.id,
          fileName: material.file_name,
          uploadDate: material.upload_date
        },
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        },
        stats: {
          dueToday: flashcardsWithStats.filter(card => card.isDue).length,
          totalCards: result.totalCount
        }
      });

    } catch (error) {
      console.error('Get flashcards error:', error);
      res.status(500).json({ error: 'Failed to retrieve flashcards' });
    }
  }

  async getDueFlashcards(req, res) {
    try {
      const userId = req.userId;
      const { limit = 20 } = req.query;

      // Check cache first
      let dueFlashcards = await redisService.getFlashcardsDue(userId);
      
      if (!dueFlashcards) {
        dueFlashcards = await FlashCard.getDueFlashcards(userId, parseInt(limit));
        
        // Cache for 15 minutes
        if (dueFlashcards.length > 0) {
          await redisService.cacheFlashcardsDue(userId, dueFlashcards);
        }
      }

      const flashcardsWithMaterial = dueFlashcards.map(card => ({
        id: card.id,
        front: card.front_text,
        back: card.back_text,
        difficulty: card.difficulty_level,
        topic: card.topic,
        nextReview: card.next_review,
        reviewCount: card.review_count,
        easeFactor: card.ease_factor,
        material: {
          id: card.material_id,
          fileName: card.file_name
        }
      }));

      res.json({
        success: true,
        dueFlashcards: flashcardsWithMaterial,
        count: flashcardsWithMaterial.length,
        studyMessage: flashcardsWithMaterial.length > 0 
          ? `You have ${flashcardsWithMaterial.length} flashcards due for review!`
          : 'Great job! No flashcards due for review right now.'
      });

    } catch (error) {
      console.error('Get due flashcards error:', error);
      res.status(500).json({ error: 'Failed to retrieve due flashcards' });
    }
  }

  async getAllUserFlashcards(req, res) {
    try {
      const userId = req.userId;
      const { page = 1, limit = 50, topic, difficultyLevel } = req.query;

      const result = await FlashCard.findByUserId(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        topic,
        difficultyLevel: difficultyLevel ? parseInt(difficultyLevel) : null
      });

      const flashcardsWithStats = result.flashcards.map(card => ({
        id: card.id,
        front: card.front_text,
        back: card.back_text,
        difficulty: card.difficulty_level,
        topic: card.topic,
        nextReview: card.next_review,
        reviewCount: card.review_count,
        easeFactor: card.ease_factor,
        isDue: new Date(card.next_review) <= new Date(),
        material: {
          fileName: card.file_name
        }
      }));

      res.json({
        success: true,
        flashcards: flashcardsWithStats,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });

    } catch (error) {
      console.error('Get all user flashcards error:', error);
      res.status(500).json({ error: 'Failed to retrieve flashcards' });
    }
  }

  async reviewFlashcard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { flashcardId } = req.params;
      const { quality } = req.body; // 0-5 scale: 0=total blackout, 5=perfect response
      const userId = req.userId;

      const updatedFlashcard = await FlashCard.updateReview(
        parseInt(flashcardId), 
        userId, 
        parseInt(quality)
      );

      if (!updatedFlashcard) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }

      // Clear cache to force refresh of due flashcards
      const cacheKey = `flashcards:due:${userId}`;
      if (redisService.client) {
        await redisService.client.del(cacheKey);
      }

      res.json({
        success: true,
        flashcard: {
          id: updatedFlashcard.id,
          nextReview: updatedFlashcard.next_review,
          reviewCount: updatedFlashcard.review_count,
          easeFactor: updatedFlashcard.ease_factor
        },
        message: this.getReviewMessage(quality),
        nextReviewIn: this.calculateDaysUntilReview(updatedFlashcard.next_review)
      });

    } catch (error) {
      console.error('Review flashcard error:', error);
      res.status(500).json({ error: 'Failed to update flashcard review' });
    }
  }

  async createFlashcard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId, frontText, backText, topic = 'Custom', difficultyLevel = 2 } = req.body;
      const userId = req.userId;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      const flashcard = await FlashCard.create({
        materialId: parseInt(materialId),
        userId,
        frontText: frontText.trim(),
        backText: backText.trim(),
        difficultyLevel: parseInt(difficultyLevel),
        topic: topic.trim()
      });

      res.status(201).json({
        success: true,
        flashcard: {
          id: flashcard.id,
          front: flashcard.front_text,
          back: flashcard.back_text,
          difficulty: flashcard.difficulty_level,
          topic: flashcard.topic,
          nextReview: flashcard.next_review,
          reviewCount: flashcard.review_count
        },
        message: 'Custom flashcard created successfully'
      });

    } catch (error) {
      console.error('Create flashcard error:', error);
      res.status(500).json({ error: 'Failed to create flashcard' });
    }
  }

  async updateFlashcard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { flashcardId } = req.params;
      const updateData = req.body;
      const userId = req.userId;

      const updatedFlashcard = await FlashCard.update(
        parseInt(flashcardId), 
        userId, 
        {
          frontText: updateData.frontText,
          backText: updateData.backText,
          difficultyLevel: updateData.difficultyLevel,
          topic: updateData.topic
        }
      );

      if (!updatedFlashcard) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }

      res.json({
        success: true,
        flashcard: {
          id: updatedFlashcard.id,
          front: updatedFlashcard.front_text,
          back: updatedFlashcard.back_text,
          difficulty: updatedFlashcard.difficulty_level,
          topic: updatedFlashcard.topic
        },
        message: 'Flashcard updated successfully'
      });

    } catch (error) {
      console.error('Update flashcard error:', error);
      res.status(500).json({ error: 'Failed to update flashcard' });
    }
  }

  async deleteFlashcard(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { flashcardId } = req.params;
      const userId = req.userId;

      const deletedFlashcard = await FlashCard.delete(parseInt(flashcardId), userId);
      if (!deletedFlashcard) {
        return res.status(404).json({ error: 'Flashcard not found' });
      }

      res.json({
        success: true,
        message: 'Flashcard deleted successfully'
      });

    } catch (error) {
      console.error('Delete flashcard error:', error);
      res.status(500).json({ error: 'Failed to delete flashcard' });
    }
  }

  async getFlashcardStats(req, res) {
    try {
      const userId = req.userId;

      const stats = await FlashCard.getStudyStats(userId);

      res.json({
        success: true,
        stats: {
          totalFlashcards: parseInt(stats.total_flashcards) || 0,
          dueFlashcards: parseInt(stats.due_flashcards) || 0,
          newFlashcards: parseInt(stats.new_flashcards) || 0,
          averageEaseFactor: parseFloat(stats.avg_ease_factor) || 2.5,
          totalTopics: parseInt(stats.total_topics) || 0,
          studyProgress: this.calculateStudyProgress(stats)
        }
      });

    } catch (error) {
      console.error('Get flashcard stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve flashcard statistics' });
    }
  }

  async getTopicStats(req, res) {
    try {
      const userId = req.userId;

      const topicStats = await FlashCard.getTopicStats(userId);

      const statsWithProgress = topicStats.map(topic => ({
        topic: topic.topic,
        totalCards: parseInt(topic.total_cards),
        dueCards: parseInt(topic.due_cards),
        averageEase: parseFloat(topic.avg_ease).toFixed(2),
        masteryLevel: this.calculateMasteryLevel(topic.avg_ease, topic.due_cards, topic.total_cards)
      }));

      res.json({
        success: true,
        topicStats: statsWithProgress
      });

    } catch (error) {
      console.error('Get topic stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve topic statistics' });
    }
  }

  // Helper methods
  mapDifficultyToNumber(difficulty) {
    const mapping = {
      'easy': 1,
      'medium': 2,
      'hard': 3,
      'very_hard': 4,
      'extremely_hard': 5
    };
    return mapping[difficulty] || 2;
  }

  getReviewMessage(quality) {
    const messages = {
      0: "Don't worry, keep practicing!",
      1: "You'll get it next time!",
      2: "Good effort, review this topic again.",
      3: "Good job! You're improving.",
      4: "Great work! You know this well.",
      5: "Perfect! You've mastered this concept."
    };
    return messages[quality] || "Keep studying!";
  }

  calculateDaysUntilReview(nextReviewDate) {
    const now = new Date();
    const reviewDate = new Date(nextReviewDate);
    const diffTime = reviewDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  calculateStudyProgress(stats) {
    const total = parseInt(stats.total_flashcards) || 1;
    const reviewed = total - (parseInt(stats.new_flashcards) || 0);
    return Math.round((reviewed / total) * 100);
  }

  calculateMasteryLevel(avgEase, dueCards, totalCards) {
    const easeFactor = parseFloat(avgEase) || 2.5;
    const dueRatio = parseInt(dueCards) / parseInt(totalCards);
    
    if (easeFactor >= 3.0 && dueRatio < 0.1) return 'Master';
    if (easeFactor >= 2.8 && dueRatio < 0.2) return 'Advanced';
    if (easeFactor >= 2.5 && dueRatio < 0.4) return 'Intermediate';
    if (easeFactor >= 2.0) return 'Beginner';
    return 'Learning';
  }
}

module.exports = new FlashcardController();
