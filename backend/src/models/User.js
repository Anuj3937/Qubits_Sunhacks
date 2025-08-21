const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT id, email, name, birth_date, academic_level, preferred_language, created_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('User findById error:', error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, name, academic_level, preferred_language FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('User findByEmail error:', error);
      throw error;
    }
  }

  static async create(userData) {
    try {
      const { email, password, name, birthDate, academicLevel, preferredLanguage } = userData;
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, birth_date, academic_level, preferred_language) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, email, name, academic_level, preferred_language`,
        [email, passwordHash, name, birthDate, academicLevel || 'intermediate', preferredLanguage || 'English']
      );

      return result.rows[0];
    } catch (error) {
      console.error('User create error:', error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { name, academicLevel, preferredLanguage } = updateData;
      
      const result = await pool.query(
        `UPDATE users SET 
         name = $1, 
         academic_level = $2, 
         preferred_language = $3, 
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4 
         RETURNING id, email, name, academic_level, preferred_language`,
        [name, academicLevel, preferredLanguage, id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('User update error:', error);
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('Password validation error:', error);
      return false;
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, id]
      );

      return true;
    } catch (error) {
      console.error('Password update error:', error);
      throw error;
    }
  }

  static async getStudyStats(userId) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(DISTINCT sm.id) as total_materials,
          COUNT(DISTINCT qa.id) as total_quiz_attempts,
          COUNT(DISTINCT fc.id) as total_flashcards,
          COALESCE(AVG(qa.score::float / qa.total_questions * 100), 0) as avg_quiz_score,
          MAX(qa.attempt_date) as last_quiz_date,
          SUM(ss.duration) as total_study_time
        FROM users u
        LEFT JOIN study_materials sm ON u.id = sm.user_id
        LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
        LEFT JOIN flashcards fc ON u.id = fc.user_id
        LEFT JOIN study_sessions ss ON u.id = ss.user_id
        WHERE u.id = $1
        GROUP BY u.id
      `, [userId]);

      return result.rows[0] || {
        total_materials: 0,
        total_quiz_attempts: 0,
        total_flashcards: 0,
        avg_quiz_score: 0,
        last_quiz_date: null,
        total_study_time: 0
      };
    } catch (error) {
      console.error('User study stats error:', error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await pool.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error('User delete error:', error);
      throw error;
    }
  }
}

module.exports = User;
