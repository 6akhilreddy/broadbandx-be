const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Feature = sequelize.define(
  "Feature",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    code: { type: DataTypes.STRING, unique: true, allowNull: false },
    name: { type: DataTypes.STRING },
    module: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "features",
  }
);

module.exports = Feature;
