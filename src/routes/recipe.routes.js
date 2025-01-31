const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const authMiddleware = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validation.middleware');
const upload = require('../middlewares/upload.middleware');

// Get recipes
router.get('/',
  authMiddleware,
  validate([
    query('cuisine').optional().isString(),
    query('diet').optional().isString(),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    query('time').optional().isInt({ min: 0 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ]),
  async (req, res, next) => {
    try {
      const recipes = await recipeService.getRecipes(req.query);
      res.json(recipes);
    } catch (error) {
      next(error);
    }
  }
);

// Get recipe details
router.get('/:recipeId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const recipe = await recipeService.getRecipeDetails(req.params.recipeId);
      res.json(recipe);
    } catch (error) {
      next(error);
    }
  }
);

// Save recipe to favorites
router.post('/:recipeId/favorite',
  authMiddleware,
  async (req, res, next) => {
    try {
      await recipeService.addToFavorites(req.user.id, req.params.recipeId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Get recipe recommendations
router.get('/recommendations',
  authMiddleware,
  validate([
    query('based_on').optional().isIn(['preferences', 'history', 'nutrition', 'goals']),
    query('meal_type').optional().isIn(['breakfast', 'lunch', 'dinner', 'snack']),
    query('limit').optional().isInt({ min: 1, max: 20 })
  ]),
  async (req, res, next) => {
    try {
      const recommendations = await recipeService.getRecommendations(
        req.user.id,
        req.query
      );
      res.json(recommendations);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
























