const { validationResult } = require('express-validator');
const pool = require('../config/database');
const StudyMaterial = require('../models/StudyMaterial');
const QuizAttempt = require('../models/QuizAttempt');
const questionGenerator = require('../services/questionGenerator');
const redisService = require('../config/redis');

class QuizController {
  async generateQuiz(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const { questionCount = 10, difficultyLevel = 'medium', topics = [] } = req.body;
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

      // Check cache first
      const cacheKey = `quiz:${materialId}:${questionCount}:${difficultyLevel}`;
      let questions = await redisService.client?.get(cacheKey);
      
      if (questions) {
        questions = JSON.parse(questions);
        console.log('Quiz retrieved from cache');
      } else {
        // Get processed content
        const processedContent = await StudyMaterial.getProcessedContent(materialId, userId);
        if (!processedContent || !processedContent.extractedText) {
          return res.status(400).json({ error: 'No content available for quiz generation' });
        }

        // Generate questions
        const selectedTopics = topics.length > 0 ? topics : processedContent.topics || [];
        questions = await questionGenerator.generateQuestions(
          processedContent.extractedText,
          selectedTopics,
          questionCount
        );

        if (questions.length === 0) {
          return res.status(500).json({ error: 'Failed to generate quiz questions' });
        }

        // Cache the questions for 1 hour
        if (redisService.client) {
          await redisService.client.setEx(cacheKey, 3600, JSON.stringify(questions));
        }
      }

      // Store quiz session in database
      await pool.query(
        'INSERT INTO study_sessions (user_id, material_id, session_type, duration, topics_covered) VALUES ($1, $2, $3, $4, $5)',
        [userId, materialId, 'quiz', 0, selectedTopics]
      );

      res.json({
        success: true,
        quiz: {
          materialId: parseInt(materialId),
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options,
            difficulty: q.difficulty,
            topic: q.topic
          })),
          totalQuestions: questions.length,
          estimatedTime: questions.length * 1.5, // 1.5 minutes per question
          difficultyLevel,
          topics: selectedTopics
        }
      });

    } catch (error) {
      console.error('Generate quiz error:', error);
      res.status(500).json({ error: 'Failed to generate quiz' });
    }
  }

  async getQuiz(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const userId = req.userId;

      // Check if material exists and belongs to user
      const material = await StudyMaterial.findById(materialId, userId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      // Get cached quiz
      const cacheKey = `quiz:${materialId}:10:medium`; // Default values
      const cachedQuiz = await redisService.client?.get(cacheKey);
      
      if (!cachedQuiz) {
        return res.status(404).json({ 
          error: 'No quiz available. Please generate a quiz first.' 
        });
      }

      const questions = JSON.parse(cachedQuiz);

      res.json({
        success: true,
        quiz: {
          materialId: parseInt(materialId),
          questions: questions.map(q => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options,
            difficulty: q.difficulty,
            topic: q.topic
          })),
          totalQuestions: questions.length,
          material: {
            fileName: material.file_name,
            uploadDate: material.upload_date
          }
        }
      });

    } catch (error) {
      console.error('Get quiz error:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz' });
    }
  }

  async submitQuiz(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const { answers, timeTaken = 0 } = req.body;
      const userId = req.userId;

      // Get the original quiz questions from cache
      const cacheKey = `quiz:${materialId}:10:medium`;
      const cachedQuiz = await redisService.client?.get(cacheKey);
      
      if (!cachedQuiz) {
        return res.status(400).json({ error: 'Quiz session expired. Please generate a new quiz.' });
      }

      const questions = JSON.parse(cachedQuiz);
      
      // Calculate score and identify wrong answers
      let correctAnswers = 0;
      const wrongAnswers = [];
      const detailedResults = [];

      answers.forEach(answer => {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) {
          return;
        }

        const isCorrect = question.correctAnswer === answer.selectedAnswer;
        if (isCorrect) {
          correctAnswers++;
        } else {
          wrongAnswers.push({
            questionId: answer.questionId,
            question: question.question,
            correctAnswer: question.correctAnswer,
            selectedAnswer: answer.selectedAnswer,
            topic: question.topic,
            explanation: question.explanation || ''
          });
        }

        detailedResults.push({
          questionId: question.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          selectedAnswer: answer.selectedAnswer,
          isCorrect,
          topic: question.topic,
          explanation: question.explanation || ''
        });
      });

      const score = correctAnswers;
      const totalQuestions = questions.length;
      const percentage = Math.round((score / totalQuestions) * 100);

      // Save quiz attempt to database
      const quizAttempt = await QuizAttempt.create({
        userId,
        materialId: parseInt(materialId),
        score,
        totalQuestions,
        wrongAnswers,
        timeTaken: parseInt(timeTaken)
      });

      // Update user progress
      await this.updateUserProgress(userId, materialId, percentage, wrongAnswers);

      // Update study session
      await pool.query(
        `UPDATE study_sessions 
         SET duration = $1 
         WHERE user_id = $2 AND material_id = $3 AND session_type = 'quiz' 
         ORDER BY session_date DESC LIMIT 1`,
        [Math.ceil(timeTaken / 60), userId, materialId]
      );

      res.json({
        success: true,
        results: {
          attemptId: quizAttempt.id,
          score,
          totalQuestions,
          percentage,
          timeTaken,
          wrongAnswers: wrongAnswers.length,
          detailedResults,
          performance: this.getPerformanceLevel(percentage),
          suggestions: this.generateSuggestions(percentage, wrongAnswers)
        }
      });

    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({ error: 'Failed to submit quiz' });
    }
  }

  async getQuizResults(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { attemptId } = req.params;
      const userId = req.userId;

      const attempt = await QuizAttempt.findById(attemptId, userId);
      if (!attempt) {
        return res.status(404).json({ error: 'Quiz attempt not found' });
      }

      const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

      res.json({
        success: true,
        results: {
          attemptId: attempt.id,
          materialName: attempt.file_name,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          percentage,
          timeTaken: attempt.time_taken,
          attemptDate: attempt.attempt_date,
          wrongAnswers: attempt.wrong_answers,
          performance: this.getPerformanceLevel(percentage)
        }
      });

    } catch (error) {
      console.error('Get quiz results error:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz results' });
    }
  }

  async getQuizHistory(req, res) {
    try {
      const userId = req.userId;
      const { page = 1, limit = 20 } = req.query;

      const result = await QuizAttempt.findByUserId(userId, { 
        page: parseInt(page), 
        limit: parseInt(limit) 
      });

      const historyWithStats = result.attempts.map(attempt => ({
        ...attempt,
        percentage: Math.round((attempt.score / attempt.total_questions) * 100),
        performance: this.getPerformanceLevel(Math.round((attempt.score / attempt.total_questions) * 100))
      }));

      res.json({
        success: true,
        history: historyWithStats,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });

    } catch (error) {
      console.error('Get quiz history error:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz history' });
    }
  }

  async getMaterialQuizHistory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { materialId } = req.params;
      const userId = req.userId;
      const { page = 1, limit = 10 } = req.query;

      const result = await QuizAttempt.findByMaterialId(
        parseInt(materialId), 
        userId, 
        { page: parseInt(page), limit: parseInt(limit) }
      );

      const historyWithStats = result.attempts.map(attempt => ({
        ...attempt,
        percentage: Math.round((attempt.score / attempt.total_questions) * 100),
        performance: this.getPerformanceLevel(Math.round((attempt.score / attempt.total_questions) * 100))
      }));

      // Get progress statistics
      const stats = await QuizAttempt.getQuizStats(userId, parseInt(materialId));

      res.json({
        success: true,
        history: historyWithStats,
        statistics: {
          totalAttempts: stats.total_attempts || 0,
          averageScore: Math.round(stats.avg_score || 0),
          bestScore: Math.round(stats.best_score || 0),
          averageTime: Math.round(stats.avg_time || 0),
          lastAttempt: stats.last_attempt
        },
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount
        }
      });

    } catch (error) {
      console.error('Get material quiz history error:', error);
      res.status(500).json({ error: 'Failed to retrieve quiz history' });
    }
  }

  async deleteQuizAttempt(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { attemptId } = req.params;
      const userId = req.userId;

      const deletedAttempt = await QuizAttempt.delete(attemptId, userId);
      if (!deletedAttempt) {
        return res.status(404).json({ error: 'Quiz attempt not found' });
      }

      res.json({
        success: true,
        message: 'Quiz attempt deleted successfully'
      });

    } catch (error) {
      console.error('Delete quiz attempt error:', error);
      res.status(500).json({ error: 'Failed to delete quiz attempt' });
    }
  }

  // Helper methods
  async updateUserProgress(userId, materialId, percentage, wrongAnswers) {
    try {
      // Determine subject based on wrong answers or material
      const topics = wrongAnswers.map(wa => wa.topic).filter(Boolean);
      const primaryTopic = topics[0] || 'General';

      // Calculate strength score (inverse of error rate)
      const strengthScore = Math.max(0, 100 - (wrongAnswers.length / topics.length) * 100);

      await pool.query(
        `INSERT INTO user_progress (user_id, subject, strength_score, total_sessions, last_studied)
         VALUES ($1, $2, $3, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, subject) 
         DO UPDATE SET 
           strength_score = (user_progress.strength_score + $3) / 2,
           total_sessions = user_progress.total_sessions + 1,
           last_studied = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP`,
        [userId, primaryTopic, strengthScore]
      );
    } catch (error) {
      console.error('Update user progress error:', error);
    }
  }

  getPerformanceLevel(percentage) {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Fair';
    if (percentage >= 60) return 'Needs Improvement';
    return 'Poor';
  }

  generateSuggestions(percentage, wrongAnswers) {
    const suggestions = [];

    if (percentage < 60) {
      suggestions.push('Consider reviewing the material more thoroughly before retaking the quiz.');
      suggestions.push('Focus on understanding the concepts rather than memorizing.');
    }

    if (wrongAnswers.length > 0) {
      const topics = [...new Set(wrongAnswers.map(wa => wa.topic).filter(Boolean))];
      if (topics.length > 0) {
        suggestions.push(`Review these topics: ${topics.join(', ')}`);
      }
    }

    if (percentage >= 80) {
      suggestions.push('Great job! Try creating flashcards for the topics you missed.');
    }

    return suggestions;
  }
}

module.exports = new QuizController();
