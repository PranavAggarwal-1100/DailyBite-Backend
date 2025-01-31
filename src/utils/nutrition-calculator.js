class NutritionCalculator {
    static calculateBMR(weight, height, age, gender) {
      // Mifflin-St Jeor Equation
      if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
      }
      return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
  
    static calculateTDEE(bmr, activityLevel) {
      const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      return bmr * (activityMultipliers[activityLevel] || 1.2);
    }
  
    static calculateMacroSplit(calories, goal) {
      const macroSplits = {
        weightLoss: {
          protein: 0.4,
          carbs: 0.3,
          fats: 0.3
        },
        maintenance: {
          protein: 0.3,
          carbs: 0.4,
          fats: 0.3
        },
        muscleGain: {
          protein: 0.3,
          carbs: 0.5,
          fats: 0.2
        }
      };
  
      const split = macroSplits[goal] || macroSplits.maintenance;
      return {
        protein: Math.round((calories * split.protein) / 4),
        carbs: Math.round((calories * split.carbs) / 4),
        fats: Math.round((calories * split.fats) / 9)
      };
    }
  
    static calculateNutrientDeficits(consumed, recommended) {
      const deficits = {};
      Object.keys(recommended).forEach(nutrient => {
        const actual = consumed[nutrient] || 0;
        const target = recommended[nutrient];
      if (actual < target) {
        deficits[nutrient] = {
          target,
          actual,
          deficit: target - actual,
          percentage: Math.round((actual / target) * 100)
        };
      }
    });
    return deficits;
  }

  static assessMealBalance(nutrients) {
    const idealRatios = {
      protein: { min: 0.2, max: 0.35 },
      carbs: { min: 0.45, max: 0.65 },
      fats: { min: 0.2, max: 0.35 }
    };

    const total = nutrients.protein + nutrients.carbs + nutrients.fats;
    const ratios = {
      protein: nutrients.protein / total,
      carbs: nutrients.carbs / total,
      fats: nutrients.fats / total
    };

    const assessment = {};
    Object.keys(idealRatios).forEach(macro => {
      const actual = ratios[macro];
      const ideal = idealRatios[macro];
      assessment[macro] = {
        ratio: actual,
        status: actual < ideal.min ? 'low' : actual > ideal.max ? 'high' : 'optimal',
        recommendation: this.getMacroRecommendation(macro, actual, ideal)
      };
    });

    return assessment;
  }

  static getMacroRecommendation(macro, actual, ideal) {
    if (actual < ideal.min) {
      return `Increase ${macro} intake to reach at least ${ideal.min * 100}% of total calories`;
    }
    if (actual > ideal.max) {
      return `Reduce ${macro} intake to stay below ${ideal.max * 100}% of total calories`;
    }
    return `Maintain current ${macro} intake`;
  }
}

module.exports = NutritionCalculator;

  