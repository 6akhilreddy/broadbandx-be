const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const PendingCharge = sequelize.define(
  "PendingCharge",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    chargeType: {
      type: DataTypes.ENUM(
        "ROUTER_INSTALLATION",
        "EQUIPMENT_CHARGE",
        "LATE_FEE",
        "ADJUSTMENT",
        "OTHER"
      ),
      allowNull: false,
    },
    description: { type: DataTypes.TEXT, allowNull: false },
    amount: { type: DataTypes.FLOAT, allowNull: false },
    isApplied: { type: DataTypes.BOOLEAN, defaultValue: false },
    appliedToInvoiceId: { type: DataTypes.INTEGER },
    appliedDate: { type: DataTypes.DATE },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "pending_charges",
  }
);

module.exports = PendingCharge;
