const { Notification, User, UserPreferences } = require('../../models');
const healthCoachService = require('../coach/health-coach.service');
const analysisService = require('../analysis/analysis.service');
const logger = require('../../utils/logger');

class NotificationService {
  async sendMealReminder(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserPreferences }]
      });

      if (!user.UserPreferences?.meal_reminders) {
        return;
      }

      const hour = new Date().getHours();
      let mealType;

      // Determine meal type based on time
      if (hour >= 6 && hour < 10) mealType = 'breakfast';
      else if (hour >= 11 && hour < 14) mealType = 'lunch';
      else if (hour >= 17 && hour < 20) mealType = 'dinner';
      else return; // Don't send reminders outside meal times

      // Check if meal already logged
      const todaysMeals = await analysisService.getDailyAnalysis(userId, new Date());
      if (todaysMeals.meal_timing.meal_distribution[mealType].length > 0) {
        return; // Meal already logged
      }

      // Create reminder notification
      await Notification.create({
        user_id: userId,
        type: 'reminder',
        message: `Time to log your ${mealType}! Keep up the great tracking habit!`,
        priority: 'normal',
        data: {
          meal_type: mealType,
          action: 'log_meal',
          deep_link: `/meal-log/${mealType}`
        }
      });

      // Send push notification if enabled
      if (user.UserPreferences?.push_notifications) {
        await this.sendPushNotification(user.device_token, {
          title: 'Meal Logging Reminder',
          body: `Time to log your ${mealType}!`,
          data: {
            type: 'meal_reminder',
            meal_type: mealType
          }
        });
      }
    } catch (error) {
      logger.error('Error in sendMealReminder:', error);
      throw error;
    }
  }

  async sendProgressUpdate(userId) {
    try {
      const [weeklyReport, user] = await Promise.all([
        healthCoachService.generateWeeklyReport(userId),
        User.findByPk(userId, { include: [{ model: UserPreferences }] })
      ]);

      if (!user.UserPreferences?.progress_updates) {
        return;
      }

      // Create progress notification
      const notification = await Notification.create({
        user_id: userId,
        type: 'progress',
        message: this.formatProgressMessage(weeklyReport),
        priority: 'high',
        data: {
          report: weeklyReport,
          action: 'view_report',
          deep_link: '/progress/weekly'
        }
      });

      // Send push notification if enabled
      if (user.UserPreferences?.push_notifications) {
        await this.sendPushNotification(user.device_token, {
          title: 'Weekly Progress Update',
          body: this.formatProgressMessage(weeklyReport, true),
          data: {
            type: 'progress_update',
            notification_id: notification.id
          }
        });
      }
    } catch (error) {
      logger.error('Error in sendProgressUpdate:', error);
      throw error;
    }
  }

  async sendHealthTips(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserPreferences }]
      });

      if (!user.UserPreferences?.health_tips) {
        return;
      }

      const userContext = await analysisService.getUserContext(userId);
      const motivation = await healthCoachService.getMotivationalContent(userId);

      // Create health tip notification
      const notification = await Notification.create({
        user_id: userId,
        type: 'health_tip',
        message: motivation.daily_tip,
        priority: 'low',
        data: {
          tip: motivation.daily_tip,
          action: 'view_tip',
          deep_link: '/tips'
        }
      });

      // Send push notification if enabled
      if (user.UserPreferences?.push_notifications) {
        await this.sendPushNotification(user.device_token, {
          title: 'Daily Health Tip',
          body: motivation.daily_tip,
          data: {
            type: 'health_tip',
            notification_id: notification.id
          }
        });
      }
    } catch (error) {
      logger.error('Error in sendHealthTips:', error);
      throw error;
    }
  }

  async sendGoalAchievementNotification(userId, achievementType) {
    try {
      const user = await User.findByPk(userId, {
        include: [{ model: UserPreferences }]
      });

      const achievementMessages = {
        weight_goal: {
          title: 'Goal Achieved! 🎉',
          message: 'Congratulations! You\'ve reached your weight goal!'
        },
        streak: {
          title: 'Streak Achievement! 🔥',
          message: 'Amazing! You\'ve maintained your logging streak!'
        },
        nutrition: {
          title: 'Nutrition Goal Met! 🥗',
          message: 'Great job meeting your nutritional goals!'
        }
      };

      const achievement = achievementMessages[achievementType];

      const notification = await Notification.create({
        user_id: userId,
        type: 'achievement',
        message: achievement.message,
        priority: 'high',
        data: {
          achievement_type: achievementType,
          action: 'view_achievements',
          deep_link: '/achievements'
        }
      });

      if (user.UserPreferences?.push_notifications) {
        await this.sendPushNotification(user.device_token, {
          title: achievement.title,
          body: achievement.message,
          data: {
            type: 'achievement',
            notification_id: notification.id
          }
        });
      }
    } catch (error) {
      logger.error('Error in sendGoalAchievementNotification:', error);
      throw error;
    }
  }

  formatProgressMessage(weeklyReport, isShort = false) {
    if (isShort) {
      return `You've ${weeklyReport.achievements.length > 0 ? 'achieved ' + weeklyReport.achievements.length + ' goals' : 'made progress'} this week!`;
    }

    let message = 'Weekly Progress Update:\n';
    if (weeklyReport.achievements.length > 0) {
      message += `\n🎉 Achievements:\n${weeklyReport.achievements.map(a => `- ${a.message}`).join('\n')}`;
    }
    if (weeklyReport.areas_for_improvement.length > 0) {
      message += `\n\n💪 Focus Areas:\n${weeklyReport.areas_for_improvement.map(a => `- ${a.improvement_suggestion}`).join('\n')}`;
    }
    return message;
  }

  async sendPushNotification(deviceToken, notification) {
    try {
      // Implementation would depend on your push notification service (FCM, APNS, etc.)
      // This is a placeholder for the actual implementation
      await pushNotificationService.send(deviceToken, notification);
    } catch (error) {
      logger.error('Error sending push notification:', error);
      // Don't throw error as push notification failure shouldn't break the flow
    }
  }
}

module.exports = new NotificationService();