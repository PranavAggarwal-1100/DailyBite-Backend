const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const { upload, resizeImage } = require('../middlewares/upload.middleware');
const { apiLimiter } = require('../middlewares/rate-limit.middleware');
const uploadService = require('../services/upload.service');

// Upload food photo
router.post('/food-photo',
  authMiddleware,
  apiLimiter,
  upload.single('photo'),
  resizeImage,
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      const result = await uploadService.processFoodPhoto(req.user.id, req.file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Upload voice recording
router.post('/voice',
  authMiddleware,
  apiLimiter,
  upload.single('recording'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      const result = await uploadService.processVoiceRecording(req.user.id, req.file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Upload progress photo
router.post('/progress-photo',
  authMiddleware,
  upload.single('photo'),
  resizeImage,
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      const result = await uploadService.processProgressPhoto(req.user.id, req.file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Upload profile photo
router.post('/profile-photo',
  authMiddleware,
  upload.single('photo'),
  resizeImage,
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No file uploaded');
      }
      const result = await uploadService.processProfilePhoto(req.user.id, req.file);
      
      // Update user's profile photo URL
      await req.user.update({ profile_photo: result.data.url });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Delete uploaded file
router.delete('/:filename',
  authMiddleware,
  async (req, res, next) => {
    try {
      const deleted = await uploadService.deleteFile(req.params.filename);
      if (deleted) {
        res.status(204).send();
      } else {
        throw new Error('File not found');
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;