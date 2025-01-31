const { Challenge, UserChallenge, User, Progress } = require('../../models');
const analysisService = require('../analysis/analysis.service');
const notificationService = require('../notification/notification.service');
const logger = require('../../utils/logger');
const { Op } = require('sequelize');

class ChallengeService {
  async createChallenge({
    name,
    description,
    duration,
    type,
    goals,
    rewards,
    requirements,
    startDate = new Date(),
    category = 'nutrition'
  }) {
    try {
      // Validate challenge parameters
      this.validateChallengeParams({ name, duration, type, goals });

      const challenge = await Challenge.create({
        name,
        description,
        duration,
        type,
        category,
        goals: JSON.stringify(goals),
        rewards: JSON.stringify(rewards),
        requirements: JSON.stringify(requirements),
        start_date: startDate,
        end_date: new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000),
        status: 'active'
      });

      // Find eligible users
      const eligibleUsers = await this.findEligibleUsers(challenge);
      
      // Create user challenges
      await Promise.all(
        eligibleUsers.map(user =>
          UserChallenge.create({
            user_id: user.id,
            challenge_id: challenge.id,
            status: 'invited',
            progress: JSON.stringify({
              started: false,
              metrics: {},
              milestones: [],
              completion: 0
            })
          })
        )
      );

      // Notify eligible users
      await this.notifyEligibleUsers(eligibleUsers, challenge);

      return {
        challenge,
        eligible_users_count: eligibleUsers.length
      };
    } catch (error) {
      logger.error('Error in createChallenge:', error);
      throw error;
    }
  }

  async joinChallenge(userId, challengeId) {
    try {
      const [userChallenge, challenge] = await Promise.all([
        UserChallenge.findOne({
          where: { user_id: userId, challenge_id: challengeId }
        }),
        Challenge.findByPk(challengeId)
      ]);

      if (!userChallenge) {
        throw new Error('User not eligible for this challenge');
      }

      if (challenge.start_date < new Date()) {
        throw new Error('Challenge has already started');
      }

      // Initialize user's challenge progress
      const initialProgress = await this.initializeProgress(userId, challenge);

      await userChallenge.update({
        status: 'active',
        joined_at: new Date(),
        progress: JSON.stringify(initialProgress)
      });

      // Set up progress tracking
      await this.setupProgressTracking(userChallenge);

      return {
        userChallenge,
        initial_progress: initialProgress
      };
    } catch (error) {
      logger.error('Error in joinChallenge:', error);
      throw error;
    }
  }

  async trackProgress(userId, challengeId) {
    try {
      const userChallenge = await UserChallenge.findOne({
        where: { 
          user_id: userId, 
          challenge_id: challengeId,
          status: 'active'
        },
        include: [{ model: Challenge }]
      });

      if (!userChallenge) {
        throw new Error('No active challenge found');
      }

      const currentProgress = JSON.parse(userChallenge.progress);
      const newProgress = await this.calculateProgress(userChallenge);

      // Check for milestone achievements
      const newMilestones = this.checkMilestones(currentProgress, newProgress);
      if (newMilestones.length > 0) {
        await this.handleMilestones(userId, newMilestones);
      }

      // Update progress
      await userChallenge.update({
        progress: JSON.stringify({
          ...newProgress,
          milestones: [...currentProgress.milestones, ...newMilestones]
        })
      });

      // Check for challenge completion
      if (newProgress.completion >= 100) {
        await this.completeChallenge(userChallenge);
      }

      return {
        previous_progress: currentProgress,
        current_progress: newProgress,
        new_milestones: newMilestones,
        completion_status: newProgress.completion >= 100 ? 'completed' : 'in_progress'
      };
    } catch (error) {
      logger.error('Error in trackProgress:', error);
      throw error;
    }
  }

  async getLeaderboard(challengeId) {
    try {
      const userChallenges = await UserChallenge.findAll({
        where: { 
          challenge_id: challengeId,
          status: ['active', 'completed']
        },
        include: [{ 
          model: User,
          attributes: ['id', 'name', 'avatar_url']
        }]
      });

      const leaderboard = userChallenges
        .map(uc => ({
          user: {
            id: uc.User.id,
            name: uc.User.name,
            avatar_url: uc.User.avatar_url
          },
          progress: JSON.parse(uc.progress),
          score: this.calculateScore(JSON.parse(uc.progress)),
          rank: null // To be calculated
        }))
        .sort((a, b) => b.score - a.score);

      // Assign ranks
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

      return {
        leaderboard,
        total_participants: leaderboard.length,
        last_updated: new Date(),
        top_performers: leaderboard.slice(0, 3)
      };
    } catch (error) {
      logger.error('Error in getLeaderboard:', error);
      throw error;
    }
  }

  async calculateProgress(userChallenge) {
    const challenge = userChallenge.Challenge;
    const goals = JSON.parse(challenge.goals);
    const progress = { metrics: {} };

    switch (challenge.type) {
      case 'nutrition':
        progress.metrics = await this.calculateNutritionProgress(
          userChallenge.user_id,
          goals,
          challenge.start_date
        );
        break;

      case 'logging_streak':
        progress.metrics = await this.calculateStreakProgress(
          userChallenge.user_id,
          goals,
          challenge.start_date
        );
        break;

      case 'balanced_meals':
        progress.metrics = await this.calculateBalancedMealsProgress(
          userChallenge.user_id,
          goals,
          challenge.start_date
        );
        break;

      case 'weight_management':
        progress.metrics = await this.calculateWeightProgress(
          userChallenge.user_id,
          goals,
          challenge.start_date
        );
        break;
    }

    progress.completion = this.calculateCompletionPercentage(
      progress.metrics,
      goals
    );

    progress.timestamp = new Date();

    return progress;
  }

  async calculateNutritionProgress(userId, goals, startDate) {
    const analysis = await analysisService.getPeriodAnalysis(
      userId,
      startDate,
      new Date()
    );

    return {
      calories_adherence: analysis.trends.calorie_adherence,
      nutrient_goals_met: analysis.trends.nutrient_goals_met,
      healthy_choices: analysis.trends.healthy_choices_percentage,
      meal_logging_consistency: analysis.trends.logging_consistency,
      balanced_meals_percentage: analysis.trends.balanced_meals_percentage
    };
  }

  async calculateStreakProgress(userId, goals, startDate) {
    const logs = await FoodLog.findAll({
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: startDate
        }
      },
      order: [['created_at', 'ASC']]
    });

    const streakData = this.analyzeStreak(logs);

    return {
      current_streak: streakData.currentStreak,
      longest_streak: streakData.longestStreak,
      total_logs: logs.length,
      consistency_score: streakData.consistencyScore
    };
  }

  analyzeStreak(logs) {
    let currentStreak = 0;
    let longestStreak = 0;
    let consistencyScore = 0;

    // Group logs by date
    const logsByDate = new Map();
    logs.forEach(log => {
      const date = new Date(log.created_at).toDateString();
      if (!logsByDate.has(date)) {
        logsByDate.set(date, []);
      }
      logsByDate.get(date).push(log);
    });

    // Calculate streaks
    let streak = 0;
    const dates = Array.from(logsByDate.keys()).sort();
    
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const previousDate = i > 0 ? new Date(dates[i-1]) : null;

      if (!previousDate || 
          (currentDate - previousDate) / (1000 * 60 * 60 * 24) === 1) {
        streak++;
        if (streak > longestStreak) {
          longestStreak = streak;
        }
      } else {
        streak = 1;
      }
    }
    currentStreak = streak;

    // Calculate consistency score (0-100)
    const totalDays = (new Date() - new Date(dates[0])) / (1000 * 60 * 60 * 24);
    consistencyScore = (logsByDate.size / totalDays) * 100;

    return {
      currentStreak,
      longestStreak,
      consistencyScore: Math.round(consistencyScore)
    };
  }

  calculateCompletionPercentage(metrics, goals) {
    const completionScores = Object.entries(goals).map(([key, goal]) => {
      const current = metrics[key] || 0;
      const target = goal.target;
      return (current / target) * 100;
    });

    return Math.min(
      100,
      completionScores.reduce((acc, score) => acc + score, 0) / completionScores.length
    );
  }

  async findEligibleUsers(challenge) {
    const requirements = JSON.parse(challenge.requirements);
    const users = await User.findAll({
      include: [
        {
          model: Progress,
          required: true,
          order: [['created_at', 'DESC']],
          limit: 1
        }
      ]
    });

    return users.filter(user => 
      this.meetsRequirements(user, requirements) &&
      !this.hasConflictingChallenges(user.id, challenge)
    );
  }

  async setupProgressTracking(userChallenge) {
    // Schedule regular progress updates
    const challenge = userChallenge.Challenge;
    const tracking = {
      frequency: this.determineTrackingFrequency(challenge.type),
      metrics: this.identifyTrackingMetrics(challenge.goals),
      notifications: this.setupTrackingNotifications(challenge.duration)
    };

    await UserChallenge.update({
      tracking_config: JSON.stringify(tracking)
    }, {
      where: { id: userChallenge.id }
    });

    return tracking;
  }

  determineTrackingFrequency(challengeType) {
    const frequencies = {
      nutrition: 'daily',
      logging_streak: 'daily',
      balanced_meals: 'daily',
      weight_management: 'weekly'
    };
    return frequencies[challengeType] || 'daily';
  }

  async notifyEligibleUsers(users, challenge) {
    await Promise.all(users.map(user =>
      notificationService.sendNotification(user.id, {
        type: 'challenge_invitation',
        title: 'New Challenge Available!',
        message: `You've been invited to join the "${challenge.name}" challenge!`,
        data: {
          challenge_id: challenge.id,
          type: challenge.type,
          duration: challenge.duration
        }
      })
    ));
  }

  async handleMilestones(userId, milestones) {
    await Promise.all(milestones.map(milestone =>
      notificationService.sendNotification(userId, {
        type: 'challenge_milestone',
        title: 'Milestone Achieved! 🎉',
        message: `Congratulations! You've achieved: ${milestone.name}`,
        data: { milestone }
      })
    ));
  }

  meetsRequirements(user, requirements) {
    // Implementation for checking if user meets challenge requirements
    return true; // Placeholder
  }

  hasConflictingChallenges(userId, newChallenge) {
    // Implementation for checking conflicting challenges
    return false; // Placeholder
  }
}

module.exports = new ChallengeService();