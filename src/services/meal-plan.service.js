const { MealPlans, Recipes, Allergens } = require('../models');
const nutritionService = require('./nutrition.service');
const aiService = require('./ai.service');
const logger = require('../utils/logger');

class MealPlanService {
  async generateMealPlan(userId, preferences = {}) {
    try {
      // Get user's nutrition data and deficiencies
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const [deficiencies, allergens] = await Promise.all([
        nutritionService.generateNutritionReport(userId, lastWeek, today),
        Allergens.findAll({ where: { user_id: userId } })
      ]);

      // Get seasonal ingredients based on current month
      const season = this.getCurrentSeason();

      // Generate meal plan using AI
      const mealPlan = await aiService.generateMealPlan({
        nutritionalNeeds: deficiencies,
        allergens: allergens.map(a => a.allergen),
        season,
        preferences
      });

      // Save the generated meal plan
      const savedPlan = await MealPlans.create({
        user_id: userId,
        plan_date: today,
        meals: JSON.stringify(mealPlan)
      });

      // Find matching recipes from our database
      const mealPlanWithRecipes = await this.attachRecipesToMealPlan(mealPlan);

      return {
        ...savedPlan.toJSON(),
        meals: mealPlanWithRecipes
      };
    } catch (error) {
      logger.error('Error in generateMealPlan:', error);
      throw error;
    }
  }

  async attachRecipesToMealPlan(mealPlan) {
    const enhancedMealPlan = { ...mealPlan };
    
    for (const [mealType, meals] of Object.entries(mealPlan)) {
      enhancedMealPlan[mealType] = await Promise.all(
        meals.map(async (meal) => {
          const recipe = await Recipes.findOne({
            where: {
              name: {
                [Op.iLike]: `%${meal.name}%`
              }
            }
          });

          return {
            ...meal,
            recipe: recipe ? {
              id: recipe.id,
              instructions: recipe.instructions,
              ingredients: recipe.ingredients
            } : null
          };
        })
      );
    }

    return enhancedMealPlan;
  }

  getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  async updateMealPlan(userId, planId, updates) {
    try {
      const plan = await MealPlans.findOne({
        where: {
          id: planId,
          user_id: userId
        }
      });

      if (!plan) {
        throw new Error('Meal plan not found');
      }

      const currentMeals = JSON.parse(plan.meals);
      const updatedMeals = {
        ...currentMeals,
        ...updates
      };

      await plan.update({
        meals: JSON.stringify(updatedMeals)
      });

      return {
        ...plan.toJSON(),
        meals: updatedMeals
      };
    } catch (error) {
      logger.error('Error in updateMealPlan:', error);
      throw error;
    }
  }

  async getMealPlanHistory(userId, startDate, endDate) {
    try {
      const plans = await MealPlans.findAll({
        where: {
          user_id: userId,
          plan_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['plan_date', 'DESC']]
      });

      return plans.map(plan => ({
        ...plan.toJSON(),
        meals: JSON.parse(plan.meals)
      }));
    } catch (error) {
      logger.error('Error in getMealPlanHistory:', error);
      throw error;
    }
  }
}

module.exports = new MealPlanService();

