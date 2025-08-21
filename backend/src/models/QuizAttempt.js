const pool = require('../config/database');

class QuizAttempt {
  static async create(attemptData) {
    try {
      const { 
        userId, 
        materialId, 
        score, 
        totalQuestions, 
        wrongAnswers = [], 
        timeTaken = 0 
      } = attemptData;
      
      const result = await pool.query(
        `INSERT INTO quiz_attempts (user_id, material_id, score, total_questions, wrong_answers, time_taken) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [userId, materialId, score, totalQuestions, JSON.stringify(wrongAnswers), timeTaken]
      );

      return result.rows[0];
    } catch (error) {
      console.error('QuizAttempt create error:', error);
      throw error;
    }
  }

  static async findById(id, userId) {
    try {
      const result = await pool.query(
        `SELECT qa.*, sm.file_name 
         FROM quiz_attempts qa
         JOIN study_materials sm ON qa.material_id = sm.id
         WHERE qa.id = $1 AND qa.user_id = $2`,
        [id, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('QuizAttempt findById error:', error);
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 20, materialId = null } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT qa.*, sm.file_name 
        FROM quiz_attempts qa
        JOIN study_materials sm ON qa.material_id = sm.id
        WHERE qa.user_id = $1
      `;
      let params = [userId];
      let paramCount = 1;

      if (materialId) {
        paramCount++;
        query += ` AND qa.material_id = $${paramCount}`;
        params.push(materialId);
      }

      query += ` ORDER BY qa.attempt_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM quiz_attempts WHERE user_id = $1';
      let countParams = [userId];
      
      if (materialId) {
        countQuery += ' AND material_id = $2';
        countParams.push(materialId);
      }
      
      const countResult = await pool.query(countQuery, countParams);

      return {
        attempts: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows.count / limit)
      };
    } catch (error) {
      console.error('QuizAttempt findByUserId error:', error);
      throw error;
    }
  }

  static async findByMaterialId(materialId, userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;
      
      const result = await pool.query(
        `SELECT * FROM quiz_attempts 
         WHERE material_id = $1 AND user_id = $2 
         ORDER BY attempt_date DESC 
         LIMIT $3 OFFSET $4`,
        [materialId, userId, limit, offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM quiz_attempts WHERE material_id = $1 AND user_id = $2',
        [materialId, userId]
      );

      return {
        attempts: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows.count / limit)
      };
    } catch (error) {
      console.error('QuizAttempt findByMaterialId error:', error);
      throw error;
    }
  }

  static async getQuizStats(userId, materialId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_attempts,
          AVG(score::float / total_questions * 100) as avg_score,
          MAX(score::float / total_questions * 100) as best_score,
          MIN(score::float / total_questions * 100) as worst_score,
          SUM(time_taken) as total_time,
          AVG(time_taken) as avg_time,
          MAX(attempt_date) as last_attempt
        FROM quiz_attempts 
        WHERE user_id = $1
      `;
      let params = [userId];

      if (materialId) {
        query += ' AND material_id = $2';
        params.push(materialId);
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('QuizAttempt getQuizStats error:', error);
      throw error;
    }
  }

  static async getProgressOverTime(userId, materialId = null, days = 30) {
    try {
      let query = `
        SELECT 
          DATE(attempt_date) as date,
          COUNT(*) as attempts_count,
          AVG(score::float / total_questions * 100) as avg_score
        FROM quiz_attempts 
        WHERE user_id = $1 AND attempt_date >= CURRENT_DATE - INTERVAL '${days} days'
      `;
      let params = [userId];

      if (materialId) {
        query += ' AND material_id = $2';
        params.push(materialId);
      }

      query += ' GROUP BY DATE(attempt_date) ORDER BY date DESC';

      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('QuizAttempt getProgressOverTime error:', error);
      throw error;
    }
  }

  static async getWeakAreas(userId, materialId = null) {
    try {
      let query = `
        SELECT 
          jsonb_array_elements(wrong_answers) as wrong_answer
        FROM quiz_attempts 
        WHERE user_id = $1
      `;
      let params = [userId];

      if (materialId) {
        query += ' AND material_id = $2';
        params.push(materialId);
      }

      const result = await pool.query(query, params);
      
      // Analyze wrong answers to find patterns
      const wrongAnswers = result.rows.map(row => row.wrong_answer);
      const topicCounts = {};
      
      wrongAnswers.forEach(answer => {
        const topic = answer.topic || 'General';
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });

      return Object.entries(topicCounts)
        .sort((a, b) => b[1] - a)
        .slice(0, 10)
        .map(([topic, count]) => ({ topic, errorCount: count }));
    } catch (error) {
      console.error('QuizAttempt getWeakAreas error:', error);
      throw error;
    }
  }

  static async getStudyStreak(userId) {
    try {
      const result = await pool.query(`
        WITH daily_activity AS (
          SELECT DISTINCT DATE(attempt_date) as study_date
          FROM quiz_attempts 
          WHERE user_id = $1
          ORDER BY study_date DESC
        ),
        streak_calculation AS (
          SELECT 
            study_date,
            ROW_NUMBER() OVER (ORDER BY study_date DESC) as row_num,
            study_date + INTERVAL '1 day' * ROW_NUMBER() OVER (ORDER BY study_date DESC) as expected_date
          FROM daily_activity
        )
        SELECT COUNT(*) as current_streak
        FROM streak_calculation
        WHERE expected_date <= CURRENT_DATE + INTERVAL '1 day'
      `, [userId]);

      return result.rows[0].current_streak || 0;
    } catch (error) {
      console.error('QuizAttempt getStudyStreak error:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM quiz_attempts WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('QuizAttempt delete error:', error);
      throw error;
    }
  }

  static async getRecentAttempts(userId, limit = 5) {
    try {
      const result = await pool.query(`
        SELECT 
          qa.*,
          sm.file_name,
          (qa.score::float / qa.total_questions * 100) as percentage
        FROM quiz_attempts qa
        JOIN study_materials sm ON qa.material_id = sm.id
        WHERE qa.user_id = $1
        ORDER BY qa.attempt_date DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('QuizAttempt getRecentAttempts error:', error);
      throw error;
    }
  }
}

module.exports = QuizAttempt;
