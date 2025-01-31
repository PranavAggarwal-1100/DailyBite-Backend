const { validationResult, matchedData } = require('express-validator');
const { AppError } = require('./error.middleware');

const validate = (validations) => {
  return async (req, res, next) => {
    try {
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          status: 'error',
          errors: errors.array()
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;

