const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Complaint = sequelize.define(
  "Complaint",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    assignedAgentId: { type: DataTypes.INTEGER, allowNull: true },
    status: {
      type: DataTypes.ENUM("OPEN", "IN_PROGRESS", "RESOLVED"),
      defaultValue: "OPEN",
      allowNull: false,
    },
    message: { type: DataTypes.TEXT, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "complaints",
    timestamps: true,
  }
);

module.exports = Complaint;

