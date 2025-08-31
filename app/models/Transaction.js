const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        "PAYMENT",
        "BILL_GENERATION",
        "BALANCE_ADJUSTMENT",
        "PENDING_CHARGE_ADDED",
        "PENDING_CHARGE_APPLIED"
      ),
      allowNull: false,
    },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    balanceBefore: { type: DataTypes.FLOAT, allowNull: false },
    balanceAfter: { type: DataTypes.FLOAT, allowNull: false },
    description: { type: DataTypes.TEXT },
    referenceId: { type: DataTypes.INTEGER }, // invoiceId, paymentId, etc.
    referenceType: { type: DataTypes.STRING }, // 'invoice', 'payment', 'pending_charge'
    transactionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    recordedDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "transactions",
  }
);

module.exports = Transaction;
