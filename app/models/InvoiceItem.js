const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InvoiceItem = sequelize.define(
  "InvoiceItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false },
    itemType: {
      type: DataTypes.ENUM(
        "INTERNET_SERVICE",
        "ROUTER_INSTALLATION",
        "EQUIPMENT_CHARGE",
        "LATE_FEE",
        "ADJUSTMENT",
        "OTHER"
      ),
      allowNull: false,
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
    unitPrice: { type: DataTypes.FLOAT, allowNull: false },
    totalAmount: { type: DataTypes.FLOAT, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "invoice_items",
  }
);

module.exports = InvoiceItem;
