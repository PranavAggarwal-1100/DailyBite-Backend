module.exports = (sequelize, DataTypes) => {
  const Progress = sequelize.define('Progress', {
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    calorie_intake: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    nutrient_deficits: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('nutrient_deficits');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('nutrient_deficits', JSON.stringify(value));
      }
    },
    daily_analysis: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('daily_analysis');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('daily_analysis', JSON.stringify(value));
      }
    },
    recommendations: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('recommendations');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('recommendations', JSON.stringify(value));
      }
    }
  }, {
    tableName: 'progress',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'date']
      }
    ]
  });

  return Progress;
};
