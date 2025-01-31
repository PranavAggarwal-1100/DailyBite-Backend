const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    age: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0,
        max: 120
      }
    },
    gender: {
      type: DataTypes.STRING(10),
      validate: {
        isIn: [['male', 'female', 'other', 'prefer_not_to_say']]
      }
    },
    activity_level: {
      type: DataTypes.STRING(50),
      validate: {
        isIn: [['sedentary', 'light', 'moderate', 'active', 'very_active']]
      }
    },
    height: {
      type: DataTypes.FLOAT,
      validate: {
        min: 0
      }
    },
    weight: {
      type: DataTypes.FLOAT,
      validate: {
        min: 0
      }
    },
    dietary_preferences: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('dietary_preferences');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('dietary_preferences', JSON.stringify(value));
      }
    },
    health_conditions: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('health_conditions');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('health_conditions', JSON.stringify(value));
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    }
  });

  // Instance methods
  User.prototype.validatePassword = async function(password) {
    return bcrypt.compare(password, this.password);
  };

  // Define all associations in the associate function
  User.associate = function(models) {
    // UserPreferences association
    User.hasOne(models.UserPreferences, { foreignKey: 'user_id' });

    // Other associations
    if (models.FoodLog) {
      User.hasMany(models.FoodLog, { foreignKey: 'user_id' });
    }
    if (models.NutrientGoals) {
      User.hasMany(models.NutrientGoals, { foreignKey: 'user_id' });
    }
    if (models.Progress) {
      User.hasMany(models.Progress, { foreignKey: 'user_id' });
    }
    if (models.MealPlan) {
      User.hasMany(models.MealPlan, { foreignKey: 'user_id' });
    }
    if (models.Allergen) {
      User.hasMany(models.Allergen, { foreignKey: 'user_id' });
    }
  };

  return User;
};