const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { upload, resizeImage } = require('../middlewares/upload.middleware');
const userService = require('../services/user.service');

// Get user profile
router.get('/profile', 
  authMiddleware,
  async (req, res, next) => {
    try {
      const profile = await userService.getProfile(req.user.id);
      res.json({
        status: 'success',
        data: { profile }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user profile
router.put('/profile',
  authMiddleware,
  validate([
    body('name').optional().trim().notEmpty(),
    body('age').optional().isInt({ min: 13, max: 120 }),
    body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
    body('height').optional().isFloat({ min: 0 }),
    body('weight').optional().isFloat({ min: 0 }),
    body('activity_level').optional().isIn(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    body('dietary_preferences').optional().isArray(),
    body('health_conditions').optional().isArray()
  ]),
  async (req, res, next) => {
    try {
      const updatedProfile = await userService.updateProfile(req.user.id, req.body);
      res.json({
        status: 'success',
        data: { profile: updatedProfile }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update preferences
router.put('/preferences',
  authMiddleware,
  validate([
    body('meal_reminders').optional().isBoolean(),
    body('progress_updates').optional().isBoolean(),
    body('push_notifications').optional().isBoolean(),
    body('email_notifications').optional().isBoolean(),
    body('language').optional().isString().isLength({ min: 2, max: 5 }),
    body('measurement_unit').optional().isIn(['metric', 'imperial'])
  ]),
  async (req, res, next) => {
    try {
      const preferences = await userService.updatePreferences(req.user.id, req.body);
      res.json({
        status: 'success',
        data: { preferences }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Upload avatar
router.post('/avatar',
    authMiddleware,
    upload.single('avatar'),
    resizeImage,
    async (req, res, next) => {
      try {
        if (!req.file) {
          throw new Error('No file uploaded');
        }
        const avatar = await userService.updateAvatar(req.user.id, req.file);
        res.json({
          status: 'success',
          data: { avatar }
        });
      } catch (error) {
        next(error);
      }
    }
  );

// Get user stats
router.get('/stats',
  authMiddleware,
  async (req, res, next) => {
    try {
      const stats = await userService.getUserStats(req.user.id);
      res.json({
        status: 'success',
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Complete onboarding
router.post('/onboarding',
  authMiddleware,
  validate([
    body('steps').isArray(),
    body('goals').isArray(),
    body('dietary_info').isObject(),
    body('health_info').isObject()
  ]),
  async (req, res, next) => {
    try {
      const result = await userService.completeOnboarding(req.user.id, req.body);
      res.json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get progress history
router.get('/progress-history',
  authMiddleware,
  async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      const history = await userService.getProgressHistory(req.user.id, start_date, end_date);
      res.json({
        status: 'success',
        data: { history }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Submit feedback
router.post('/feedback',
  authMiddleware,
  validate([
    body('type').isIn(['bug', 'feature', 'general']),
    body('content').notEmpty(),
    body('rating').optional().isInt({ min: 1, max: 5 })
  ]),
  async (req, res, next) => {
    try {
      const feedback = await userService.submitFeedback(req.user.id, req.body);
      res.json({
        status: 'success',
        data: { feedback }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete account
router.delete('/account',
  authMiddleware,
  validate([
    body('reason').optional().isString(),
    body('feedback').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      await userService.deleteAccount(req.user.id, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;