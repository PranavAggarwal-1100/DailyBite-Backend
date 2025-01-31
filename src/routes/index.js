const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const foodRoutes = require('./food.routes');
const goalRoutes = require('./goal.routes');
const challengeRoutes = require('./challenge.routes');
const analysisRoutes = require('./analysis.routes');
const coachRoutes = require('./coach.routes');
const notificationRoutes = require('./notification.routes');
const uploadRoutes = require('./upload.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/food', foodRoutes);
router.use('/goals', goalRoutes);
router.use('/challenges', challengeRoutes);
router.use('/analysis', analysisRoutes);
router.use('/coach', coachRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

module.exports = router;






