const { AIQueries, User, Progress, UserPreferences } = require('../../models');
const aiService = require('../ai/prompt-builder.service');
const analysisService = require('../analysis/analysis.service');
// const redisClient = require('../../config/redis');
const logger = require('../../utils/logger');

class HealthCoachService {
  async getPersonalizedAdvice(userId, query, category = 'general') {
    try {
      const userContext = await this.buildUserContext(userId);
      
      const aiPrompt = {
        type: 'coaching_advice',
        query,
        category,
        context: {
          user: userContext,
          recentProgress: userContext.recentProgress,
          timeOfDay: new Date().getHours(),
          previousQueries: await this.getPreviousQueries(userId, 5)
        }
      };

      const response = await aiService.generateCoachingResponse(aiPrompt);

      // Structure and enhance the response
      const enhancedResponse = {
        advice: response.advice,
        suggestions: response.suggestions.map(s => ({
          ...s,
          difficulty: this.assessSuggestionDifficulty(s, userContext),
          timeframe: s.timeframe || 'short-term'
        })),
        resources: await this.getRelatedResources(response.topics),
        action_items: this.prioritizeActionItems(response.action_items),
        motivation: response.motivation,
        follow_up_questions: response.follow_up_questions
      };

      // Save interaction
      await AIQueries.create({
        user_id: userId,
        query_text: query,
        response_text: JSON.stringify(response),
        context: aiPrompt.context,
        query_type: 'health_coach',
        category
      });

      return enhancedResponse;
    } catch (error) {
      logger.error('Error in getPersonalizedAdvice:', error);
      throw error;
    }
  }


  async generateDailyInsights(userId) {
    try {
      const userContext = await this.buildUserContext(userId);
      const recentAnalysis = await analysisService.getPeriodAnalysis(
        userId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      );

      const insights = await aiService.generateDailyInsights({
        userContext,
        recentAnalysis,
        timeOfDay: new Date().getHours()
      });

      return {
        ...insights,
        actionable_tips: this.prioritizeActionItems(insights.tips),
        personalized_focus: await this.generateFocusAreas(userId, insights),
        motivation_message: this.personalizeMotivation(insights.motivation, userContext)
      };
    } catch (error) {
      logger.error('Error in generateDailyInsights:', error);
      throw error;
    }
  }


  async getWeeklyCoachingSummary(userId) {
    try {
      const analysis = await analysisService.getPeriodAnalysis(
        userId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        new Date()
      );

      const userContext = await this.buildUserContext(userId);
      
      const summary = {
        period: {
          start: analysis.period.start,
          end: analysis.period.end
        },
        achievements: this.analyzeAchievements(analysis),
        areas_for_improvement: await this.identifyImprovementAreas(analysis, userContext),
        recommendations: await this.generateRecommendations(analysis, userContext),
        next_steps: await this.suggestNextSteps(analysis, userContext),
        motivation: await this.generateMotivationalContent(userId)
      };

      return this.enhanceCoachingSummary(summary, userContext);
    } catch (error) {
      logger.error('Error in getWeeklyCoachingSummary:', error);
      throw error;
    }
  }

  async buildUserContext(userId) {
    const [user, preferences, recentProgress] = await Promise.all([
      User.findByPk(userId),
      UserPreferences.findOne({ where: { user_id: userId } }),
      Progress.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 7
      })
    ]);

    return {
      user: {
        age: user.age,
        gender: user.gender,
        activity_level: user.activity_level,
        goals: user.goals,
        dietary_preferences: user.dietary_preferences,
        health_conditions: user.health_conditions
      },
      preferences: preferences,
      recentProgress: recentProgress,
      progressTrends: this.analyzeProgressTrends(recentProgress)
    };
  }

  async getPreviousQueries(userId, limit = 5) {
    return await AIQueries.findAll({
      where: { user_id: userId, query_type: 'health_coach' },
      order: [['created_at', 'DESC']],
      limit
    });
  }

  assessSuggestionDifficulty(suggestion, userContext) {
    // Implementation for assessing suggestion difficulty based on user context
    const factors = {
      userExperience: this.calculateUserExperience(userContext),
      suggestionComplexity: this.assessComplexity(suggestion),
      userPreferences: this.matchWithPreferences(suggestion, userContext.preferences)
    };

    return this.calculateDifficultyScore(factors);
  }

  async getRelatedResources(topics) {
    // Implementation for fetching related resources based on topics
    return topics.map(topic => ({
      topic,
      articles: [],  // Would be populated from a content database
      videos: [],    // Would be populated from a content database
      tips: []       // Would be populated from a content database
    }));
  }

  prioritizeActionItems(items) {
    return items.map(item => ({
      ...item,
      priority: this.calculatePriority(item),
      timeToComplete: this.estimateTimeToComplete(item),
      difficulty: this.assessActionItemDifficulty(item)
    })).sort((a, b) => b.priority - a.priority);
  }

  async generateFocusAreas(userId, insights) {
    // Implementation for generating personalized focus areas
    const analysis = await analysisService.getPeriodAnalysis(userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date());
    
    return {
      primary_focus: this.determinePrimaryFocus(insights, analysis),
      secondary_focuses: this.determineSecondaryFocuses(insights, analysis),
      suggested_actions: this.generateFocusActions(insights, analysis)
    };
  }

  personalizeMotivation(motivation, userContext) {
    // Implementation for personalizing motivation message
    return {
      message: motivation,
      context_specific_additions: this.generateContextSpecificMotivation(userContext),
      achievement_reference: this.referenceRelevantAchievement(userContext)
    };
  }

  analyzeProgressTrends(progress) {
    // Implementation for analyzing progress trends
    return {
      overall_direction: this.calculateProgressDirection(progress),
      consistency: this.assessConsistency(progress),
      velocity: this.calculateProgressVelocity(progress)
    };
  }

  calculateDifficultyScore(factors) {
    // Implementation for calculating difficulty score
    return (factors.userExperience * 0.4) +
           (factors.suggestionComplexity * 0.4) +
           (factors.userPreferences * 0.2);
  }

  calculatePriority(item) {
    // Implementation for calculating priority
    return Math.random(); // Placeholder
  }

  estimateTimeToComplete(item) {
    // Implementation for estimating time to complete
    return '10 minutes'; // Placeholder
  }

  assessActionItemDifficulty(item) {
    // Implementation for assessing action item difficulty
    return 'medium'; // Placeholder
  }
}

module.exports = new HealthCoachService();
