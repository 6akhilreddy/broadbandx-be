const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Customer = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    fullName: { type: DataTypes.STRING, allowNull: false },
    billingName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING, allowNull: false },
    phoneSecondary: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    address: { type: DataTypes.TEXT },
    areaId: { type: DataTypes.INTEGER, allowNull: false },
    customerCode: { type: DataTypes.STRING },
    latitude: { type: DataTypes.STRING },
    longitude: { type: DataTypes.STRING },
    assignedAgentId: { type: DataTypes.INTEGER },
    installationDate: { type: DataTypes.DATEONLY },
    securityDeposit: { type: DataTypes.FLOAT, defaultValue: 0 },
    gstNumber: { type: DataTypes.STRING },
    advance: { type: DataTypes.INTEGER },
    remarks: { type: DataTypes.TEXT },
    followUpDate: { type: DataTypes.DATEONLY, allowNull: true },
    followUpNotes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "customers",
  }
);

module.exports = Customer;
