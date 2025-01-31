module.exports = (sequelize, DataTypes) => {
  const Allergen = sequelize.define('Allergen', {
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
    allergen: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    severity: {
      type: DataTypes.STRING(20),
      validate: {
        isIn: [['mild', 'moderate', 'severe']]
      }
    },
    notes: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'allergens',
    timestamps: true,
    indexes: [
      {
        fields: ['user_id', 'allergen'],
        unique: true
      }
    ]
  });

  return Allergen;
};

