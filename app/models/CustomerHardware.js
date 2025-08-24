const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerHardware = sequelize.define(
  "CustomerHardware",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    deviceType: { type: DataTypes.STRING },
    macAddress: { type: DataTypes.STRING, unique: true },
    ipAddress: { type: DataTypes.STRING },
  },
  {
    tableName: "customer_hardware",
  }
);

module.exports = CustomerHardware;
