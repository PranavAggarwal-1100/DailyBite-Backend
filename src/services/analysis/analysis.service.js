const { FoodLog, User, Progress, NutrientGoals } = require('../../models');
const aiService = require('../ai/prompt-builder.service');
// const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

class AnalysisService {
  async getDailyAnalysis(userId, date) {
    try {
      const [meals, userContext] = await Promise.all([
        FoodLog.findAll({
          where: { user_id: userId, log_date: date },
          order: [['created_at', 'ASC']]
        }),
        this.getUserContext(userId)
      ]);

      // Calculate basic nutritional totals
      const basicTotals = this.calculateDailyTotals(meals);

      // Get AI-powered analysis
      const aiAnalysis = await aiService.analyzeDailyNutrition({
        meals,
        userContext,
        basicTotals
      });

      return {
        date,
        basic_totals: basicTotals,
        ai_insights: aiAnalysis,
        meal_timing: this.analyzeMealTiming(meals),
        recommendations: aiAnalysis.recommendations,
        goals_progress: await this.checkGoalsProgress(userId, basicTotals)
      };
    } catch (error) {
      logger.error('Error in getDailyAnalysis:', error);
      throw error;
    }
  }

  async getPeriodAnalysis(userId, startDate, endDate, type = 'week') {
    try {
      const dailyLogs = await Promise.all(
        this.getDatesInRange(startDate, endDate).map(date =>
          this.getDailyAnalysis(userId, date)
        )
      );
  
      const trends = this.analyzeTrends(dailyLogs);
      const userContext = await this.getUserContext(userId);
  
      const periodAnalysis = {
        period: {
          start: startDate,
          end: endDate,
          type
        },
        daily_logs: dailyLogs,
        trends,
        summary: await aiService.analyzePeriodTrends({
          trends,
          userContext,
          type
        }),
        recommendations: await this.generatePeriodRecommendations(
          trends,
          userContext
        )
      };
  
      return periodAnalysis;
    } catch (error) {
      logger.error('Error in getPeriodAnalysis:', error);
      throw error;
    }
  }

  calculateDailyTotals(meals) {
    return meals.reduce((totals, meal) => {
      totals.calories += parseFloat(meal.calories || 0);
      
      // Aggregate macronutrients
      const macros = meal.macronutrients || {};
      totals.macronutrients.proteins += parseFloat(macros.proteins || 0);
      totals.macronutrients.carbs += parseFloat(macros.carbs || 0);
      totals.macronutrients.fats += parseFloat(macros.fats || 0);

      // Aggregate micronutrients
      const micros = meal.micronutrients || {};
      Object.entries(micros).forEach(([nutrient, amount]) => {
        totals.micronutrients[nutrient] = (totals.micronutrients[nutrient] || 0) + 
                                        parseFloat(amount || 0);
      });

      return totals;
    }, {
      calories: 0,
      macronutrients: { proteins: 0, carbs: 0, fats: 0 },
      micronutrients: {}
    });
  }

  analyzeMealTiming(meals) {
    const mealTypes = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: []
    };

    meals.forEach(meal => {
      const hour = new Date(meal.created_at).getHours();
      if (hour >= 4 && hour < 11) mealTypes.breakfast.push(meal);
      else if (hour >= 11 && hour < 16) mealTypes.lunch.push(meal);
      else if (hour >= 16 && hour < 20) mealTypes.dinner.push(meal);
      else mealTypes.snacks.push(meal);
    });

    return {
      meal_distribution: mealTypes,
      timing_analysis: this.analyzeMealSpacing(mealTypes),
      suggestions: this.getMealTimingSuggestions(mealTypes)
    };
  }

  async checkGoalsProgress(userId, dailyTotals) {
    const goals = await NutrientGoals.findAll({
      where: { user_id: userId }
    });

    return goals.map(goal => ({
      nutrient: goal.nutrient,
      target: goal.daily_target,
      achieved: dailyTotals.micronutrients[goal.nutrient] || 0,
      percentage: (dailyTotals.micronutrients[goal.nutrient] || 0) / goal.daily_target * 100,
      status: this.getGoalStatus(
        dailyTotals.micronutrients[goal.nutrient] || 0,
        goal.daily_target
      )
    }));
  }

  async getUserContext(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: NutrientGoals },
        { model: Progress, limit: 1, order: [['created_at', 'DESC']] }
      ]
    });

    return {
      age: user.age,
      gender: user.gender,
      activity_level: user.activity_level,
      dietary_preferences: user.dietary_preferences,
      health_conditions: user.health_conditions,
      goals: user.goals,
      current_progress: user.Progress?.[0],
      nutrient_goals: user.NutrientGoals
    };
  }

  shouldRefreshCache(cachedData, userId) {
    const data = JSON.parse(cachedData);
    const lastUpdate = new Date(data.timestamp);
    const now = new Date();

    // Refresh if more than 12 hours old
    if (now - lastUpdate > 43200000) return true;

    // Add more conditions for cache refresh
    return false;
  }

  getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  getGoalStatus(achieved, target) {
    const percentage = (achieved / target) * 100;
    if (percentage >= 90) return 'achieved';
    if (percentage >= 70) return 'on_track';
    if (percentage >= 50) return 'needs_attention';
    return 'off_track';
  }

  async generatePeriodRecommendations(trends, userContext) {
    // Convert trends and context into AI-friendly format
    const analysisContext = {
      trends,
      user: userContext,
      timeframe: trends.period.type
    };

    const recommendations = await aiService.generateRecommendations(analysisContext);

    // Structure and prioritize recommendations
    return {
      immediate_actions: recommendations.filter(r => r.priority === 'high'),
      long_term_suggestions: recommendations.filter(r => r.priority === 'medium'),
      maintenance_tips: recommendations.filter(r => r.priority === 'low')
    };
  }
}

module.exports = new AnalysisService();
