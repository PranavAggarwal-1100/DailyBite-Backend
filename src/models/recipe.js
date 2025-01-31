module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define('Recipe', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    ingredients: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('ingredients');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('ingredients', JSON.stringify(value));
      }
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    nutritional_info: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('nutritional_info');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('nutritional_info', JSON.stringify(value));
      }
    },
    cultural_origin: {
      type: DataTypes.STRING(100)
    },
    seasonality: {
      type: DataTypes.STRING(100)
    },
    preparation_time: {
      type: DataTypes.INTEGER,
      comment: 'Time in minutes'
    },
    difficulty_level: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: [['easy', 'medium', 'hard']]
      }
    },
    tags: {
      type: DataTypes.TEXT,
      get() {
        const rawValue = this.getDataValue('tags');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('tags', JSON.stringify(value));
      }
    },
    image_url: {
      type: DataTypes.STRING(255),
      validate: {
        isUrl: true
      }
    }
  }, {
    tableName: 'recipes',
    timestamps: true,
    indexes: [
      {
        fields: ['cultural_origin']
      },
      {
        fields: ['seasonality']
      },
      {
        fields: ['difficulty_level']
      }
    ]
  });

  return Recipe;
};
