const { validationResult } = require('express-validator');
const User = require('../models/User');
const StudyMaterial = require('../models/StudyMaterial');
const QuizAttempt = require('../models/QuizAttempt');
const FlashCard = require('../models/FlashCard');
const redisService = require('../config/redis');
const pool = require('../config/database');

class DashboardController {
  async getDashboardData(req, res) {
    try {
      const userId = req.userId;

      // Check cache first
      let dashboardData = await redisService.getUserProgress(userId);
      
      if (!dashboardData) {
        // Get user stats
        const userStats = await User.getStudyStats(userId);
        const materialStats = await StudyMaterial.getStudyStatsByUser(userId);
        const quizStats = await QuizAttempt.getQuizStats(userId);
        const flashcardStats = await FlashCard.getStudyStats(userId);
        const studyStreak = await QuizAttempt.getStudyStreak(userId);
        
        // Get recent activity
        const recentQuizzes = await QuizAttempt.getRecentAttempts(userId, 5);
        const dueFlashcards = await FlashCard.getDueFlashcards(userId, 10);
        
        // Calculate overall progress
        const overallProgress = this.calculateOverallProgress({
          totalMaterials: materialStats.total_materials || 0,
          completedMaterials: materialStats.completed_materials || 0,
          avgQuizScore: quizStats.avg_score || 0,
          flashcardProgress: this.calculateFlashcardProgress(flashcardStats)
        });

        dashboardData = {
          user: req.user,
          stats: {
            totalMaterials: parseInt(materialStats.total_materials) || 0,
            completedMaterials: parseInt(materialStats.completed_materials) || 0,
            processingMaterials: parseInt(materialStats.processing_materials) || 0,
            totalQuizAttempts: parseInt(userStats.total_quiz_attempts) || 0,
            avgQuizScore: Math.round(parseFloat(quizStats.avg_score) || 0),
            bestQuizScore: Math.round(parseFloat(quizStats.best_score) || 0),
            totalFlashcards: parseInt(flashcardStats.total_flashcards) || 0,
            dueFlashcards: parseInt(flashcardStats.due_flashcards) || 0,
            studyStreak: parseInt(studyStreak) || 0,
            totalStudyTime: parseInt(userStats.total_study_time) || 0,
            overallProgress: overallProgress
          },
          recentActivity: {
            recentQuizzes: recentQuizzes.map(quiz => ({
              id: quiz.id,
              materialName: quiz.file_name,
              score: quiz.score,
              totalQuestions: quiz.total_questions,
              percentage: Math.round(quiz.percentage),
              date: quiz.attempt_date
            })),
            dueFlashcards: dueFlashcards.slice(0, 5).map(card => ({
              id: card.id,
              front: card.front_text.substring(0, 50) + '...',
              topic: card.topic,
              materialName: card.file_name
            }))
          },
          goals: await this.getUserGoals(userId),
          achievements: await this.getRecentAchievements(userId)
        };

        // Cache for 10 minutes
        await redisService.cacheUserProgress(userId, dashboardData, 600);
      }

      res.json({
        success: true,
        dashboard: dashboardData
      });

    } catch (error) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({ error: 'Failed to load dashboard data' });
    }
  }

  async getStudyProgress(req, res) {
    try {
      const userId = req.userId;
      const { period = 'month' } = req.query;

      const progressData = await this.getProgressData(userId, period);

      res.json({
        success: true,
        progress: progressData
      });

    } catch (error) {
      console.error('Get study progress error:', error);
      res.status(500).json({ error: 'Failed to retrieve study progress' });
    }
  }

  async getProgressByPeriod(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { period } = req.params;
      const userId = req.userId;

      const days = this.getPeriodDays(period);
      const progressOverTime = await QuizAttempt.getProgressOverTime(userId, null, days);

      // Get study session data
      const studySessionsResult = await pool.query(`
        SELECT 
          DATE(session_date) as date,
          SUM(duration) as total_minutes,
          COUNT(*) as session_count,
          array_agg(DISTINCT session_type) as session_types
        FROM study_sessions 
        WHERE user_id = $1 AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(session_date)
        ORDER BY date DESC
      `, [userId]);

      const combinedData = this.combineProgressData(progressOverTime, studySessionsResult.rows);

      res.json({
        success: true,
        period,
        progressData: combinedData,
        summary: {
          totalDays: days,
          activeDays: combinedData.length,
          averageScore: this.calculateAverageScore(combinedData),
          totalStudyTime: this.calculateTotalStudyTime(combinedData)
        }
      });

    } catch (error) {
      console.error('Get progress by period error:', error);
      res.status(500).json({ error: 'Failed to retrieve progress data' });
    }
  }

  async getStudyStreak(req, res) {
    try {
      const userId = req.userId;

      const currentStreak = await QuizAttempt.getStudyStreak(userId);
      
      // Get longest streak
      const longestStreakResult = await pool.query(`
        WITH daily_activity AS (
          SELECT DISTINCT DATE(attempt_date) as study_date
          FROM quiz_attempts 
          WHERE user_id = $1
          UNION
          SELECT DISTINCT DATE(session_date) as study_date
          FROM study_sessions 
          WHERE user_id = $1
        ),
        streak_groups AS (
          SELECT 
            study_date,
            study_date - ROW_NUMBER() OVER (ORDER BY study_date)::int as group_id
          FROM daily_activity
        ),
        streak_lengths AS (
          SELECT 
            group_id,
            COUNT(*) as streak_length,
            MIN(study_date) as streak_start,
            MAX(study_date) as streak_end
          FROM streak_groups
          GROUP BY group_id
        )
        SELECT MAX(streak_length) as longest_streak
        FROM streak_lengths
      `, [userId]);

      const longestStreak = longestStreakResult.rows[0]?.longest_streak || 0;

      res.json({
        success: true,
        streakData: {
          currentStreak: parseInt(currentStreak),
          longestStreak: parseInt(longestStreak),
          streakMessage: this.getStreakMessage(currentStreak),
          nextMilestone: this.getNextStreakMilestone(currentStreak)
        }
      });

    } catch (error) {
      console.error('Get study streak error:', error);
      res.status(500).json({ error: 'Failed to retrieve study streak data' });
    }
  }

  async getKnowledgeHeatmap(req, res) {
    try {
      const userId = req.userId;
      const { period = 'year' } = req.query;

      const days = this.getPeriodDays(period);

      // Get activity data for heatmap
      const activityResult = await pool.query(`
        WITH activity_dates AS (
          SELECT DATE(attempt_date) as activity_date, COUNT(*) as quiz_count, 0 as study_minutes
          FROM quiz_attempts 
          WHERE user_id = $1 AND attempt_date >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY DATE(attempt_date)
          
          UNION ALL
          
          SELECT DATE(session_date) as activity_date, 0 as quiz_count, SUM(duration) as study_minutes
          FROM study_sessions 
          WHERE user_id = $1 AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
          GROUP BY DATE(session_date)
        )
        SELECT 
          activity_date,
          SUM(quiz_count) as total_quizzes,
          SUM(study_minutes) as total_study_minutes,
          (SUM(quiz_count) * 2 + SUM(study_minutes) / 10) as activity_score
        FROM activity_dates
        GROUP BY activity_date
        ORDER BY activity_date
      `, [userId]);

      const heatmapData = activityResult.rows.map(row => ({
        date: row.activity_date,
        value: parseInt(row.activity_score),
        quizzes: parseInt(row.total_quizzes),
        studyMinutes: parseInt(row.total_study_minutes)
      }));

      res.json({
        success: true,
        heatmapData,
        period,
        stats: {
          totalDays: days,
          activeDays: heatmapData.length,
          averageActivityScore: this.calculateAverageActivity(heatmapData),
          maxActivityScore: Math.max(...heatmapData.map(d => d.value), 0)
        }
      });

    } catch (error) {
      console.error('Get knowledge heatmap error:', error);
      res.status(500).json({ error: 'Failed to generate knowledge heatmap' });
    }
  }

  async getWeakAreas(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId;
      const { materialId, limit = 10 } = req.query;

      const weakAreas = await QuizAttempt.getWeakAreas(
        userId, 
        materialId ? parseInt(materialId) : null
      );

      // Get user progress for these topics
      const topicProgressResult = await pool.query(`
        SELECT subject, strength_score, total_sessions, last_studied
        FROM user_progress 
        WHERE user_id = $1 AND subject = ANY($2)
      `, [userId, weakAreas.map(wa => wa.topic)]);

      const enrichedWeakAreas = weakAreas.map(area => {
        const progress = topicProgressResult.rows.find(p => p.subject === area.topic);
        return {
          ...area,
          strengthScore: progress ? parseFloat(progress.strength_score) : 0,
          totalSessions: progress ? parseInt(progress.total_sessions) : 0,
          lastStudied: progress?.last_studied,
          improvementSuggestions: this.generateImprovementSuggestions(area.topic, area.errorCount)
        };
      });

      res.json({
        success: true,
        weakAreas: enrichedWeakAreas.slice(0, parseInt(limit)),
        totalAnalyzed: weakAreas.length
      });

    } catch (error) {
      console.error('Get weak areas error:', error);
      res.status(500).json({ error: 'Failed to analyze weak areas' });
    }
  }

  async getTopicStats(req, res) {
    try {
      const userId = req.userId;

      // Get quiz performance by topic
      const topicQuizStats = await pool.query(`
        SELECT 
          unnest(topics_covered) as topic,
          COUNT(*) as total_sessions,
          AVG(duration) as avg_duration
        FROM study_sessions 
        WHERE user_id = $1 AND array_length(topics_covered, 1) > 0
        GROUP BY topic
      `, [userId]);

      // Get flashcard stats by topic
      const topicFlashcardStats = await FlashCard.getTopicStats(userId);

      // Get user progress by topic
      const topicProgressStats = await pool.query(`
        SELECT subject as topic, strength_score, total_sessions, last_studied
        FROM user_progress 
        WHERE user_id = $1
        ORDER BY strength_score DESC
      `, [userId]);

      // Combine all stats
      const combinedStats = this.combineTopicStats(
        topicQuizStats.rows,
        topicFlashcardStats,
        topicProgressStats.rows
      );

      res.json({
        success: true,
        topicStats: combinedStats
      });

    } catch (error) {
      console.error('Get topic stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve topic statistics' });
    }
  }

  async getMaterialStats(req, res) {
    try {
      const userId = req.userId;

      const materialStats = await pool.query(`
        SELECT 
          sm.id,
          sm.file_name,
          sm.upload_date,
          sm.processing_status,
          COUNT(DISTINCT qa.id) as quiz_attempts,
          AVG(qa.score::float / qa.total_questions * 100) as avg_quiz_score,
          COUNT(DISTINCT fc.id) as total_flashcards,
          COUNT(DISTINCT ss.id) as study_sessions,
          SUM(ss.duration) as total_study_time
        FROM study_materials sm
        LEFT JOIN quiz_attempts qa ON sm.id = qa.material_id
        LEFT JOIN flashcards fc ON sm.id = fc.material_id
        LEFT JOIN study_sessions ss ON sm.id = ss.material_id
        WHERE sm.user_id = $1
        GROUP BY sm.id, sm.file_name, sm.upload_date, sm.processing_status
        ORDER BY sm.upload_date DESC
      `, [userId]);

      const enrichedStats = materialStats.rows.map(material => ({
        id: material.id,
        fileName: material.file_name,
        uploadDate: material.upload_date,
        processingStatus: material.processing_status,
        quizAttempts: parseInt(material.quiz_attempts) || 0,
        avgQuizScore: Math.round(parseFloat(material.avg_quiz_score) || 0),
        totalFlashcards: parseInt(material.total_flashcards) || 0,
        studySessions: parseInt(material.study_sessions) || 0,
        totalStudyTime: parseInt(material.total_study_time) || 0,
        engagementLevel: this.calculateEngagementLevel(material)
      }));

      res.json({
        success: true,
        materialStats: enrichedStats
      });

    } catch (error) {
      console.error('Get material stats error:', error);
      res.status(500).json({ error: 'Failed to retrieve material statistics' });
    }
  }

  async getRecentActivity(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId;
      const { days = 7, limit = 20 } = req.query;

      const activityResult = await pool.query(`
        (
          SELECT 
            'quiz' as activity_type,
            qa.id,
            sm.file_name as material_name,
            qa.score || '/' || qa.total_questions as details,
            qa.attempt_date as activity_date
          FROM quiz_attempts qa
          JOIN study_materials sm ON qa.material_id = sm.id
          WHERE qa.user_id = $1 AND qa.attempt_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        )
        UNION ALL
        (
          SELECT 
            'study_session' as activity_type,
            ss.id,
            sm.file_name as material_name,
            ss.duration || ' minutes' as details,
            ss.session_date as activity_date
          FROM study_sessions ss
          JOIN study_materials sm ON ss.material_id = sm.id
          WHERE ss.user_id = $1 AND ss.session_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
        )
        ORDER BY activity_date DESC
        LIMIT $2
      `, [userId, parseInt(limit)]);

      const formattedActivity = activityResult.rows.map(activity => ({
        type: activity.activity_type,
        id: activity.id,
        materialName: activity.material_name,
        details: activity.details,
        date: activity.activity_date,
        icon: this.getActivityIcon(activity.activity_type)
      }));

      res.json({
        success: true,
        recentActivity: formattedActivity,
        period: `${days} days`
      });

    } catch (error) {
      console.error('Get recent activity error:', error);
      res.status(500).json({ error: 'Failed to retrieve recent activity' });
    }
  }

  async getAchievements(req, res) {
    try {
      const userId = req.userId;

      const achievements = await this.calculateAchievements(userId);

      res.json({
        success: true,
        achievements
      });

    } catch (error) {
      console.error('Get achievements error:', error);
      res.status(500).json({ error: 'Failed to retrieve achievements' });
    }
  }

  async setStudyGoals(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId;
      const { dailyStudyMinutes, weeklyQuizGoal, flashcardReviewGoal } = req.body;

      await pool.query(`
        INSERT INTO user_goals (user_id, daily_study_minutes, weekly_quiz_goal, flashcard_review_goal, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          daily_study_minutes = $2,
          weekly_quiz_goal = $3,
          flashcard_review_goal = $4,
          updated_at = CURRENT_TIMESTAMP
      `, [userId, dailyStudyMinutes, weeklyQuizGoal, flashcardReviewGoal]);

      res.json({
        success: true,
        message: 'Study goals updated successfully',
        goals: {
          dailyStudyMinutes,
          weeklyQuizGoal,
          flashcardReviewGoal
        }
      });

    } catch (error) {
      console.error('Set study goals error:', error);
      res.status(500).json({ error: 'Failed to set study goals' });
    }
  }

  async exportUserData(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = req.userId;
      const { format = 'json', includeContent = false } = req.query;

      // Gather comprehensive user data
      const userData = await this.gatherUserDataForExport(userId, includeContent === 'true');

      if (format === 'csv') {
        const csvData = this.convertToCSV(userData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="studygenie-export-${userId}-${Date.now()}.csv"`);
        res.send(csvData);
      } else {
        res.json({
          success: true,
          exportData: userData,
          exportDate: new Date().toISOString(),
          format
        });
      }

    } catch (error) {
      console.error('Export user data error:', error);
      res.status(500).json({ error: 'Failed to export user data' });
    }
  }

  // All Helper Methods Implementation

  calculateOverallProgress(stats) {
    const materialProgress = stats.completedMaterials / Math.max(stats.totalMaterials, 1) * 100;
    const quizProgress = Math.min(stats.avgQuizScore, 100);
    const flashcardProgress = stats.flashcardProgress;
    
    return Math.round((materialProgress + quizProgress + flashcardProgress) / 3);
  }

  calculateFlashcardProgress(flashcardStats) {
    const total = parseInt(flashcardStats.total_flashcards) || 1;
    const reviewed = total - (parseInt(flashcardStats.new_flashcards) || 0);
    return Math.round((reviewed / total) * 100);
  }

  getPeriodDays(period) {
    const periodMap = {
      'week': 7,
      'month': 30,
      'quarter': 90,
      'year': 365
    };
    return periodMap[period] || 30;
  }

  getStreakMessage(streak) {
    if (streak === 0) return "Start your study streak today!";
    if (streak === 1) return "Great start! Keep it up!";
    if (streak < 7) return `${streak} days strong! You're building momentum!`;
    if (streak < 30) return `${streak} days streak! You're forming a habit!`;
    return `${streak} days streak! You're a study champion!`;
  }

  getNextStreakMilestone(streak) {
    const milestones = [7, 14, 30, 60, 100, 365];
    return milestones.find(m => m > streak) || streak + 100;
  }

  generateImprovementSuggestions(topic, errorCount) {
    const suggestions = [
      `Create additional flashcards for ${topic}`,
      `Practice more questions related to ${topic}`,
      `Review the fundamentals of ${topic}`,
      `Ask the AI tutor specific questions about ${topic}`,
      `Break down ${topic} into smaller sub-topics`,
      `Find additional study materials for ${topic}`
    ];
    return suggestions.slice(0, 3);
  }

  getActivityIcon(activityType) {
    const icons = {
      'quiz': '📝',
      'study_session': '📚',
      'flashcard': '🔄',
      'upload': '📄',
      'tutor': '🤖',
      'review': '👁️'
    };
    return icons[activityType] || '📖';
  }

  async getUserGoals(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM user_goals WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return {
          dailyStudyMinutes: 30,
          weeklyQuizGoal: 5,
          flashcardReviewGoal: 20
        };
      }

      const goals = result.rows[0];
      return {
        dailyStudyMinutes: goals.daily_study_minutes,
        weeklyQuizGoal: goals.weekly_quiz_goal,
        flashcardReviewGoal: goals.flashcard_review_goal
      };
    } catch (error) {
      console.error('Get user goals error:', error);
      return {
        dailyStudyMinutes: 30,
        weeklyQuizGoal: 5,
        flashcardReviewGoal: 20
      };
    }
  }

  async getRecentAchievements(userId) {
    try {
      const achievements = [];
      
      // Get user stats for achievement calculation
      const userStats = await User.getStudyStats(userId);
      const quizStats = await QuizAttempt.getQuizStats(userId);
      const flashcardStats = await FlashCard.getStudyStats(userId);
      const studyStreak = await QuizAttempt.getStudyStreak(userId);

      // Study streak achievements
      if (studyStreak >= 7) achievements.push({
        type: 'streak',
        title: 'Week Warrior',
        description: '7-day study streak achieved!',
        icon: '🔥',
        date: new Date().toISOString()
      });

      if (studyStreak >= 30) achievements.push({
        type: 'streak',
        title: 'Month Master',
        description: '30-day study streak achieved!',
        icon: '🏆',
        date: new Date().toISOString()
      });

      // Quiz achievements
      if (parseInt(userStats.total_quiz_attempts) >= 10) achievements.push({
        type: 'quiz',
        title: 'Quiz Explorer',
        description: 'Completed 10 quizzes!',
        icon: '📝',
        date: new Date().toISOString()
      });

      if (parseFloat(quizStats.avg_score) >= 90) achievements.push({
        type: 'performance',
        title: 'Excellence Seeker',
        description: '90%+ average quiz score!',
        icon: '⭐',
        date: new Date().toISOString()
      });

      // Flashcard achievements
      if (parseInt(flashcardStats.total_flashcards) >= 50) achievements.push({
        type: 'flashcard',
        title: 'Memory Builder',
        description: 'Created 50+ flashcards!',
        icon: '🧠',
        date: new Date().toISOString()
      });

      return achievements.slice(0, 5); // Return recent 5 achievements
    } catch (error) {
      console.error('Get recent achievements error:', error);
      return [];
    }
  }

  async getProgressData(userId, period) {
    try {
      const days = this.getPeriodDays(period);
      
      // Get quiz progress over time
      const quizProgress = await QuizAttempt.getProgressOverTime(userId, null, days);
      
      // Get study session data
      const sessionResult = await pool.query(`
        SELECT 
          DATE(session_date) as date,
          SUM(duration) as total_minutes,
          COUNT(*) as session_count
        FROM study_sessions 
        WHERE user_id = $1 AND session_date >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(session_date)
        ORDER BY date
      `, [userId]);

      // Combine data
      const progressData = {
        quizProgress,
        studySession: sessionResult.rows,
        period,
        totalDays: days
      };

      return progressData;
    } catch (error) {
      console.error('Get progress data error:', error);
      throw error;
    }
  }

  combineProgressData(quizData, sessionData) {
    const dataMap = new Map();

    // Add quiz data
    quizData.forEach(item => {
      const dateStr = item.date;
      if (!dataMap.has(dateStr)) {
        dataMap.set(dateStr, {
          date: dateStr,
          quizScore: 0,
          quizCount: 0,
          studyMinutes: 0,
          sessionCount: 0
        });
      }
      const entry = dataMap.get(dateStr);
      entry.quizScore = parseFloat(item.avg_score) || 0;
      entry.quizCount = parseInt(item.attempts_count) || 0;
    });

    // Add session data
    sessionData.forEach(item => {
      const dateStr = item.date;
      if (!dataMap.has(dateStr)) {
        dataMap.set(dateStr, {
          date: dateStr,
          quizScore: 0,
          quizCount: 0,
          studyMinutes: 0,
          sessionCount: 0
        });
      }
      const entry = dataMap.get(dateStr);
      entry.studyMinutes = parseInt(item.total_minutes) || 0;
      entry.sessionCount = parseInt(item.session_count) || 0;
    });

    return Array.from(dataMap.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  calculateAverageScore(combinedData) {
    const validScores = combinedData.filter(d => d.quizScore > 0);
    if (validScores.length === 0) return 0;
    
    const sum = validScores.reduce((total, d) => total + d.quizScore, 0);
    return Math.round(sum / validScores.length);
  }

  calculateTotalStudyTime(combinedData) {
    return combinedData.reduce((total, d) => total + d.studyMinutes, 0);
  }

  calculateAverageActivity(heatmapData) {
    if (heatmapData.length === 0) return 0;
    const sum = heatmapData.reduce((total, d) => total + d.value, 0);
    return Math.round(sum / heatmapData.length);
  }

  combineTopicStats(quizStats, flashcardStats, progressStats) {
    const statsMap = new Map();

    // Process quiz stats
    quizStats.forEach(stat => {
      if (!statsMap.has(stat.topic)) {
        statsMap.set(stat.topic, {
          topic: stat.topic,
          quizSessions: 0,
          avgDuration: 0,
          flashcardCount: 0,
          strengthScore: 0,
          lastStudied: null
        });
      }
      const entry = statsMap.get(stat.topic);
      entry.quizSessions = parseInt(stat.total_sessions) || 0;
      entry.avgDuration = parseFloat(stat.avg_duration) || 0;
    });

    // Process flashcard stats
    flashcardStats.forEach(stat => {
      if (!statsMap.has(stat.topic)) {
        statsMap.set(stat.topic, {
          topic: stat.topic,
          quizSessions: 0,
          avgDuration: 0,
          flashcardCount: 0,
          strengthScore: 0,
          lastStudied: null
        });
      }
      const entry = statsMap.get(stat.topic);
      entry.flashcardCount = parseInt(stat.total_cards) || 0;
    });

    // Process progress stats
    progressStats.forEach(stat => {
      if (!statsMap.has(stat.topic)) {
        statsMap.set(stat.topic, {
          topic: stat.topic,
          quizSessions: 0,
          avgDuration: 0,
          flashcardCount: 0,
          strengthScore: 0,
          lastStudied: null
        });
      }
      const entry = statsMap.get(stat.topic);
      entry.strengthScore = parseFloat(stat.strength_score) || 0;
      entry.lastStudied = stat.last_studied;
    });

    return Array.from(statsMap.values()).sort((a, b) => b.strengthScore - a.strengthScore);
  }

  calculateEngagementLevel(material) {
    const quizAttempts = parseInt(material.quiz_attempts) || 0;
    const flashcards = parseInt(material.total_flashcards) || 0;
    const studySessions = parseInt(material.study_sessions) || 0;
    const studyTime = parseInt(material.total_study_time) || 0;

    const engagementScore = (quizAttempts * 10) + (flashcards * 2) + (studySessions * 5) + (studyTime * 0.5);

    if (engagementScore >= 100) return 'High';
    if (engagementScore >= 50) return 'Medium';
    if (engagementScore >= 10) return 'Low';
    return 'Minimal';
  }

  async calculateAchievements(userId) {
    try {
      const achievements = [];
      
      // Get comprehensive stats
      const userStats = await User.getStudyStats(userId);
      const materialStats = await StudyMaterial.getStudyStatsByUser(userId);
      const quizStats = await QuizAttempt.getQuizStats(userId);
      const flashcardStats = await FlashCard.getStudyStats(userId);
      const studyStreak = await QuizAttempt.getStudyStreak(userId);

      const stats = {
        totalMaterials: parseInt(materialStats.total_materials) || 0,
        completedMaterials: parseInt(materialStats.completed_materials) || 0,
        totalQuizAttempts: parseInt(userStats.total_quiz_attempts) || 0,
        avgQuizScore: parseFloat(quizStats.avg_score) || 0,
        bestQuizScore: parseFloat(quizStats.best_score) || 0,
        totalFlashcards: parseInt(flashcardStats.total_flashcards) || 0,
        totalStudyTime: parseInt(userStats.total_study_time) || 0,
        studyStreak: parseInt(studyStreak) || 0
      };

      // Material upload achievements
      if (stats.totalMaterials >= 1) achievements.push({
        id: 'first_upload',
        title: 'Getting Started',
        description: 'Uploaded your first study material',
        icon: '📤',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalMaterials >= 5) achievements.push({
        id: 'material_collector',
        title: 'Material Collector',
        description: 'Uploaded 5 study materials',
        icon: '📚',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalMaterials >= 10) achievements.push({
        id: 'content_master',
        title: 'Content Master',
        description: 'Uploaded 10 study materials',
        icon: '🎓',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      // Quiz achievements
      if (stats.totalQuizAttempts >= 1) achievements.push({
        id: 'quiz_newbie',
        title: 'Quiz Newbie',
        description: 'Completed your first quiz',
        icon: '✏️',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalQuizAttempts >= 10) achievements.push({
        id: 'quiz_enthusiast',
        title: 'Quiz Enthusiast',
        description: 'Completed 10 quizzes',
        icon: '📝',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalQuizAttempts >= 50) achievements.push({
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Completed 50 quizzes',
        icon: '🏆',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      // Performance achievements
      if (stats.avgQuizScore >= 70) achievements.push({
        id: 'good_performer',
        title: 'Good Performer',
        description: 'Maintain 70%+ average quiz score',
        icon: '👍',
        category: 'performance',
        unlocked: true,
        progress: 100
      });

      if (stats.avgQuizScore >= 85) achievements.push({
        id: 'excellent_performer',
        title: 'Excellent Performer',
        description: 'Maintain 85%+ average quiz score',
        icon: '⭐',
        category: 'performance',
        unlocked: true,
        progress: 100
      });

      if (stats.bestQuizScore >= 95) achievements.push({
        id: 'perfectionist',
        title: 'Perfectionist',
        description: 'Scored 95%+ on a quiz',
        icon: '💯',
        category: 'performance',
        unlocked: true,
        progress: 100
      });

      // Streak achievements
      if (stats.studyStreak >= 3) achievements.push({
        id: 'consistent_learner',
        title: 'Consistent Learner',
        description: '3-day study streak',
        icon: '📅',
        category: 'consistency',
        unlocked: true,
        progress: 100
      });

      if (stats.studyStreak >= 7) achievements.push({
        id: 'week_warrior',
        title: 'Week Warrior',
        description: '7-day study streak',
        icon: '🔥',
        category: 'consistency',
        unlocked: true,
        progress: 100
      });

      if (stats.studyStreak >= 30) achievements.push({
        id: 'month_champion',
        title: 'Month Champion',
        description: '30-day study streak',
        icon: '🏅',
        category: 'consistency',
        unlocked: true,
        progress: 100
      });

      // Flashcard achievements
      if (stats.totalFlashcards >= 10) achievements.push({
        id: 'flashcard_starter',
        title: 'Flashcard Starter',
        description: 'Created 10 flashcards',
        icon: '🎴',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalFlashcards >= 50) achievements.push({
        id: 'memory_builder',
        title: 'Memory Builder',
        description: 'Created 50 flashcards',
        icon: '🧠',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalFlashcards >= 100) achievements.push({
        id: 'flashcard_expert',
        title: 'Flashcard Expert',
        description: 'Created 100 flashcards',
        icon: '🎯',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      // Study time achievements
      if (stats.totalStudyTime >= 60) achievements.push({
        id: 'time_investor',
        title: 'Time Investor',
        description: 'Studied for 1+ hours total',
        icon: '⏰',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalStudyTime >= 300) achievements.push({
        id: 'dedicated_learner',
        title: 'Dedicated Learner',
        description: 'Studied for 5+ hours total',
        icon: '📖',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      if (stats.totalStudyTime >= 600) achievements.push({
        id: 'study_marathon',
        title: 'Study Marathon',
        description: 'Studied for 10+ hours total',
        icon: '🏃',
        category: 'milestone',
        unlocked: true,
        progress: 100
      });

      return {
        unlocked: achievements,
        totalEarned: achievements.length,
        categories: {
          milestone: achievements.filter(a => a.category === 'milestone').length,
          performance: achievements.filter(a => a.category === 'performance').length,
          consistency: achievements.filter(a => a.category === 'consistency').length
        }
      };

    } catch (error) {
      console.error('Calculate achievements error:', error);
      return {
        unlocked: [],
        totalEarned: 0,
        categories: {
          milestone: 0,
          performance: 0,
          consistency: 0
        }
      };
    }
  }

  async gatherUserDataForExport(userId, includeContent) {
    try {
      // Get user profile
      const user = await User.findById(userId);
      
      // Get study materials
      const materials = await StudyMaterial.findByUserId(userId, { limit: 1000 });
      
      // Get quiz attempts
      const quizAttempts = await QuizAttempt.findByUserId(userId, { limit: 1000 });
      
      // Get flashcards
      const flashcards = await FlashCard.findByUserId(userId, { limit: 1000 });
      
      // Get user progress
      const progressResult = await pool.query(
        'SELECT * FROM user_progress WHERE user_id = $1',
        [userId]
      );

      // Get study sessions
      const sessionsResult = await pool.query(
        'SELECT * FROM study_sessions WHERE user_id = $1 ORDER BY session_date DESC',
        [userId]
      );

      const exportData = {
        profile: {
          id: user.id,
          email: user.email,
          name: user.name,
          academicLevel: user.academic_level,
          preferredLanguage: user.preferred_language,
          memberSince: user.created_at
        },
        statistics: {
          totalMaterials: materials.totalCount,
          totalQuizAttempts: quizAttempts.totalCount,
          totalFlashcards: flashcards.totalCount,
          totalStudySessions: sessionsResult.rows.length
        },
        materials: materials.materials.map(m => ({
          id: m.id,
          fileName: m.file_name,
          fileType: m.file_type,
          uploadDate: m.upload_date,
          processingStatus: m.processing_status,
          ...(includeContent && { hasContent: !!m.processed_content })
        })),
        quizHistory: quizAttempts.attempts.map(q => ({
          id: q.id,
          materialName: q.file_name,
          score: q.score,
          totalQuestions: q.total_questions,
          percentage: Math.round((q.score / q.total_questions) * 100),
          timeTaken: q.time_taken,
          attemptDate: q.attempt_date
        })),
        flashcards: flashcards.flashcards.map(f => ({
          id: f.id,
          front: f.front_text,
          back: f.back_text,
          topic: f.topic,
          difficulty: f.difficulty_level,
          reviewCount: f.review_count,
          createdAt: f.created_at
        })),
        progress: progressResult.rows.map(p => ({
          subject: p.subject,
          strengthScore: p.strength_score,
          totalSessions: p.total_sessions,
          lastStudied: p.last_studied
        })),
        studySessions: sessionsResult.rows.map(s => ({
          materialId: s.material_id,
          sessionType: s.session_type,
          duration: s.duration,
          topicsCovered: s.topics_covered,
          sessionDate: s.session_date
        }))
      };

      return exportData;
    } catch (error) {
      console.error('Gather user data error:', error);
      throw error;
    }
  }

  convertToCSV(userData) {
    const csvRows = [];
    
    // Add headers
    csvRows.push('Type,ID,Name/Description,Score/Value,Date,Additional Info');
    
    // Add quiz attempts
    userData.quizHistory.forEach(quiz => {
      csvRows.push(`Quiz,${quiz.id},"${quiz.materialName}",${quiz.percentage}%,${quiz.attemptDate},"${quiz.score}/${quiz.totalQuestions} in ${quiz.timeTaken}s"`);
    });
    
    // Add flashcards
    userData.flashcards.forEach(card => {
      csvRows.push(`Flashcard,${card.id},"${card.front.replace(/"/g, '""')}",${card.reviewCount} reviews,${card.createdAt},"Topic: ${card.topic}"`);
    });
    
    // Add study sessions
    userData.studySessions.forEach(session => {
      csvRows.push(`Study Session,${session.materialId},"${session.sessionType}",${session.duration} minutes,${session.sessionDate},"Topics: ${session.topicsCovered?.join(', ') || 'N/A'}"`);
    });
    
    return csvRows.join('\n');
  }
}

module.exports = new DashboardController();
