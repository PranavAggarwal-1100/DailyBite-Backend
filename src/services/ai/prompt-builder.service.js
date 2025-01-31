const { User, UserHealth, Allergies, Preferences } = require('../../models');
const logger = require('../../utils/logger');

class PromptBuilderService {
  async buildUserContext(userId) {
    try {
      const [user, health, allergies, preferences] = await Promise.all([
        User.findByPk(userId),
        UserHealth.findOne({ where: { userId }, order: [['createdAt', 'DESC']] }),
        Allergies.findAll({ where: { userId } }),
        Preferences.findAll({ where: { userId } })
      ]);

      return {
        demographics: {
          age: user.age,
          gender: user.gender,
          height: health.height,
          weight: health.weight,
          bmi: health.bmi,
          activityLevel: user.activityLevel
        },
        health: {
          conditions: health.conditions,
          medications: health.medications,
          allergies: allergies.map(a => a.allergen),
          intolerances: health.intolerances
        },
        dietary: {
          preferences: preferences.map(p => p.preference),
          restrictions: preferences.filter(p => p.type === 'restriction').map(p => p.preference),
          goals: user.nutritionalGoals
        }
      };
    } catch (error) {
      logger.error('Error building user context:', error);
      throw error;
    }
  }

  buildMealAnalysisPrompt(foodItems, userContext) {
    return {
      role: 'system',
      content: `Analyze the nutritional content and provide recommendations for a meal with the following context:
        User Profile:
        - Age: ${userContext.demographics.age}
        - Gender: ${userContext.demographics.gender}
        - BMI: ${userContext.demographics.bmi}
        - Activity Level: ${userContext.demographics.activityLevel}
        
        Health Considerations:
        - Conditions: ${userContext.health.conditions.join(', ')}
        - Allergies: ${userContext.health.allergies.join(', ')}
        
        Dietary Preferences:
        - Preferences: ${userContext.dietary.preferences.join(', ')}
        - Restrictions: ${userContext.dietary.restrictions.join(', ')}
        - Goals: ${userContext.dietary.goals.join(', ')}
        
        Please analyze the following meal:
        ${foodItems}
        
        Provide the following in a structured JSON format:
        1. Nutritional breakdown (calories, macros, key micros)
        2. Alignment with user's goals
        3. Health considerations
        4. Recommendations for improvement
        5. Alternative suggestions considering allergies/preferences`
    };
  }

  buildDayAnalysisPrompt(meals, userContext) {
    return {
      role: 'system',
      content: `Analyze the nutritional content and patterns for a full day of meals with the following context:
        ${this.formatUserContext(userContext)}
        
        Meals for the day:
        ${JSON.stringify(meals, null, 2)}
        
        Please provide in JSON format:
        1. Total daily nutritional breakdown
        2. Meal timing and spacing analysis
        3. Nutrient balance across meals
        4. Goal alignment analysis
        5. Recommendations for next day
        6. Areas of concern or improvement`
    };
  }

  buildMealClassificationPrompt(dayDescription, userContext) {
    return {
      role: 'system',
      content: `Classify and structure the following day's meals into appropriate categories (Breakfast, Lunch, Dinner, Snacks).
        ${this.formatUserContext(userContext)}
        
        Day's meals description:
        ${dayDescription}
        
        Please provide in JSON format:
        1. Structured meals with timing
        2. Food items per meal
        3. Portion estimates where possible
        4. Confidence level in classification`
    };
  }

  formatUserContext(userContext) {
    return `User Context:
      Demographics:
      - Age: ${userContext.demographics.age}
      - Gender: ${userContext.demographics.gender}
      - BMI: ${userContext.demographics.bmi}
      - Activity: ${userContext.demographics.activityLevel}
      
      Health:
      - Conditions: ${userContext.health.conditions.join(', ')}
      - Allergies: ${userContext.health.allergies.join(', ')}
      
      Dietary:
      - Preferences: ${userContext.dietary.preferences.join(', ')}
      - Restrictions: ${userContext.dietary.restrictions.join(', ')}
      - Goals: ${userContext.dietary.goals.join(', ')}`;
  }
}

module.exports = new PromptBuilderService();


