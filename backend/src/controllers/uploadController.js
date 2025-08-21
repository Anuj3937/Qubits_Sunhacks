const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const pool = require('../config/database');
const documentProcessor = require('../services/documentProcessor');
const { validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow PDF, DOC, DOCX, TXT, images
  const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, TXT, and image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB default
  },
  fileFilter: fileFilter
});

const uploadFile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, filename, mimetype, size } = req.file;
    const userId = req.userId;

    // Save file info to database
    const result = await pool.query(
      `INSERT INTO study_materials (user_id, file_name, file_type, file_size, processing_status) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, originalname, mimetype, size, 'pending']
    );

    const materialId = result.rows[0].id;

    // Start background processing
    processDocumentAsync(materialId, filename, userId);

    res.status(200).json({
      success: true,
      materialId,
      message: 'File uploaded successfully. Processing started.',
      fileName: originalname,
      fileSize: size
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
};

const processDocumentAsync = async (materialId, filename, userId) => {
  try {
    // Update status to processing
    await pool.query(
      'UPDATE study_materials SET processing_status = $1 WHERE id = $2',
      ['processing', materialId]
    );

    // Process the document
    const filePath = path.join(process.env.UPLOAD_DIR || './uploads', filename);
    const processedContent = await documentProcessor.processDocument(filePath, materialId, userId);

    // Update database with processed content
    await pool.query(
      `UPDATE study_materials SET 
       original_text = $1, 
       processed_content = $2, 
       processing_status = $3 
       WHERE id = $4`,
      [
        processedContent.extractedText,
        JSON.stringify(processedContent),
        'completed',
        materialId
      ]
    );

    console.log(`Document ${materialId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${materialId}:`, error);
    
    // Update status to failed
    await pool.query(
      'UPDATE study_materials SET processing_status = $1 WHERE id = $2',
      ['failed', materialId]
    );
  }
};

const getProcessingStatus = async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.userId;

    const result = await pool.query(
      'SELECT processing_status, file_name, processed_content FROM study_materials WHERE id = $1 AND user_id = $2',
      [materialId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const material = result.rows[0];
    
    res.json({
      success: true,
      status: material.processing_status,
      fileName: material.file_name,
      ...(material.processing_status === 'completed' && {
        summary: material.processed_content?.summary,
        topics: material.processed_content?.topics
      })
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ error: 'Failed to get processing status' });
  }
};

const getUserMaterials = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, file_name, file_type, file_size, processing_status, upload_date
       FROM study_materials 
       WHERE user_id = $1 
       ORDER BY upload_date DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM study_materials WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      materials: result.rows,
      totalCount: parseInt(countResult.rows[0].count),
      currentPage: parseInt(page),
      totalPages: Math.ceil(countResult.rows.count / limit)
    });

  } catch (error) {
    console.error('Get materials error:', error);
    res.status(500).json({ error: 'Failed to get materials' });
  }
};

const deleteMaterial = async (req, res) => {
  try {
    const { materialId } = req.params;
    const userId = req.userId;

    // Get file info for cleanup
    const fileResult = await pool.query(
      'SELECT file_name FROM study_materials WHERE id = $1 AND user_id = $2',
      [materialId, userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    // Delete from database (cascades to related tables)
    await pool.query(
      'DELETE FROM study_materials WHERE id = $1 AND user_id = $2',
      [materialId, userId]
    );

    // TODO: Delete physical file if needed
    // const filePath = path.join(process.env.UPLOAD_DIR, filename);
    // await fs.unlink(filePath);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });

  } catch (error) {
    console.error('Delete material error:', error);
    res.status(500).json({ error: 'Failed to delete material' });
  }
};

module.exports = {
  upload,
  uploadFile,
  getProcessingStatus,
  getUserMaterials,
  deleteMaterial
};
