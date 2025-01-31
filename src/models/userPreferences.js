module.exports = (sequelize, DataTypes) => {
    const UserPreferences = sequelize.define('UserPreferences', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      meal_reminders: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      progress_updates: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      push_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      email_notifications: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      language: {
        type: DataTypes.STRING(5),
        defaultValue: 'en'
      },
      measurement_unit: {
        type: DataTypes.STRING(10),
        defaultValue: 'metric',
        validate: {
          isIn: [['metric', 'imperial']]
        }
      },
      theme: {
        type: DataTypes.STRING(10),
        defaultValue: 'light',
        validate: {
          isIn: [['light', 'dark', 'system']]
        }
      }
    }, {
      tableName: 'user_preferences',
      timestamps: true
    });
  
    UserPreferences.associate = function(models) {
      UserPreferences.belongsTo(models.User, { foreignKey: 'user_id' });
    };
  
    return UserPreferences;
  };
  