const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      const userDir = path.join(uploadDir, req.userId.toString());
      
      // Create user-specific directory
      await fs.mkdir(userDir, { recursive: true });
      cb(null, userDir);
    } catch (error) {
      console.error('Upload directory creation error:', error);
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif']
  };

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const isValidType = allowedTypes[file.mimetype] && 
                     allowedTypes[file.mimetype].includes(fileExtension);

  if (isValidType) {
    cb(null, true);
  } else {
    cb(new Error(`File type not supported. Allowed types: PDF, DOC, DOCX, TXT, JPG, PNG, GIF`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
    files: 1 // Single file upload
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        maxSize: `${(parseInt(process.env.MAX_FILE_SIZE) || 10485760) / 1048576}MB`
      });
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files. Only one file allowed.'
      });
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field'
      });
    }
    
    return res.status(400).json({
      error: 'Upload error',
      details: error.message
    });
  } else if (error) {
    return res.status(400).json({
      error: error.message || 'Upload failed'
    });
  }
  
  next();
};

// Validation middleware
const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'No file provided'
    });
  }

  // Additional file validation
  const stats = fs.statSync(req.file.path);
  if (stats.size === 0) {
    return res.status(400).json({
      error: 'Empty file not allowed'
    });
  }

  // Check file extension matches MIME type
  const ext = path.extname(req.file.originalname).toLowerCase();
  const expectedExts = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif']
  };

  const validExts = expectedExts[req.file.mimetype];
  if (validExts && !validExts.includes(ext)) {
    return res.status(400).json({
      error: 'File extension does not match file type'
    });
  }

  next();
};

module.exports = {
  upload,
  handleUploadError,
  validateUpload
};
