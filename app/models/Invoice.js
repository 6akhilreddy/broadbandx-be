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
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    subscriptionId: { type: DataTypes.INTEGER, allowNull: false },
    periodStart: { type: DataTypes.DATEONLY },
    periodEnd: { type: DataTypes.DATEONLY },
    subtotal: { type: DataTypes.FLOAT, defaultValue: 0 },
    taxAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    discounts: { type: DataTypes.FLOAT, defaultValue: 0 },
    amountTotal: { type: DataTypes.FLOAT, defaultValue: 0 },
    dueDate: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "PAID",
        "PARTIALLY_PAID",
        "OVERDUE",
        "CANCELLED"
      ),
      defaultValue: "PENDING",
    },
    invoiceNumber: { type: DataTypes.STRING, unique: true },
    notes: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    manualOverrideBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    tableName: "invoices",
  }
);

module.exports = Invoice;
