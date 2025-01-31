const { MealPlans, User, FoodLog, Recipe } = require('../../models');
const aiService = require('../ai/ai.service');
const analysisService = require('../analysis/analysis.service');
// const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

class RecommendationService {
  async getMealSuggestions(userId, mealType = null) {
    try {
      const [userContext, recentMeals] = await Promise.all([
        analysisService.getUserContext(userId),
        this.getRecentMeals(userId)
      ]);

      // Get nutritional gaps from recent analysis
      const recentAnalysis = await analysisService.getPeriodAnalysis(
        userId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        new Date()
      );

      const suggestions = await aiService.generateMealSuggestions({
        userContext,
        recentMeals,
        nutritionalGaps: recentAnalysis.trends.nutritional_gaps,
        mealType,
        timeOfDay: new Date().getHours()
      });

      // Enhance suggestions with recipes and alternatives
      return await this.enhanceSuggestions(suggestions, userContext);
    } catch (error) {
      logger.error('Error in getMealSuggestions:', error);
      throw error;
    }
  }


  async getHealthyAlternatives(foodItem, userId) {
    try {
      const userContext = await analysisService.getUserContext(userId);

      const alternatives = await aiService.findHealthyAlternatives({
        foodItem,
        userContext,
        preferences: userContext.dietary_preferences,
        restrictions: userContext.health_conditions
      });

      // Match with available recipes
      return await Promise.all(
        alternatives.map(async alt => ({
          ...alt,
          recipes: await this.findMatchingRecipes(alt.name)
        }))
      );
    } catch (error) {
      logger.error('Error in getHealthyAlternatives:', error);
      throw error;
    }
  }


  async generateMealPlan(userId, duration = 7) {
    try {
      const [userContext, recentAnalysis] = await Promise.all([
        analysisService.getUserContext(userId),
        analysisService.getPeriodAnalysis(
          userId,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          new Date()
        )
      ]);

      const mealPlan = await aiService.createMealPlan({
        userContext,
        duration,
        nutritionalNeeds: recentAnalysis.trends.nutritional_gaps,
        preferences: userContext.dietary_preferences,
        restrictions: userContext.health_conditions
      });

      // Enhance plan with recipes and shopping lists
      const enhancedPlan = await this.enhanceMealPlan(mealPlan, userContext);

      // Save to database
      await MealPlans.create({
        user_id: userId,
        duration,
        plan_data: enhancedPlan,
        start_date: new Date()
      });

      return enhancedPlan;
    } catch (error) {
      logger.error('Error in generateMealPlan:', error);
      throw error;
    }
  }

  // Helper Methods
  async getRecentMeals(userId, days = 7) {
    return await FoodLog.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      },
      order: [['created_at', 'DESC']]
    });
  }

  async enhanceSuggestions(suggestions, userContext) {
    return await Promise.all(suggestions.map(async suggestion => ({
      ...suggestion,
      recipes: await this.findMatchingRecipes(suggestion.name),
      nutritional_match: this.calculateNutritionalMatch(
        suggestion.nutrition,
        userContext.nutrient_goals
      ),
      preparation_time: suggestion.preparation_time || 'N/A',
      difficulty_level: suggestion.difficulty_level || 'medium'
    })));
  }

  async findMatchingRecipes(foodItem) {
    return await Recipe.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${foodItem}%` } },
          { tags: { [Op.contains]: [foodItem.toLowerCase()] } }
        ]
      },
      limit: 3
    });
  }

async enhanceMealPlan(mealPlan, userContext) {
  const enhancedPlan = {
    ...mealPlan,
    days: await Promise.all(mealPlan.days.map(async day => ({
      ...day,
      meals: await Promise.all(day.meals.map(async meal => ({
        ...meal,
        recipes: await this.findMatchingRecipes(meal.name),
        alternatives: await this.getHealthyAlternatives(meal.name, userContext.id),
        nutritional_info: await this.getNutritionalInfo(meal)
      })))
    }))),
    shopping_list: this.generateShoppingList(mealPlan.days),
    preparation_tips: await this.getPreparationTips(mealPlan.days),
    nutritional_summary: this.calculateNutritionalSummary(mealPlan.days)
  };

  return enhancedPlan;
}

calculateNutritionalMatch(nutrition, goals) {
  return {
    overall_match: this.calculateOverallMatch(nutrition, goals),
    specific_matches: this.calculateSpecificMatches(nutrition, goals),
    deficiencies: this.identifyDeficiencies(nutrition, goals)
  };
}

generateShoppingList(mealPlanDays) {
  const ingredients = new Map();
  
  mealPlanDays.forEach(day => {
    day.meals.forEach(meal => {
      meal.ingredients?.forEach(ingredient => {
        const current = ingredients.get(ingredient.name) || { quantity: 0, unit: ingredient.unit };
        ingredients.set(ingredient.name, {
          quantity: current.quantity + ingredient.quantity,
          unit: ingredient.unit
        });
      });
    });
  });

  return Array.from(ingredients.entries()).map(([name, details]) => ({
    name,
    quantity: details.quantity,
    unit: details.unit,
    category: this.categorizeIngredient(name)
  }));
}

categorizeIngredient(ingredient) {
  const categories = {
    proteins: ['chicken', 'fish', 'beef', 'tofu', 'eggs'],
    vegetables: ['carrot', 'broccoli', 'spinach', 'lettuce'],
    fruits: ['apple', 'banana', 'orange', 'berry'],
    grains: ['rice', 'pasta', 'bread', 'quinoa'],
    dairy: ['milk', 'cheese', 'yogurt'],
    pantry: ['oil', 'spice', 'sauce', 'flour']
  };

  for (const [category, items] of Object.entries(categories)) {
    if (items.some(item => ingredient.toLowerCase().includes(item))) {
      return category;
    }
  }
  return 'other';
}

async getPreparationTips(meals) {
  // Aggregate all unique preparation methods
  const methods = new Set();
  meals.forEach(day => {
    day.meals.forEach(meal => {
      if (meal.preparation_method) {
        methods.add(meal.preparation_method);
      }
    });
  });

  // Get tips for each method
  const tips = {};
  for (const method of methods) {
    tips[method] = await this.getCookingTips(method);
  }

  return tips;
}

async getCookingTips(preparationMethod) {
  try {
    // Directly fetch tips from AI service
    const tips = await aiService.getCookingTips(preparationMethod);
    return tips;
  } catch (error) {
    logger.error('Error getting cooking tips:', error);
    throw error;
  }
}

calculateNutritionalSummary(mealPlanDays) {
  const summary = mealPlanDays.reduce((acc, day) => {
    day.meals.forEach(meal => {
      if (meal.nutritional_info) {
        acc.calories += meal.nutritional_info.calories || 0;
        acc.proteins += meal.nutritional_info.proteins || 0;
        acc.carbs += meal.nutritional_info.carbs || 0;
        acc.fats += meal.nutritional_info.fats || 0;
      }
    });
    return acc;
  }, { calories: 0, proteins: 0, carbs: 0, fats: 0 });

  return {
    ...summary,
    daily_average: {
      calories: summary.calories / mealPlanDays.length,
      proteins: summary.proteins / mealPlanDays.length,
      carbs: summary.carbs / mealPlanDays.length,
      fats: summary.fats / mealPlanDays.length
    }
  };
}
}


module.exports = new RecommendationService();
