const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middlewares/auth.middleware'); // Note the destructuring
const validate = require('../middlewares/validation.middleware');
const { apiLimiter } = require('../middlewares/rate-limit.middleware');
const authService = require('../services/auth/auth.service');

// Handler functions
const registerHandler = async (req, res, next) => {
  try {
    const { email, password, ...userData } = req.body;
    const result = await authService.register(email, password, userData);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const loginHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const refreshTokenHandler = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body.refresh_token);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const logoutHandler = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const requestPasswordResetHandler = async (req, res, next) => {
  try {
    await authService.requestPasswordReset(req.body.email);
    res.status(200).json({
      message: 'If the email exists, a password reset link has been sent.'
    });
  } catch (error) {
    next(error);
  }
};

const resetPasswordHandler = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    res.status(200).json({ 
      message: 'Password has been reset successfully.' 
    });
  } catch (error) {
    next(error);
  }
};

// Validation schemas
const registerValidation = [
  body('email').isEmail().normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('name').trim().notEmpty()
    .withMessage('Name is required'),
  body('age').optional().isInt({ min: 13, max: 120 })
    .withMessage('Age must be between 13 and 120'),
  body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('Invalid gender value'),
  body('height').optional().isFloat({ min: 0 })
    .withMessage('Height must be a positive number'),
  body('weight').optional().isFloat({ min: 0 })
    .withMessage('Weight must be a positive number'),
  body('activity_level').optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
    .withMessage('Invalid activity level')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password').notEmpty()
    .withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refresh_token').notEmpty()
    .withMessage('Refresh token is required')
];

const passwordResetRequestValidation = [
  body('email').isEmail().normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const passwordResetValidation = [
  body('token').notEmpty()
    .withMessage('Reset token is required'),
  body('password').isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

// Routes
router.post('/register', 
  apiLimiter, 
  validate(registerValidation), 
  registerHandler
);

router.post('/login', 
  apiLimiter, 
  validate(loginValidation), 
  loginHandler
);

router.post('/refresh-token', 
  validate(refreshTokenValidation), 
  refreshTokenHandler
);

router.post('/logout', 
  authMiddleware, 
  logoutHandler
);

router.post('/password/reset-request', 
  apiLimiter, 
  validate(passwordResetRequestValidation), 
  requestPasswordResetHandler
);

router.post('/password/reset', 
  apiLimiter, 
  validate(passwordResetValidation), 
  resetPasswordHandler
);

module.exports = router;