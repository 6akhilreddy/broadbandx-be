const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Plan = sequelize.define(
  "Plan",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    monthlyPrice: { type: DataTypes.FLOAT },
    gstRate: { type: DataTypes.INTEGER, defaultValue: 18 },
    code: { type: DataTypes.STRING },
    benefits: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "plans",
  }
);

module.exports = Plan;
