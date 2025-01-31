const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { upload, resizeImage } = require('../middlewares/upload.middleware'); // Add resizeImage here
const { apiLimiter } = require('../middlewares/rate-limit.middleware');
const foodService = require('../services/food.service');

// Log meal with manual entry
router.post('/log',
  authMiddleware,
  validate([
    body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    body('food_items').isArray(),
    body('food_items.*.name').notEmpty(),
    body('food_items.*.portion_size').notEmpty(),
    body('food_items.*.preparation').optional().isString(),
    body('date').optional().isISO8601(),
    body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  async (req, res, next) => {
    try {
      const mealLog = await foodService.logMeal(req.user.id, req.body);
      res.status(201).json(mealLog);
    } catch (error) {
      next(error);
    }
  }
);

// Log meal with photo
router.post('/log/photo',
  authMiddleware,
  upload.single('food_photo'),
  resizeImage,  // Now this will be defined
  validate([
    body('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    body('date').optional().isISO8601(),
    body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No photo uploaded');
      }
      const mealLog = await foodService.logMealWithPhoto(
        req.user.id,
        req.file.path,
        req.body
      );
      res.status(201).json(mealLog);
    } catch (error) {
      next(error);
    }
  }
);


// Log meal with voice (similarly update this route)
router.post('/log/voice',
  authMiddleware,
  upload.single('voice_recording'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new Error('No voice recording uploaded');
      }
      const mealLog = await foodService.logMealWithVoice(
        req.user.id,
        req.file.path
      );
      res.status(201).json(mealLog);
    } catch (error) {
      next(error);
    }
  }
);


// Log multiple meals for the day
router.post('/log/day',
  authMiddleware,
  validate([
    body('date').isISO8601(),
    body('meals').isArray(),
    body('meals.*.meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    body('meals.*.food_items').isArray()
  ]),
  async (req, res, next) => {
    try {
      const dayLog = await foodService.logDayMeals(req.user.id, req.body);
      res.status(201).json(dayLog);
    } catch (error) {
      next(error);
    }
  }
);

// Get meal logs
router.get('/logs',
  authMiddleware,
  validate([
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req, res, next) => {
    try {
      const logs = await foodService.getMealLogs(req.user.id, req.query);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
);

// Get meal analysis
router.get('/analysis',
  authMiddleware,
  validate([
    query('date').optional().isISO8601(),
    query('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    query('type').optional().isIn(['nutrition', 'patterns', 'recommendations'])
  ]),
  async (req, res, next) => {
    try {
      const analysis = await foodService.getMealAnalysis(req.user.id, req.query);
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

// Update meal log
router.put('/log/:logId',
  authMiddleware,
  validate([
    body('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    body('food_items').optional().isArray(),
    body('date').optional().isISO8601(),
    body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  ]),
  async (req, res, next) => {
    try {
      const updatedLog = await foodService.updateMealLog(
        req.user.id,
        req.params.logId,
        req.body
      );
      res.json(updatedLog);
    } catch (error) {
      next(error);
    }
  }
);

// Delete meal log
router.delete('/log/:logId',
  authMiddleware,
  async (req, res, next) => {
    try {
      await foodService.deleteMealLog(req.user.id, req.params.logId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Get nutrition insights
router.get('/insights',
  authMiddleware,
  validate([
    query('period').optional().isIn(['day', 'week', 'month']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const insights = await foodService.getNutritionInsights(req.user.id, req.query);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }
);

// Get meal suggestions
router.get('/suggestions',
  authMiddleware,
  validate([
    query('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    query('based_on').optional().isIn(['preferences', 'history', 'goals', 'nutrition'])
  ]),
  async (req, res, next) => {
    try {
      const suggestions = await foodService.getMealSuggestions(req.user.id, req.query);
      res.json(suggestions);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;

