const pool = require('../config/database');

class FlashCard {
  static async create(flashcardData) {
    try {
      const { 
        materialId, 
        userId, 
        frontText, 
        backText, 
        difficultyLevel = 1,
        topic = 'General'
      } = flashcardData;
      
      const result = await pool.query(
        `INSERT INTO flashcards (material_id, user_id, front_text, back_text, difficulty_level, topic) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [materialId, userId, frontText, backText, difficultyLevel, topic]
      );

      return result.rows[0];
    } catch (error) {
      console.error('FlashCard create error:', error);
      throw error;
    }
  }

  static async createBatch(flashcardsArray) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const createdFlashcards = [];
      
      for (const flashcard of flashcardsArray) {
        const result = await client.query(
          `INSERT INTO flashcards (material_id, user_id, front_text, back_text, difficulty_level, topic) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [
            flashcard.materialId,
            flashcard.userId,
            flashcard.front,
            flashcard.back,
            flashcard.difficulty || 1,
            flashcard.topic || 'General'
          ]
        );
        createdFlashcards.push(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return createdFlashcards;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('FlashCard createBatch error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  static async findById(id, userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM flashcards WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('FlashCard findById error:', error);
      throw error;
    }
  }

  static async findByMaterialId(materialId, userId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;
      
      const result = await pool.query(
        `SELECT * FROM flashcards 
         WHERE material_id = $1 AND user_id = $2 
         ORDER BY created_at DESC 
         LIMIT $3 OFFSET $4`,
        [materialId, userId, limit, offset]
      );

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM flashcards WHERE material_id = $1 AND user_id = $2',
        [materialId, userId]
      );

      return {
        flashcards: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows.count / limit)
      };
    } catch (error) {
      console.error('FlashCard findByMaterialId error:', error);
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 50, topic = null, difficultyLevel = null } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT f.*, sm.file_name 
        FROM flashcards f
        JOIN study_materials sm ON f.material_id = sm.id
        WHERE f.user_id = $1
      `;
      let params = [userId];
      let paramCount = 1;

      if (topic) {
        paramCount++;
        query += ` AND f.topic = $${paramCount}`;
        params.push(topic);
      }

      if (difficultyLevel) {
        paramCount++;
        query += ` AND f.difficulty_level = $${paramCount}`;
        params.push(difficultyLevel);
      }

      query += ` ORDER BY f.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM flashcards WHERE user_id = $1';
      let countParams = [userId];
      
      if (topic) {
        countQuery += ' AND topic = $2';
        countParams.push(topic);
      }
      
      const countResult = await pool.query(countQuery, countParams);

      return {
        flashcards: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows.count / limit)
      };
    } catch (error) {
      console.error('FlashCard findByUserId error:', error);
      throw error;
    }
  }

  static async getDueFlashcards(userId, limit = 20) {
    try {
      const result = await pool.query(
        `SELECT f.*, sm.file_name 
         FROM flashcards f
         JOIN study_materials sm ON f.material_id = sm.id
         WHERE f.user_id = $1 AND f.next_review <= CURRENT_DATE
         ORDER BY f.next_review ASC, f.difficulty_level DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error) {
      console.error('FlashCard getDueFlashcards error:', error);
      throw error;
    }
  }

  static async updateReview(id, userId, quality) {
    try {
      // Spaced repetition algorithm (SM-2)
      const flashcard = await this.findById(id, userId);
      if (!flashcard) {
        throw new Error('Flashcard not found');
      }

      let { ease_factor, review_count } = flashcard;
      review_count += 1;

      // Calculate new ease factor
      ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (ease_factor < 1.3) ease_factor = 1.3;

      // Calculate next review interval
      let interval;
      if (quality < 3) {
        interval = 1; // Review again tomorrow if quality is poor
      } else if (review_count === 1) {
        interval = 1;
      } else if (review_count === 2) {
        interval = 6;
      } else {
        interval = Math.round((review_count - 1) * ease_factor);
      }

      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + interval);

      const result = await pool.query(
        `UPDATE flashcards 
         SET ease_factor = $1, review_count = $2, next_review = $3
         WHERE id = $4 AND user_id = $5 
         RETURNING *`,
        [ease_factor, review_count, nextReview.toISOString().split('T')[0], id, userId]
      );

      return result.rows;
    } catch (error) {
      console.error('FlashCard updateReview error:', error);
      throw error;
    }
  }

  static async getStudyStats(userId) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_flashcards,
          COUNT(CASE WHEN next_review <= CURRENT_DATE THEN 1 END) as due_flashcards,
          COUNT(CASE WHEN review_count = 0 THEN 1 END) as new_flashcards,
          AVG(ease_factor) as avg_ease_factor,
          COUNT(DISTINCT topic) as total_topics
        FROM flashcards 
        WHERE user_id = $1
      `, [userId]);

      return result.rows[0];
    } catch (error) {
      console.error('FlashCard getStudyStats error:', error);
      throw error;
    }
  }

  static async getTopicStats(userId) {
    try {
      const result = await pool.query(`
        SELECT 
          topic,
          COUNT(*) as total_cards,
          COUNT(CASE WHEN next_review <= CURRENT_DATE THEN 1 END) as due_cards,
          AVG(ease_factor) as avg_ease
        FROM flashcards 
        WHERE user_id = $1
        GROUP BY topic
        ORDER BY total_cards DESC
      `, [userId]);

      return result.rows;
    } catch (error) {
      console.error('FlashCard getTopicStats error:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM flashcards WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('FlashCard delete error:', error);
      throw error;
    }
  }

  static async update(id, userId, updateData) {
    try {
      const { frontText, backText, difficultyLevel, topic } = updateData;
      
      const result = await pool.query(
        `UPDATE flashcards 
         SET front_text = $1, back_text = $2, difficulty_level = $3, topic = $4
         WHERE id = $5 AND user_id = $6 
         RETURNING *`,
        [frontText, backText, difficultyLevel, topic, id, userId]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error('FlashCard update error:', error);
      throw error;
    }
  }
}

module.exports = FlashCard;
