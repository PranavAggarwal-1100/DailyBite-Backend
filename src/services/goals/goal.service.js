const { Goal, User, Progress, NutrientGoals } = require('../../models');
const analysisService = require('../analysis/analysis.service');
const aiService = require('../ai/prompt-builder.service');
const notificationService = require('../notification/notification.service');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

class GoalService {
  async createGoal(userId, goalData) {
    try {
      // Validate and normalize goal data
      const normalizedGoal = await this.normalizeGoalData(goalData, userId);
      
      // Check for conflicting goals
      await this.checkConflictingGoals(userId, normalizedGoal);

      // Create main goal
      const goal = await Goal.create({
        user_id: userId,
        type: normalizedGoal.type,
        target: normalizedGoal.target,
        current: normalizedGoal.starting_point,
        deadline: normalizedGoal.deadline,
        status: 'active',
        metrics: JSON.stringify(normalizedGoal.metrics),
        milestones: JSON.stringify(this.generateMilestones(normalizedGoal)),
        tracking_frequency: normalizedGoal.tracking_frequency,
        reminders: JSON.stringify(normalizedGoal.reminders)
      });

      // Create associated nutrient goals if needed
      if (normalizedGoal.type === 'nutrition') {
        await this.createNutrientGoals(userId, normalizedGoal.nutrition_targets);
      }

      // Set up progress tracking
      await this.initializeGoalTracking(goal);

      return {
        goal,
        next_steps: await this.generateNextSteps(goal),
        recommendations: await this.getRecommendations(goal)
      };
    } catch (error) {
      logger.error('Error in createGoal:', error);
      throw error;
    }
  }

