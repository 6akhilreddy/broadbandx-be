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
    transactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    paymentNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    invoiceId: { type: DataTypes.INTEGER, allowNull: true }, // Optional - for reference only
    amount: { type: DataTypes.FLOAT, allowNull: false },
    discount: { type: DataTypes.FLOAT, defaultValue: 0 },
    method: {
      type: DataTypes.ENUM("UPI", "CASH", "BHIM", "PhonePe", "CARD"),
      allowNull: false,
    },
    collectedBy: { type: DataTypes.INTEGER, allowNull: false },
    collectedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    comments: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "payments",
  }
);

module.exports = Payment;
