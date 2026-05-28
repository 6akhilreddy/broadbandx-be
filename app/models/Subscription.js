const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Subscription = sequelize.define(
  "Subscription",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    planId: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    nextRenewalDate: { type: DataTypes.DATEONLY, allowNull: true },
    lastRenewalDate: { type: DataTypes.DATEONLY, allowNull: true },
    agreedMonthlyPrice: { type: DataTypes.FLOAT },
    status: {
      type: DataTypes.ENUM("ACTIVE", "PAUSED", "CANCELLED", "CHANGED"),
      defaultValue: "ACTIVE",
    },
  },
  {
    tableName: "subscriptions",
  }
);

module.exports = Subscription;
