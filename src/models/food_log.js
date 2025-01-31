module.exports = (sequelize, DataTypes) => {
  const FoodLog = sequelize.define('FoodLog', {
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
    log_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    meal_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['breakfast', 'lunch', 'dinner', 'snack']]
      }
    },
    food_item: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    portion_size: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    preparation: {
      type: DataTypes.STRING(50)
    },
    calories: {
      type: DataTypes.DECIMAL(10, 2),
      validate: {
        min: 0
      }
    },
    macronutrients: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('macronutrients');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('macronutrients', JSON.stringify(value));
      }
    },
    micronutrients: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('micronutrients');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('micronutrients', JSON.stringify(value));
      }
    },
    image_url: {
      type: DataTypes.STRING(255),
      validate: {
        isUrl: true
      }
    },
    ai_analysis: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('ai_analysis');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('ai_analysis', JSON.stringify(value));
      }
    },
    source_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'manual',
      validate: {
        isIn: [['manual', 'photo', 'voice', 'ai']]
      }
    }
  }, {
    tableName: 'food_logs',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'log_date']
      },
      {
        fields: ['user_id', 'meal_type']
      }
    ]
  });

  return FoodLog;
};
