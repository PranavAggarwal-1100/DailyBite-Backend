module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['reminder', 'alert', 'recommendation', 'achievement', 'system']]
      }
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal',
      validate: {
        isIn: [['low', 'normal', 'high', 'urgent']]
      }
    },
    data: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('data');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('data', JSON.stringify(value));
      }
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'is_read']
      },
      {
        fields: ['user_id', 'created_at']
      }
    ]
  });

  return Notification;
};


