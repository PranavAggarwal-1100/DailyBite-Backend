class ProgressCalculator {
    static calculateProgress(current, target, startValue) {
      const totalChange = target - startValue;
      const actualChange = current - startValue;
      const percentage = (actualChange / totalChange) * 100;
      
      return {
        percentage: Math.min(100, Math.max(0, percentage)),
        remaining: target - current,
        change: actualChange,
        status: this.getProgressStatus(percentage)
      };
    }
  
    static getProgressStatus(percentage) {
      if (percentage >= 100) return 'completed';
      if (percentage >= 75) return 'almost_there';
      if (percentage >= 50) return 'halfway';
      if (percentage >= 25) return 'getting_started';
      return 'just_began';
    }
  
    static calculateRate(dataPoints) {
      if (dataPoints.length < 2) return null;
  
      const changes = [];
      for (let i = 1; i < dataPoints.length; i++) {
        const timeDiff = dataPoints[i].date - dataPoints[i-1].date;
        const valueDiff = dataPoints[i].value - dataPoints[i-1].value;
        changes.push(valueDiff / (timeDiff / (1000 * 60 * 60 * 24))); // Change per day
      }
  
      return {
        current: changes[changes.length - 1],
        average: changes.reduce((a, b) => a + b, 0) / changes.length,
        trend: this.calculateTrend(changes)
      };
    }
  
    static calculateTrend(changes) {
      if (changes.length < 3) return 'insufficient_data';
  
      const recentAvg = changes.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const previousAvg = changes.slice(0, -3).reduce((a, b) => a + b, 0) / 
                         changes.slice(0, -3).length;
  
      if (recentAvg > previousAvg * 1.1) return 'accelerating';
      if (recentAvg < previousAvg * 0.9) return 'slowing';
      return 'steady';
    }
  
    static projectCompletion(current, target, rate) {
      if (!rate || !rate.current) return null;
  
      const remaining = target - current;
      const daysToComplete = remaining / rate.current;
  
      return {
        estimated_completion_date: new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000),
        days_remaining: Math.ceil(daysToComplete),
        confidence: this.calculateConfidence(rate)
      };
    }
  
    static calculateConfidence(rate) {
      // Calculate confidence based on rate consistency
      const variability = Math.abs(rate.current - rate.average) / rate.average;
      return Math.max(0, 100 - (variability * 100));
    }
  }
  
  module.exports = ProgressCalculator;
  