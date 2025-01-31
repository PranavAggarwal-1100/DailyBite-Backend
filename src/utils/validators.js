const { body } = require('express-validator');

const validators = {
  user: {
    create: [
      body('email').isEmail().normalizeEmail(),
      body('password')
        .isLength({ min: 8 })
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/),
      body('name').trim().notEmpty(),
      body('age').optional().isInt({ min: 13, max: 120 }),
      body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
      body('height').optional().isFloat({ min: 0 }),
      body('weight').optional().isFloat({ min: 0 })
    ],
    update: [
      body('email').optional().isEmail().normalizeEmail(),
      body('name').optional().trim().notEmpty(),
      body('age').optional().isInt({ min: 13, max: 120 }),
      body('gender').optional().isIn(['male', 'female', 'other', 'prefer_not_to_say']),
      body('height').optional().isFloat({ min: 0 }),
      body('weight').optional().isFloat({ min: 0 })
    ]
  },
  goal: {
    create: [
      body('type').isIn(['weight', 'nutrition', 'habits', 'measurements']),
      body('target').notEmpty(),
      body('deadline').optional().isISO8601(),
      body('metrics').optional().isObject(),
      body('milestones').optional().isArray()
    ]
  },
  meal: {
    create: [
      body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
      body('food_items').isArray(),
      body('food_items.*.name').notEmpty(),
      body('food_items.*.portion_size').notEmpty(),
      body('date').optional().isISO8601(),
      body('time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    ]
  }
};

module.exports = validators;
