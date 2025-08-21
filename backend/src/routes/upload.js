const express = require('express');
const uploadController = require('../controllers/uploadController');
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError, validateUpload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// All upload routes require authentication
router.use(authenticateToken);

// File upload route
router.post('/', 
  uploadLimiter,
  upload.single('file'),
  handleUploadError,
  validateUpload,
  uploadController.uploadFile
);

// Get processing status
router.get('/status/:materialId', uploadController.getProcessingStatus);

// Get user's uploaded materials
router.get('/materials', uploadController.getUserMaterials);

// Delete a material
router.delete('/materials/:materialId', uploadController.deleteMaterial);

module.exports = router;
