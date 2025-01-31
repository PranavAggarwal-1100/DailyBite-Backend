const { MealLog, UserHealth, Allergies, Preferences } = require('../../models');
const photoAnalyzer = require('./photo-analyzer.service');
const voiceParser = require('./voice-parser.service');
const mealClassifier = require('./meal-classifier.service');
const instantAnalysis = require('../analysis/instant.service');
const { buildUserContext } = require('../ai/prompt-builder.service');
const logger = require('../../utils/logger');
const timeClassifier = require('../../utils/time-classifier');

class MealLoggerService {
  async logSingleMeal({ userId, mealType, foodDetails, photo, time }) {
    try {
      // Get user context for AI analysis
      const userContext = await buildUserContext(userId);
      
      let mealData;
      
      if (photo) {
        // Process photo and get food details
        mealData = await photoAnalyzer.analyzeFoodPhoto(photo, userContext);
        // If time not provided, use photo metadata or current time
        time = time || mealData.timeFromPhoto || new Date();
        // If meal type not provided, detect from time
        mealType = mealType || timeClassifier.getMealTypeFromTime(time);
      } else {
        mealData = {
          foodItems: foodDetails,
          time: time || new Date()
        };
      }

      // Create meal log entry
      const mealLog = await MealLog.create({
        userId,
        mealType,
        foodItems: mealData.foodItems,
        time: mealData.time,
        photo: photo ? photo.path : null
      });

      // Get instant analysis
      const analysis = await instantAnalysis.analyzeMeal(mealLog.id, userContext);

      // Update meal log with analysis
      await mealLog.update({
        nutritionalInfo: analysis.nutritionalInfo,
        recommendations: analysis.recommendations
      });

      return {
        mealLog,
        analysis
      };
    } catch (error) {
      logger.error('Error in logSingleMeal:', error);
      throw error;
    }
  }

  async logWholeDayMeal({ userId, content, contentType }) {
    try {
      const userContext = await buildUserContext(userId);
      
      // Parse content based on type (voice/text)
      let parsedContent;
      if (contentType === 'voice') {
        parsedContent = await voiceParser.parseVoiceContent(content);
      } else {
        parsedContent = content;
      }

      // Use AI to structure the day's meals
      const structuredMeals = await mealClassifier.classifyDayMeals(parsedContent, userContext);

      // Log each meal
      const mealLogs = [];
      for (const meal of structuredMeals) {
        const mealLog = await this.logSingleMeal({
          userId,
          mealType: meal.type,
          foodDetails: meal.foodItems,
          time: meal.time
        });
        mealLogs.push(mealLog);
      }

      // Get day analysis
      const dayAnalysis = await instantAnalysis.analyzeDayMeals(
        mealLogs.map(log => log.mealLog.id),
        userContext
      );

      return {
        meals: mealLogs,
        dayAnalysis
      };
    } catch (error) {
      logger.error('Error in logWholeDayMeal:', error);
      throw error;
    }
  }

  async updateMealLog({ mealLogId, userId, updates }) {
    try {
      const mealLog = await MealLog.findOne({
        where: { id: mealLogId, userId }
      });

      if (!mealLog) {
        throw new Error('Meal log not found');
      }

      await mealLog.update(updates);

      // Re-analyze if food items changed
      if (updates.foodItems) {
        const userContext = await buildUserContext(userId);
        const analysis = await instantAnalysis.analyzeMeal(mealLogId, userContext);
        await mealLog.update({
          nutritionalInfo: analysis.nutritionalInfo,
          recommendations: analysis.recommendations
        });
        return { mealLog, analysis };
      }

      return { mealLog };
    } catch (error) {
      logger.error('Error in updateMealLog:', error);
      throw error;
    }
  }
}

module.exports = new MealLoggerService();


