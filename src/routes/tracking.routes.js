const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');

// Track weight
router.post('/weight',
  authMiddleware,
  validate([
    body('weight').isFloat({ min: 20, max: 500 }),
    body('date').optional().isISO8601(),
    body('notes').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      const result = await trackingService.trackWeight(
        req.user.id,
        req.body
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Track measurements
router.post('/measurements',
  authMiddleware,
  validate([
    body('measurements').isObject(),
    body('date').optional().isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const result = await trackingService.trackMeasurements(
        req.user.id,
        req.body
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Track activity
router.post('/activity',
  authMiddleware,
  validate([
    body('type').isString(),
    body('duration').isInt({ min: 1 }),
    body('intensity').isIn(['low', 'moderate', 'high']),
    body('date').optional().isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const result = await trackingService.trackActivity(
        req.user.id,
        req.body
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Track sleep
router.post('/sleep',
  authMiddleware,
  validate([
    body('duration').isInt({ min: 0, max: 24 }),
    body('quality').isIn(['poor', 'fair', 'good', 'excellent']),
    body('date').optional().isISO8601()
  ]),
  async (req, res, next) => {
    try {
      const result = await trackingService.trackSleep(
        req.user.id,
        req.body
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// Get tracking history
router.get('/history',
  authMiddleware,
  validate([
    query('type').isIn(['weight', 'measurements', 'activity', 'sleep']),
    query('start_date').optional().isISO8601(),
    query('end_date').optional().isISO8601(),
    query('group_by').optional().isIn(['day', 'week', 'month'])
  ]),
  async (req, res, next) => {
    try {
      const history = await trackingService.getTrackingHistory(
        req.user.id,
        req.query
      );
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

// Delete tracking entry
router.delete('/:type/:entryId',
  authMiddleware,
  validate([
    body('reason').optional().isString()
  ]),
  async (req, res, next) => {
    try {
      await trackingService.deleteTrackingEntry(
        req.user.id,
        req.params.type,
        req.params.entryId,
        req.body.reason
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;



