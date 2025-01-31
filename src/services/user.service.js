const { User, UserPreferences, Progress } = require('../models');
const logger = require('../utils/logger');

class UserService {
  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] },
        include: [{
          model: UserPreferences,
          as: 'preferences'
        }]
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Error in getProfile:', error);
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Update user data
      await user.update(updateData);

      // Return updated user without password
      const updatedUser = await this.getProfile(userId);
      return updatedUser;
    } catch (error) {
      logger.error('Error in updateProfile:', error);
      throw error;
    }
  }

  async updatePreferences(userId, preferences) {
    try {
      const [userPreferences] = await UserPreferences.findOrCreate({
        where: { user_id: userId }
      });

      await userPreferences.update(preferences);
      return userPreferences;
    } catch (error) {
      logger.error('Error in updatePreferences:', error);
      throw error;
    }
  }

  async updateAvatar(userId, file) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Assuming file is processed and stored, and you have the URL
      const avatarUrl = `/uploads/avatars/${file.filename}`;
      await user.update({ avatar_url: avatarUrl });

      return { avatar_url: avatarUrl };
    } catch (error) {
      logger.error('Error in updateAvatar:', error);
      throw error;
    }
  }

  async getUserStats(userId) {
    try {
      const stats = {
        meal_logs: 0,
        streak: 0,
        achievements: [],
        progress: {}
      };

      // Get latest progress
      const latestProgress = await Progress.findOne({
        where: { user_id: userId },
        order: [['created_at', 'DESC']]
      });

      if (latestProgress) {
        stats.progress = latestProgress;
      }

      return stats;
    } catch (error) {
      logger.error('Error in getUserStats:', error);
      throw error;
    }
  }

  async completeOnboarding(userId, onboardingData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update user profile with onboarding data
      const profileUpdates = {
        dietary_preferences: onboardingData.dietary_info.preferences,
        health_conditions: onboardingData.health_info.conditions,
        goals: onboardingData.goals
      };

      await user.update(profileUpdates);

      // Create initial preferences
      await this.updatePreferences(userId, {
        meal_reminders: true,
        progress_updates: true
      });

      return {
        message: 'Onboarding completed successfully',
        profile: await this.getProfile(userId)
      };
    } catch (error) {
      logger.error('Error in completeOnboarding:', error);
      throw error;
    }
  }

  async getProgressHistory(userId, startDate, endDate) {
    try {
      const where = { user_id: userId };
      
      if (startDate) where.created_at = { [Op.gte]: startDate };
      if (endDate) where.created_at = { ...where.created_at, [Op.lte]: endDate };

      const progress = await Progress.findAll({
        where,
        order: [['created_at', 'ASC']]
      });

      return progress;
    } catch (error) {
      logger.error('Error in getProgressHistory:', error);
      throw error;
    }
  }

  async submitFeedback(userId, feedbackData) {
    try {
      // Implementation depends on your feedback storage solution
      logger.info('Feedback received:', { userId, ...feedbackData });
      return {
        message: 'Feedback submitted successfully',
        ticket_id: Date.now() // You might want to generate a proper ticket ID
      };
    } catch (error) {
      logger.error('Error in submitFeedback:', error);
      throw error;
    }
  }

  async deleteAccount(userId, deleteData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Log deletion reason if provided
      if (deleteData.reason) {
        logger.info('Account deletion reason:', {
          userId,
          reason: deleteData.reason
        });
      }

      // Perform soft delete
      await user.destroy();

      return { message: 'Account deleted successfully' };
    } catch (error) {
      logger.error('Error in deleteAccount:', error);
      throw error;
    }
  }
}

module.exports = new UserService();