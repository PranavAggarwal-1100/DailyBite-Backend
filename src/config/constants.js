module.exports = {
  MEAL_TYPES: ['breakfast', 'lunch', 'dinner', 'snack'],
  ACTIVITY_LEVELS: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
  GOAL_TYPES: ['weight', 'nutrition', 'habits', 'measurements'],
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_DURATIONS: {
    NUTRITION_ANALYSIS: 3600, // 1 hour
    MEAL_SUGGESTIONS: 7200,   // 2 hours
    USER_STATS: 1800,        // 30 minutes
    LEADERBOARD: 300         // 5 minutes
  },
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    IMAGE_QUALITY: 90
  },
  AI_MODELS: {
    NUTRITION_ANALYSIS: 'gpt-4',
    MEAL_PLANNING: 'gpt-4',
    HEALTH_COACH: 'gpt-4',
    IMAGE_ANALYSIS: 'gpt-4-vision-preview'
  }
};
