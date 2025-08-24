const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Area = sequelize.define(
  "Area",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    areaName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    tableName: "areas",
  }
);

module.exports = Area;
