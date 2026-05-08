// Simple Media Routes - Fixed Version
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  }
});

// In-memory storage for demo
let mediaRecordings = [];

// Simple audio upload
router.post('/upload-audio', upload.single('audio'), (req, res) => {
  try {
    console.log('🎙 Audio upload request received');
    
    if (!req.file) {
      console.log('❌ No file found');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { duration, transcript, timestamp } = req.body;
    
    // Create recording object
    const recording = {
      id: 'audio_' + Date.now(),
      type: 'audio',
      url: `http://${req.hostname || '192.168.1.8'}:3000/uploads/${req.file.filename}`,
      duration: parseInt(duration) || 0,
      transcript: transcript || null,
      timestamp: timestamp || new Date().toISOString(),
      metadata: {
        size: req.file.size,
        format: 'audio/mp4',
        quality: 'high'
      }
    };

    // Store in memory
    mediaRecordings.push(recording);

    console.log('✅ Audio saved:', recording);
    
    return res.json({
      success: true,
      id: recording.id,
      url: recording.url,
      type: 'audio',
      timestamp: recording.timestamp,
      transcript: recording.transcript,
      metadata: recording.metadata
    });

  } catch (error) {
    console.error('❌ Audio upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to upload audio',
      details: error.message 
    });
  }
});

// Profile image upload
router.post('/upload-profile-image', upload.single('image'), (req, res) => {
  try {
    console.log('👤 Profile image upload request received');
    
    if (!req.file) {
      console.log('❌ No file found');
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { userId } = req.body;
    
    // Create image object
    const imageRecord = {
      id: 'profile_' + Date.now(),
      type: 'profile-image',
      url: `http://${req.hostname || '192.168.1.8'}:3000/uploads/${req.file.filename}`,
      userId: userId || 'demo_user',
      timestamp: new Date().toISOString(),
      metadata: {
        size: req.file.size,
        format: 'image',
        originalName: req.file.originalname
      }
    };

    console.log('✅ Profile image saved:', imageRecord);
    
    return res.json({
      success: true,
      id: imageRecord.id,
      url: imageRecord.url,
      type: 'profile-image',
      timestamp: imageRecord.timestamp,
      metadata: imageRecord.metadata
    });

  } catch (error) {
    console.error('❌ Profile image upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to upload profile image',
      details: error.message 
    });
  }
});

// Simple video upload
router.post('/upload-video', upload.single('video'), (req, res) => {
  try {
    console.log('🎥 Video upload request received');
    
    if (!req.file) {
      console.log('❌ No file found');
      return res.status(400).json({ error: 'No video file provided' });
    }

    const { duration, transcript, timestamp } = req.body;
    
    // Create recording object (store locally for now)
    const recording = {
      id: 'video_' + Date.now(),
      type: 'video',
      url: `http://${req.hostname || '192.168.1.8'}:3000/uploads/${req.file.filename}`,
      duration: parseInt(duration) || 0,
      transcript: transcript || null,
      timestamp: timestamp || new Date().toISOString(),
      metadata: {
        size: req.file.size,
        format: 'video/mp4',
        quality: 'high'
      }
    };

    // Store in memory
    mediaRecordings.push(recording);

    console.log('✅ Video saved:', recording);
    
    return res.json({
      success: true,
      id: recording.id,
      url: recording.url,
      type: 'video',
      timestamp: recording.timestamp,
      transcript: recording.transcript,
      metadata: recording.metadata
    });

  } catch (error) {
    console.error('❌ Video upload error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to upload video',
      details: error.message 
    });
  }
});

// Get all recordings
router.get('/user/:userId', (req, res) => {
  try {
    console.log('📋 Fetching recordings for user:', req.params.userId);
    
    return res.json({
      success: true,
      recordings: mediaRecordings,
      total: mediaRecordings.length
    });

  } catch (error) {
    console.error('❌ Fetch recordings error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch recordings' 
    });
  }
});

// Delete recording
router.delete('/:recordingId', (req, res) => {
  try {
    console.log('🗑️ Deleting recording:', req.params.recordingId);
    
    const recordingIndex = mediaRecordings.findIndex(r => r.id === req.params.recordingId);
    
    if (recordingIndex === -1) {
      return res.status(404).json({ 
        success: false,
        error: 'Recording not found' 
      });
    }

    // Remove from memory
    mediaRecordings.splice(recordingIndex, 1);

    console.log('✅ Recording deleted');
    return res.json({ 
      success: true,
      message: 'Recording deleted successfully' 
    });

  } catch (error) {
    console.error('❌ Delete recording error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to delete recording' 
    });
  }
});

// Serve uploaded files
router.get('/uploads/:filename', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.filename);
    console.log('🔍 Looking for file:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('✅ File found, serving:', req.params.filename);
      return res.sendFile(filePath);
    } else {
      console.log('❌ File not found:', filePath);
      return res.status(404).json({ error: 'File not found', path: filePath });
    }
  } catch (error) {
    console.error('❌ Serve file error:', error);
    return res.status(500).json({ error: 'Failed to serve file' });
  }
});

// List all uploaded files (for debugging)
router.get('/uploads', (req, res) => {
  try {
    const uploadsPath = path.join(__dirname, '../uploads');
    const files = fs.existsSync(uploadsPath) ? fs.readdirSync(uploadsPath) : [];
    console.log('📁 Files in uploads:', files);
    
    return res.json({
      success: true,
      files: files,
      path: uploadsPath
    });
  } catch (error) {
    console.error('❌ List files error:', error);
    return res.status(500).json({ error: 'Failed to list files' });
  }
});

module.exports = router;
