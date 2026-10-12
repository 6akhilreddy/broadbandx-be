const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const InventoryLog = sequelize.define(
  "InventoryLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    inventoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "CREATED, ASSIGNED, REPLACED, STATUS_CHANGE, UNASSIGNED",
    },
    previousStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    replacedByInventoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    performedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "inventory_logs",
    timestamps: true,
  }
);

module.exports = InventoryLog;
