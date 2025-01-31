const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const { apiLimiter } = require('../middlewares/rate-limit.middleware');
const challengeService = require('../services/challenges/challenge.service')

// Get available challenges
router.get('/',
  authMiddleware,
  validate([
    query('type').optional().isIn(['nutrition', 'fitness', 'habit']),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('duration').optional().isIn(['week', 'month', 'custom']),
    query('status').optional().isIn(['upcoming', 'active', 'completed']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req, res, next) => {
    try {
      const challenges = await challengeService.getAvailableChallenges(
        req.user.id,
        req.query
      );
      res.json(challenges);
    } catch (error) {
      next(error);
    }
  }
);


// Join challenge
router.post('/:challengeId/join',
  authMiddleware,
  apiLimiter,
  async (req, res, next) => {
    try {
      const result = await challengeService.joinChallenge(
        req.user.id,
        req.params.challengeId
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get challenge progress
router.get('/:challengeId/progress',
  authMiddleware,
  async (req, res, next) => {
    try {
      const progress = await challengeService.getChallengeProgress(
        req.user.id,
        req.params.challengeId
      );
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
);

// Get challenge leaderboard
router.get('/:challengeId/leaderboard',
  authMiddleware,
  validate([
    query('timeframe').optional().isIn(['today', 'week', 'overall']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ]),
  async (req, res, next) => {
    try {
      const leaderboard = await challengeService.getChallengeLeaderboard(
        req.params.challengeId,
        req.query
      );
      res.json(leaderboard);
    } catch (error) {
      next(error);
    }
  }
);

// Leave challenge
router.post('/:challengeId/leave',
  authMiddleware,
  validate([
    body('reason').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      await challengeService.leaveChallenge(
        req.user.id,
        req.params.challengeId,
        req.body.reason
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;











