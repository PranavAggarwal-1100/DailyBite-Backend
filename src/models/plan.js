module.exports = (sequelize, DataTypes) => {
  const Plan = sequelize.define('Plan', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    max_logs_per_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1
      }
    },
    max_storage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: 'Storage limit in MB'
    },
    features: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('features');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('features', JSON.stringify(value));
      }
    },
    ai_queries_limit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      comment: 'Monthly AI query limit'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'plans',
    timestamps: true,
    paranoid: true
  });

  Plan.associate = (models) => {
    Plan.hasMany(models.User, { foreignKey: 'plan_id' });
  };

  return Plan;
};


