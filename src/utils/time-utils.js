class TimeUtils {
    static getMealTypeFromTime(hour) {
      if (hour >= 5 && hour < 10) return 'breakfast';
      if (hour >= 10 && hour < 15) return 'lunch';
      if (hour >= 15 && hour < 18) return 'snack';
      if (hour >= 18 && hour < 22) return 'dinner';
      return 'snack';
    }
  
    static getDateRange(period) {
      const now = new Date();
      const startDate = new Date();
  
      switch (period) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }
  
      return { startDate, endDate: now };
    }
  
    static calculateStreak(dates) {
      if (!dates.length) return 0;
      
      let currentStreak = 1;
      const sortedDates = [...dates].sort((a, b) => b - a);
      const today = new Date().setHours(0, 0, 0, 0);
  
      // Check if the streak is still active (last date is today or yesterday)
      const lastDate = new Date(sortedDates[0]).setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (daysDiff > 1) return 0;
  
      // Calculate streak
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i-1]).setHours(0, 0, 0, 0);
        const prev = new Date(sortedDates[i]).setHours(0, 0, 0, 0);
        const diff = Math.floor((curr - prev) / (1000 * 60 * 60 * 24));
        
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
  
      return currentStreak;
    }
  }
  
  module.exports = TimeUtils;
  
  