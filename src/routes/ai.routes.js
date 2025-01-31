const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const { aiLimiter } = require('../middlewares/rateLimiter.middleware');
const aiService = require('../services/ai.service');

router.post('/query',
  auth,
  aiLimiter,
  async (req, res, next) => {
    try {
      const response = await aiService.processNutritionQuery(
        req.body.query,
        {
          dietary_preferences: req.user.dietary_preferences,
          health_conditions: req.user.health_conditions,
          activity_level: req.user.activity_level
        }
      );
      res.json({ response });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/meal-plan',
  auth,
  aiLimiter,
  async (req, res, next) => {
    try {
      const mealPlan = await aiService.generateMealPlan(
        req.user,
        req.body.nutritionData
      );
      res.json(mealPlan);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
