const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const goalService = require('../services/goals/goal.service')

// Create new goal
router.post('/',
  authMiddleware,
  validate([
    body('type').isIn(['weight', 'nutrition', 'habits', 'measurements']),
    body('target').notEmpty(),
    body('deadline').optional().isISO8601(),
    body('metrics').optional().isObject(),
    body('milestones').optional().isArray()
  ]),
  async (req, res, next) => {
    try {
      const goal = await goalService.createGoal(req.user.id, req.body);
      res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  }
);


// Get user goals
router.get('/',
  authMiddleware,
  validate([
    query('type').optional().isIn(['weight', 'nutrition', 'habits', 'measurements']),
    query('status').optional().isIn(['active', 'completed', 'failed', 'paused']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req, res, next) => {
    try {
      const goals = await goalService.getUserGoals(req.user.id, req.query);
      res.json(goals);
    } catch (error) {
      next(error);
    }
  }
);

// Update goal progress
router.post('/:goalId/progress',
  authMiddleware,
  validate([
    body('value').notEmpty(),
    body('date').optional().isISO8601(),
    body('notes').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      const progress = await goalService.updateGoalProgress(
        req.user.id,
        req.params.goalId,
        req.body
      );
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
);

// Get goal analysis
router.get('/:goalId/analysis',
  authMiddleware,
  validate([
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const analysis = await goalService.analyzeGoalProgress(
        req.user.id,
        req.params.goalId,
        req.query
      );
      res.json(analysis);
    } catch (error) {
      next(error);
    }
  }
);

// Adjust goal
router.put('/:goalId',
  authMiddleware,
  validate([
    body('target').optional(),
    body('deadline').optional().isISO8601(),
    body('status').optional().isIn(['active', 'paused']),
    body('milestones').optional().isArray()
  ]),
  async (req, res, next) => {
    try {
      const updatedGoal = await goalService.adjustGoal(
        req.user.id,
        req.params.goalId,
        req.body
      );
      res.json(updatedGoal);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
















