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
    startDate: { type: DataTypes.DATEONLY, allowNull: false },
    nextRenewalDate: { type: DataTypes.DATEONLY, allowNull: true },
    lastRenewalDate: { type: DataTypes.DATEONLY, allowNull: true },
    agreedMonthlyPrice: { type: DataTypes.FLOAT },
    billingType: {
      type: DataTypes.ENUM("PREPAID", "POSTPAID"),
      defaultValue: "POSTPAID",
    },
    // Captures 'Days', 'Months', 'End of every month'
    billingCycle: {
      type: DataTypes.ENUM("MONTHLY", "DAILY"),
      defaultValue: "MONTHLY",
    },
    billingCycleValue: { type: DataTypes.INTEGER, defaultValue: 1 },
    // Additional charge every month
    additionalCharge: { type: DataTypes.FLOAT, defaultValue: 0 },
    // Discount every month
    discount: { type: DataTypes.FLOAT, defaultValue: 0 },
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
