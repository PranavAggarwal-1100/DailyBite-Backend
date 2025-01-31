const { FoodLog, NutrientGoals, Progress } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class NutritionService {
  async calculateDailyNutrients(userId, date) {
    try {
      const logs = await FoodLog.findAll({
        where: {
          user_id: userId,
          log_date: date
        }
      });

      // Initialize nutrient totals
      const totals = {
        calories: 0,
        macronutrients: {
          proteins: 0,
          carbs: 0,
          fats: 0
        },
        micronutrients: {}
      };

      // Calculate totals from all logs
      logs.forEach(log => {
        totals.calories += parseFloat(log.calories || 0);
        
        const macros = log.macronutrients || {};
        totals.macronutrients.proteins += parseFloat(macros.proteins || 0);
        totals.macronutrients.carbs += parseFloat(macros.carbs || 0);
        totals.macronutrients.fats += parseFloat(macros.fats || 0);

        const micros = log.micronutrients || {};
        Object.entries(micros).forEach(([nutrient, amount]) => {
          totals.micronutrients[nutrient] = (totals.micronutrients[nutrient] || 0) + parseFloat(amount || 0);
        });
      });

      return totals;
    } catch (error) {
      logger.error('Error in calculateDailyNutrients:', error);
      throw error;
    }
  }

  async checkNutrientDeficiencies(userId, date) {
    try {
      const [dailyTotals, goals] = await Promise.all([
        this.calculateDailyNutrients(userId, date),
        NutrientGoals.findAll({ where: { user_id: userId } })
      ]);

      const deficiencies = [];

      // Check each nutrient against its goal
      goals.forEach(goal => {
        const actual = this.getActualNutrientValue(dailyTotals, goal.nutrient);
        if (actual < goal.daily_target) {
          deficiencies.push({
            nutrient: goal.nutrient,
            actual: actual,
            target: goal.daily_target,
            deficit: goal.daily_target - actual
          });
        }
      });

      // Record progress and deficiencies
      await Progress.create({
        user_id: userId,
        date,
        calorie_intake: dailyTotals.calories,
        nutrient_deficits: JSON.stringify(deficiencies)
      });

      return deficiencies;
    } catch (error) {
      logger.error('Error in checkNutrientDeficiencies:', error);
      throw error;
    }
  }

  getActualNutrientValue(dailyTotals, nutrient) {
    // Helper to extract nutrient value from the totals object
    if (nutrient === 'calories') return dailyTotals.calories;
    if (nutrient in dailyTotals.macronutrients) return dailyTotals.macronutrients[nutrient];
    if (nutrient in dailyTotals.micronutrients) return dailyTotals.micronutrients[nutrient];
    return 0;
  }

  async generateNutritionReport(userId, startDate, endDate) {
    try {
      const progress = await Progress.findAll({
        where: {
          user_id: userId,
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['date', 'ASC']]
      });

      const report = {
        averageCalories: 0,
        commonDeficiencies: {},
        trends: {
          calories: [],
          deficiencies: []
        }
      };

      progress.forEach(day => {
        // Track calorie trends
        report.trends.calories.push({
          date: day.date,
          calories: day.calorie_intake
        });

        // Track deficiencies
        const deficits = JSON.parse(day.nutrient_deficits);
        deficits.forEach(deficit => {
          report.commonDeficiencies[deficit.nutrient] = 
            (report.commonDeficiencies[deficit.nutrient] || 0) + 1;
        });
        
        report.trends.deficiencies.push({
          date: day.date,
          deficiencies: deficits
        });

        report.averageCalories += day.calorie_intake;
      });

      if (progress.length > 0) {
        report.averageCalories /= progress.length;
      }

      return report;
    } catch (error) {
      logger.error('Error in generateNutritionReport:', error);
      throw error;
    }
  }
}

module.exports = new NutritionService();