const { FoodLog, NutrientGoals } = require('../models');
const aiService = require('./ai/prompt-builder.service');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

class FoodService {
  async createFoodLog({ userId, foodItem, portionSize, logDate, preparation }) {
    try {
      // Create basic food log entry
      const foodLog = await FoodLog.create({
        user_id: userId,
        food_item: foodItem,
        portion_size: portionSize,
        log_date: logDate,
        preparation
      });

      // Get user context for AI analysis
      const user = await User.findByPk(userId);
      
      // Use AI to analyze nutritional content
      const nutritionalInfo = await aiService.processNutritionQuery(
        `Analyze the nutritional content of ${portionSize} of ${foodItem} ${preparation ? `prepared ${preparation}` : ''}`,
        {
          dietary_preferences: user.dietary_preferences,
          health_conditions: user.health_conditions,
          activity_level: user.activity_level
        }
      );

      // Update food log with AI analysis
      await foodLog.update({
        calories: nutritionalInfo.calories,
        macronutrients: nutritionalInfo.macronutrients,
        micronutrients: nutritionalInfo.micronutrients
      });

      return foodLog;
    } catch (error) {
      logger.error('Error in createFoodLog:', error);
      throw error;
    }
  }

  async createFoodLogFromImage(userId, imagePath) {
    try {
      // Analyze image using AI
      const analysis = await aiService.analyzeImage(imagePath);

      // Create food log from AI analysis
      const foodLog = await FoodLog.create({
        user_id: userId,
        food_item: analysis.food_item,
        portion_size: analysis.portion_size,
        log_date: new Date(),
        calories: analysis.calories,
        macronutrients: analysis.macronutrients,
        micronutrients: analysis.micronutrients,
        image_url: imagePath
      });

      return foodLog;
    } catch (error) {
      logger.error('Error in createFoodLogFromImage:', error);
      throw error;
    }
  }

  async getFoodLogs(userId, startDate, endDate) {
    try {
      const whereClause = { user_id: userId };

      if (startDate && endDate) {
        whereClause.log_date = {
          [Op.between]: [startDate, endDate]
        };
      }

      const foodLogs = await FoodLog.findAll({
        where: whereClause,
        order: [['log_date', 'DESC']],
        include: [{
          model: NutrientGoals,
          attributes: ['nutrient', 'daily_target']
        }]
      });

      return foodLogs;
    } catch (error) {
      logger.error('Error in getFoodLogs:', error);
      throw error;
    }
  }

  async getNutritionalAnalysis(userId, timeframe = 'week') {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeframe) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const foodLogs = await FoodLog.findAll({
        where: {
          user_id: userId,
          log_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['log_date', 'ASC']]
      });

      const analysis = await aiService.analyzeNutritionalTrends(foodLogs);

      return {
        timeframe,
        foodLogs,
        analysis
      };
    } catch (error) {
      logger.error('Error in getNutritionalAnalysis:', error);
      throw error;
    }
  }
}

module.exports = new FoodService();
