const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const {authMiddleware} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const notificationService = require('../services/notification/notification.service')

// Get notifications
router.get('/',
  authMiddleware,
  validate([
    query('type').optional().isIn(['reminder', 'achievement', 'goal', 'system']),
    query('status').optional().isIn(['read', 'unread', 'all']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req, res, next) => {
    try {
      const notifications = await notificationService.getNotifications(
        req.user.id,
        req.query
      );
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }
);

// Mark notifications as read
router.put('/read',
  authMiddleware,
  validate([
    body('notification_ids').isArray()
  ]),
  async (req, res, next) => {
    try {
      await notificationService.markAsRead(
        req.user.id,
        req.body.notification_ids
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Update notification preferences
router.put('/preferences',
  authMiddleware,
  validate([
    body('types').optional().isObject(),
    body('channels').optional().isObject()
  ]),
  async (req, res, next) => {
    try {
      const preferences = await notificationService.updatePreferences(
        req.user.id,
        req.body
      );
      res.json(preferences);
    } catch (error) {
      next(error);
    }
  }
);

// Get notification count
router.get('/count',
  authMiddleware,
  validate([
    query('status').optional().isIn(['read', 'unread', 'all'])
  ]),
  async (req, res, next) => {
    try {
      const count = await notificationService.getNotificationCount(
        req.user.id,
        req.query.status
      );
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;












