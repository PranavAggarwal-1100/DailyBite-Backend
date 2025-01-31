const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const {authMiddleware} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { aiLimiter } = require('../middlewares/rate-limit.middleware');
const coachService = require('../services/coach/health-coach.service')

// Get personalized advice
router.post('/advice',
  authMiddleware,
  aiLimiter,
  validate([
    body('query').notEmpty(),
    body('context').optional().isObject(),
    body('category').optional().isIn(['nutrition', 'fitness', 'habit', 'motivation'])
  ]),
  async (req, res, next) => {
    try {
      const advice = await coachService.getPersonalizedAdvice(
        req.user.id,
        req.body
      );
      res.json(advice);
    } catch (error) {
      next(error);
    }
  }
);

// Get daily insights
router.get('/insights/daily',
  authMiddleware,
  async (req, res, next) => {
    try {
      const insights = await coachService.getDailyInsights(req.user.id);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }
);

// Get weekly coaching summary
router.get('/summary/weekly',
  authMiddleware,
  async (req, res, next) => {
    try {
      const summary = await coachService.getWeeklyCoachingSummary(req.user.id);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }
);

// Get recommendations
router.get('/recommendations',
  authMiddleware,
  validate([
    query('type').optional().isIn(['meal', 'activity', 'habit']),
    query('context').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      const recommendations = await coachService.getRecommendations(
        req.user.id,
        req.query
      );
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

// Rate coach advice
router.post('/feedback',
  authMiddleware,
  validate([
    body('advice_id').notEmpty(),
    body('rating').isInt({ min: 1, max: 5 }),
    body('feedback').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      await coachService.rateAdvice(req.user.id, req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;






























