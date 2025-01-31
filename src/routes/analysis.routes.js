const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const {authMiddleware} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const analysisService = require('../services/analysis/analysis.service')

// Get nutrition analysis
router.post('/route-path', (req, res, next) => {
  authMiddleware,
  validate([
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('type').optional().isIn(['macro', 'micro', 'full']),
    query('group_by').optional().isIn(['day', 'week', 'month'])
  ]),
  async (req, res, next) => {
    try {
      const analysis = await analysisService.getNutritionAnalysis(
        req.user.id,
        req.query
      );
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
});

// Get progress analysis
router.get('/progress',
  authMiddleware,
  validate([
    query('metric').isIn(['weight', 'calories', 'nutrients', 'habits']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('include_predictions').optional().isBoolean()
  ]),
  async (req, res, next) => {
    try {
      const analysis = await analysisService.getProgressAnalysis(
        req.user.id,
        req.query
      );
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

// Get habit analysis
router.get('/habits',
  authMiddleware,
  validate([
    query('timeframe').optional().isIn(['week', 'month', 'year']),
    query('category').optional().isIn(['meal_timing', 'portion_control', 'food_choices'])
  ]),
  async (req, res, next) => {
    try {
      const analysis = await analysisService.getHabitAnalysis(
        req.user.id,
        req.query
      );
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

// Get comparison analysis
router.get('/compare',
  authMiddleware,
  validate([
    query('metric').isIn(['weight', 'calories', 'nutrients', 'habits']),
    query('period1_start').isISO8601(),
    query('period1_end').isISO8601(),
    query('period2_start').isISO8601(),
    query('period2_end').isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const comparison = await analysisService.getComparisonAnalysis(
        req.user.id,
        req.query
      );
      res.json(comparison);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;













































