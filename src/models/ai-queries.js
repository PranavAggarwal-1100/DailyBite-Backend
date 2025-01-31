module.exports = (sequelize, DataTypes) => {
  const AIQueries = sequelize.define('AIQueries', {
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
    query_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    response_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    context: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('context');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('context', JSON.stringify(value));
      }
    },
    query_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['general', 'meal_analysis', 'recommendation', 'coach']]
      }
    },
    tokens_used: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'ai_queries',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'created_at']
      },
      {
        fields: ['query_type']
      }
    ]
  });

  return AIQueries;
};
