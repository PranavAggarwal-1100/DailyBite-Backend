module.exports = (sequelize, DataTypes) => {
  const MealPlan = sequelize.define('MealPlan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    plan_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    meals: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('meals');
        return rawValue ? JSON.parse(rawValue) : {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };
      },
      set(value) {
        this.setDataValue('meals', JSON.stringify(value));
      }
    },
    nutritional_targets: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('nutritional_targets');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('nutritional_targets', JSON.stringify(value));
      }
    },
    adherence_rate: {
      type: DataTypes.DECIMAL(5, 2),
      validate: {
        min: 0,
        max: 100
      }
    },
    ai_recommendations: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('ai_recommendations');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('ai_recommendations', JSON.stringify(value));
      }
    },
    is_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'meal_plans',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'plan_date']
      }
    ]
  });

  return MealPlan;
};


