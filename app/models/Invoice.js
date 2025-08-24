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
    amountDue: { type: DataTypes.FLOAT },
    taxAmount: { type: DataTypes.FLOAT },
    discounts: { type: DataTypes.FLOAT },
    amountTotal: { type: DataTypes.FLOAT },
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
  },
  {
    tableName: "invoices",
  }
);

module.exports = Invoice;
