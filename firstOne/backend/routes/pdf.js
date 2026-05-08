const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  uploadPDF,
  getUserPDFs,
  getPDF,
  askQuestion,
  deletePDF
} = require('../controllers/pdfController');
const auth = require('../middleware/auth');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/pdfs');
    // Create directory if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
router.post('/upload', auth, upload.single('pdf'), uploadPDF);
router.get('/user', auth, getUserPDFs);
router.get('/:id', auth, getPDF);
router.post('/ask', auth, askQuestion);
router.delete('/:id', auth, deletePDF);

module.exports = router;
