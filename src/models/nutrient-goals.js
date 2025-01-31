module.exports = (sequelize, DataTypes) => {
  const NutrientGoals = sequelize.define('NutrientGoals', {
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
    nutrient: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    daily_target: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['macro', 'micro', 'other']]
      }
    }
  }, {
    tableName: 'nutrient_goals',
    timestamps: true
  });

  return NutrientGoals;
};