  async updateGoalProgress(goalId, progressData) {
    try {
      const goal = await Goal.findByPk(goalId, {
        include: [{ model: User }]
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      const previousProgress = JSON.parse(goal.progress || '{}');
      const newProgress = await this.calculateProgress(goal, progressData);

      // Check for milestone achievements
      const achievedMilestones = this.checkMilestones(
        previousProgress,
        newProgress,
        JSON.parse(goal.milestones)
      );

      // Update goal progress
      await goal.update({
        current: newProgress.current_value,
        progress: JSON.stringify(newProgress),
        last_tracked: new Date(),
        status: this.determineGoalStatus(newProgress, goal)
      });

      // Handle milestone achievements
      if (achievedMilestones.length > 0) {
        await this.handleMilestoneAchievements(goal, achievedMilestones);
      }

      // Check for goal completion
      if (newProgress.completion_percentage >= 100) {
        await this.handleGoalCompletion(goal);
      }

      return {
        previous_progress: previousProgress,
        current_progress: newProgress,
        achieved_milestones: achievedMilestones,
        recommendations: await this.getProgressBasedRecommendations(goal, newProgress)
      };
    } catch (error) {
      logger.error('Error in updateGoalProgress:', error);
      throw error;
    }
  }

  async analyzeGoalProgress(userId, goalType = null) {
    try {
      const whereClause = {
        user_id: userId,
        status: ['active', 'completed']
      };

      if (goalType) {
        whereClause.type = goalType;
      }

      const goals = await Goal.findAll({
        where: whereClause,
        order: [['created_at', 'DESC']]
      });

      const analysis = await Promise.all(goals.map(async goal => ({
        goal_id: goal.id,
        type: goal.type,
        progress: JSON.parse(goal.progress || '{}'),
        trends: await this.analyzeProgressTrends(goal),
        predictions: await this.generatePredictions(goal),
        recommendations: await this.getRecommendations(goal)
      })));

      return {
        overall_progress: this.calculateOverallProgress(analysis),
        goal_specific_analysis: analysis,
        summary: await this.generateProgressSummary(analysis)
      };
    } catch (error) {
      logger.error('Error in analyzeGoalProgress:', error);
      throw error;
    }
  }

  async adjustGoal(goalId, adjustments) {
    try {
      const goal = await Goal.findByPk(goalId);
      
      if (!goal) {
        throw new Error('Goal not found');
      }

      // Validate adjustments
      const validatedAdjustments = await this.validateAdjustments(
        goal,
        adjustments
      );

      // Update goal with new targets
      await goal.update({
        target: validatedAdjustments.new_target,
        deadline: validatedAdjustments.new_deadline,
        milestones: JSON.stringify(
          this.recalculateMilestones(goal, validatedAdjustments)
        )
      });

      // Generate new recommendations based on adjustments
      const recommendations = await this.getAdjustmentRecommendations(
        goal,
        validatedAdjustments
      );

      return {
        updated_goal: goal,
        adjustment_impact: this.calculateAdjustmentImpact(goal, validatedAdjustments),
        recommendations
      };
    } catch (error) {
      logger.error('Error in adjustGoal:', error);
      throw error;
    }
  }

  async generateNextSteps(goal) {
    const progress = JSON.parse(goal.progress || '{}');
    const milestones = JSON.parse(goal.milestones);

    // Find next milestone
    const nextMilestone = milestones.find(m => !m.achieved);

    const steps = await aiService.generateNextSteps({
      goal_type: goal.type,
      current_progress: progress,
      next_milestone: nextMilestone,
      user_context: await this.getUserContext(goal.user_id)
    });

    return steps.map(step => ({
      ...step,
      timeframe: this.estimateTimeframe(step, goal),
      difficulty: this.assessStepDifficulty(step, goal)
    }));
  }

  async calculateProgress(goal, progressData) {
    const progress = {
      timestamp: new Date(),
      current_value: progressData.value,
      change_since_last: progressData.value - goal.current,
      metrics: {}
    };

    switch (goal.type) {
      case 'weight':
        progress.metrics = await this.calculateWeightMetrics(goal, progressData);
        break;
      case 'nutrition':
        progress.metrics = await this.calculateNutritionMetrics(goal, progressData);
        break;
      case 'habit':
        progress.metrics = this.calculateHabitMetrics(goal, progressData);
        break;
    }

    progress.completion_percentage = this.calculateCompletionPercentage(
      progress.current_value,
      goal.target
    );

    return progress;
  }

  async analyzeProgressTrends(goal) {
    try {
      const progress = JSON.parse(goal.progress || '{}');
      const milestones = JSON.parse(goal.milestones);

      const progressHistory = await Progress.findAll({
        where: {
          user_id: goal.user_id,
          created_at: {
            [Op.gte]: goal.created_at
          }
        },
        order: [['created_at', 'ASC']]
      });

      const trends = {
        velocity: this.calculateProgressVelocity(progressHistory),
        consistency: this.analyzeConsistency(progressHistory),
        projected_completion: this.projectCompletion(progressHistory, goal),
        milestone_analysis: this.analyzeMilestoneProgress(milestones, progress),
        periodic_patterns: this.identifyPatterns(progressHistory)
      };

      // Enhance with AI insights
      const aiInsights = await aiService.analyzeProgressTrends({
        trends,
        goal_type: goal.type,
        user_context: await this.getUserContext(goal.user_id)
      });

      return {
        ...trends,
        insights: aiInsights,
        recommendations: this.generateTrendBasedRecommendations(trends)
      };
    } catch (error) {
      logger.error('Error in analyzeProgressTrends:', error);
      throw error;
    }
  }

  calculateProgressVelocity(progressHistory) {
    const dataPoints = progressHistory.map(p => ({
      value: p.value,
      timestamp: new Date(p.created_at).getTime()
    }));

    if (dataPoints.length < 2) return null;

    const velocities = [];
    for (let i = 1; i < dataPoints.length; i++) {
      const timeDiff = dataPoints[i].timestamp - dataPoints[i-1].timestamp;
      const valueDiff = dataPoints[i].value - dataPoints[i-1].value;
      velocities.push(valueDiff / (timeDiff / (1000 * 60 * 60 * 24))); // Change per day
    }

    return {
      current_velocity: velocities[velocities.length - 1],
      average_velocity: velocities.reduce((a, b) => a + b, 0) / velocities.length,
      trend: this.calculateVelocityTrend(velocities)
    };
  }

  calculateVelocityTrend(velocities) {
    if (velocities.length < 3) return 'insufficient_data';

    const recentVelocity = velocities.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousVelocity = velocities.slice(0, -3).reduce((a, b) => a + b, 0) / 
                            velocities.slice(0, -3).length;

    if (recentVelocity > previousVelocity * 1.1) return 'accelerating';
    if (recentVelocity < previousVelocity * 0.9) return 'decelerating';
    return 'stable';
  }

  analyzeConsistency(progressHistory) {
    const intervals = [];
    for (let i = 1; i < progressHistory.length; i++) {
      intervals.push(
        new Date(progressHistory[i].created_at) - 
        new Date(progressHistory[i-1].created_at)
      );
    }

    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - averageInterval, 2), 0) / 
                    intervals.length;

    return {
      consistency_score: this.calculateConsistencyScore(variance, averageInterval),
      logging_frequency: this.determineLoggingFrequency(averageInterval),
      missed_days: this.calculateMissedDays(intervals, averageInterval)
    };
  }

