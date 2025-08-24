const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false },
    collectedBy: { type: DataTypes.INTEGER, allowNull: false },
    collectedAt: { type: DataTypes.DATE },
    method: {
      type: DataTypes.ENUM("UPI", "CASH"),
      allowNull: false,
    },
    amount: { type: DataTypes.FLOAT },
    comments: { type: DataTypes.TEXT },
  },
  {
    tableName: "payments",
  }
);

module.exports = Payment;
