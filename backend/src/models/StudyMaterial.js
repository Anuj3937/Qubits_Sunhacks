const pool = require('../config/database');

class StudyMaterial {
  static async create(materialData) {
    try {
      const { userId, fileName, fileType, fileSize } = materialData;
      
      const result = await pool.query(
        `INSERT INTO study_materials (user_id, file_name, file_type, file_size, processing_status) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, file_name, file_type, file_size, processing_status, upload_date`,
        [userId, fileName, fileType, fileSize, 'pending']
      );

      return result.rows[0];
    } catch (error) {
      console.error('StudyMaterial create error:', error);
      throw error;
    }
  }

  static async findById(id, userId = null) {
    try {
      let query = 'SELECT * FROM study_materials WHERE id = $1';
      let params = [id];
      
      if (userId) {
        query += ' AND user_id = $2';
        params.push(userId);
      }

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('StudyMaterial findById error:', error);
      throw error;
    }
  }

  static async findByUserId(userId, options = {}) {
    try {
      const { page = 1, limit = 10, status = null, fileType = null } = options;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT id, file_name, file_type, file_size, processing_status, upload_date,
               CASE WHEN processed_content IS NOT NULL THEN true ELSE false END as has_content
        FROM study_materials 
        WHERE user_id = $1
      `;
      let params = [userId];
      let paramCount = 1;

      if (status) {
        paramCount++;
        query += ` AND processing_status = $${paramCount}`;
        params.push(status);
      }

      if (fileType) {
        paramCount++;
        query += ` AND file_type LIKE $${paramCount}`;
        params.push(`%${fileType}%`);
      }

      query += ` ORDER BY upload_date DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM study_materials WHERE user_id = $1';
      let countParams = [userId];
      
      if (status) {
        countQuery += ' AND processing_status = $2';
        countParams.push(status);
      }
      
      const countResult = await pool.query(countQuery, countParams);

      return {
        materials: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows.count / limit)
      };
    } catch (error) {
      console.error('StudyMaterial findByUserId error:', error);
      throw error;
    }
  }

  static async updateProcessingStatus(id, status, processedContent = null) {
    try {
      let query = 'UPDATE study_materials SET processing_status = $1';
      let params = [status];
      let paramCount = 1;

      if (processedContent) {
        paramCount++;
        query += `, processed_content = $${paramCount}, original_text = $${paramCount + 1}`;
        params.push(JSON.stringify(processedContent), processedContent.extractedText || '');
        paramCount++;
      }

      paramCount++;
      query += ` WHERE id = $${paramCount} RETURNING *`;
      params.push(id);

      const result = await pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('StudyMaterial updateProcessingStatus error:', error);
      throw error;
    }
  }

  static async getProcessedContent(id, userId) {
    try {
      const result = await pool.query(
        'SELECT processed_content, original_text FROM study_materials WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return {
        ...result.rows[0].processed_content,
        originalText: result.rows.original_text
      };
    } catch (error) {
      console.error('StudyMaterial getProcessedContent error:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM study_materials WHERE id = $1 AND user_id = $2 RETURNING *',
        [id, userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('StudyMaterial delete error:', error);
      throw error;
    }
  }

  static async getStudyStatsByUser(userId) {
    try {
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_materials,
          COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed_materials,
          COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing_materials,
          COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed_materials,
          SUM(file_size) as total_size,
          MAX(upload_date) as last_upload
        FROM study_materials 
        WHERE user_id = $1
      `, [userId]);

      return result.rows[0];
    } catch (error) {
      console.error('StudyMaterial getStudyStatsByUser error:', error);
      throw error;
    }
  }

  static async searchMaterials(userId, searchTerm, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const offset = (page - 1) * limit;

      const result = await pool.query(`
        SELECT id, file_name, file_type, processing_status, upload_date
        FROM study_materials 
        WHERE user_id = $1 
        AND (
          file_name ILIKE $2 
          OR original_text ILIKE $2
          OR processed_content::text ILIKE $2
        )
        ORDER BY upload_date DESC 
        LIMIT $3 OFFSET $4
      `, [userId, `%${searchTerm}%`, limit, offset]);

      const countResult = await pool.query(`
        SELECT COUNT(*) FROM study_materials 
        WHERE user_id = $1 
        AND (
          file_name ILIKE $2 
          OR original_text ILIKE $2
          OR processed_content::text ILIKE $2
        )
      `, [userId, `%${searchTerm}%`]);

      return {
        materials: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(countResult.rows.count / limit)
      };
    } catch (error) {
      console.error('StudyMaterial searchMaterials error:', error);
      throw error;
    }
  }
}

module.exports = StudyMaterial;