  calculateConsistencyScore(variance, averageInterval) {
    // Higher score means more consistent logging
    const normalizedVariance = variance / (averageInterval * averageInterval);
    return Math.max(0, 100 - (normalizedVariance * 100));
  }

  determineLoggingFrequency(averageInterval) {
    const intervalHours = averageInterval / (1000 * 60 * 60);
    
    if (intervalHours <= 24) return 'daily';
    if (intervalHours <= 48) return 'every_other_day';
    if (intervalHours <= 168) return 'weekly';
    return 'irregular';
  }

  calculateMissedDays(intervals, averageInterval) {
    const expectedInterval = Math.round(averageInterval / (1000 * 60 * 60 * 24)) * 
                           (1000 * 60 * 60 * 24);
    return intervals.filter(interval => interval > expectedInterval * 1.5).length;
  }

  projectCompletion(progressHistory, goal) {
    const velocity = this.calculateProgressVelocity(progressHistory);
    if (!velocity || !velocity.current_velocity) return null;

    const remaining = goal.target - progressHistory[progressHistory.length - 1].value;
    const daysToCompletion = remaining / velocity.current_velocity;

    return {
      estimated_completion_date: new Date(Date.now() + daysToCompletion * 24 * 60 * 60 * 1000),
      days_remaining: Math.ceil(daysToCompletion),
      confidence_score: this.calculateProjectionConfidence(velocity, goal)
    };
  }

  calculateProjectionConfidence(velocity, goal) {
    const factors = {
      velocity_stability: this.assessVelocityStability(velocity),
      progress_consistency: this.assessProgressConsistency(goal),
      time_remaining: this.assessTimeRemaining(goal)
    };

    return Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;
  }

  async handleMilestoneAchievements(goal, achievedMilestones) {
    try {
      // Update milestone status
      const milestones = JSON.parse(goal.milestones);
      achievedMilestones.forEach(achieved => {
        const milestone = milestones.find(m => m.id === achieved.id);
        if (milestone) {
          milestone.achieved = true;
          milestone.achieved_at = new Date();
        }
      });

      await goal.update({
        milestones: JSON.stringify(milestones)
      });

      // Send notifications
      await Promise.all(achievedMilestones.map(milestone =>
        notificationService.sendNotification(goal.user_id, {
          type: 'milestone_achievement',
          title: 'Milestone Achieved! 🎉',
          message: `Congratulations! You've reached: ${milestone.name}`,
          data: {
            goal_id: goal.id,
            milestone_id: milestone.id,
            achievement_context: this.getAchievementContext(milestone, goal)
          }
        })
      ));

      // Generate celebration content
      const celebrationContent = await this.generateCelebrationContent(
        achievedMilestones,
        goal
      );

      return {
        updated_milestones: milestones,
        celebration_content: celebrationContent,
        next_milestone: this.getNextMilestone(milestones)
      };
    } catch (error) {
      logger.error('Error in handleMilestoneAchievements:', error);
      throw error;
    }
  }

  getAchievementContext(milestone, goal) {
    return {
      milestone_difficulty: milestone.difficulty,
      progress_context: {
        total_progress: Math.round((goal.current / goal.target) * 100),
        milestone_sequence: milestone.sequence,
        remaining_milestones: this.getRemainingMilestones(goal).length
      },
      achievement_rarity: this.calculateAchievementRarity(milestone),
      personalized_message: this.generatePersonalizedMessage(milestone, goal)
    };
  }

  async generateCelebrationContent(milestones, goal) {
    const userContext = await this.getUserContext(goal.user_id);
    
    const content = {
      badges: milestones.map(m => this.generateBadge(m)),
      motivation_message: await aiService.generateCelebrationMessage({
        milestones,
        goal_context: goal,
        user_context: userContext
      }),
      sharing_content: this.generateSharingContent(milestones, goal),
      next_challenge: await this.suggestNextChallenge(goal)
    };

    return content;
  }

  generateBadge(milestone) {
    return {
      name: milestone.name,
      icon: this.getBadgeIcon(milestone),
      color_scheme: this.getBadgeColorScheme(milestone),
      description: milestone.description,
      rarity: this.calculateBadgeRarity(milestone)
    };
  }

  async suggestNextChallenge(goal) {
    // Implementation for suggesting next challenge
    return null; // Placeholder
  }
}

module.exports = new GoalService();
