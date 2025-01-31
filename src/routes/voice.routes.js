const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middlewares/auth.middleware');
const voiceService = require('../services/voice.service');

// Configure multer for voice file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/webm') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only WAV and WEBM audio files are allowed.'), false);
    }
  }
});

router.post('/log',
  auth,
  upload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file provided' });
      }

      const result = await voiceService.processVoiceFoodLog(
        req.user.id,
        req.file.buffer
      );

      res.status(201).json({
        message: 'Voice log processed successfully',
        transcription: result.transcription,
        foodLog: result.foodLog
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
