const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Invoice = sequelize.define(
  "Invoice",
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
    invoiceNumber: { type: DataTypes.STRING, unique: true, allowNull: false },
    type: {
      type: DataTypes.ENUM("SUBSCRIPTION", "ADJUSTED"),
      allowNull: false,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    subscriptionId: { type: DataTypes.INTEGER, allowNull: true }, // Only for SUBSCRIPTION type
    periodStart: { type: DataTypes.DATEONLY, allowNull: true }, // Only for SUBSCRIPTION type
    periodEnd: { type: DataTypes.DATEONLY, allowNull: true }, // Only for SUBSCRIPTION type
    subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
    taxAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    discounts: { type: DataTypes.FLOAT, defaultValue: 0 },
    amountTotal: { type: DataTypes.FLOAT, defaultValue: 0 },
    prevBalance: { type: DataTypes.FLOAT, allowNull: true }, // Only for SUBSCRIPTION with prev balance
    items: { type: DataTypes.JSONB, allowNull: true }, // Array of invoice items
    dueDate: { type: DataTypes.DATEONLY },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "invoices",
  }
);

module.exports = Invoice;
