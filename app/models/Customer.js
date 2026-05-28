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
    billingNumber: { type: DataTypes.INTEGER, allowNull: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    billingName: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING, allowNull: true },
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
    remarks: { type: DataTypes.TEXT },
    followUpDate: { type: DataTypes.DATEONLY, allowNull: true },
    followUpNotes: { type: DataTypes.TEXT, allowNull: true },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    // Billing profile (moved from subscription for single customer-level config)
    billingStartDate: { type: DataTypes.DATEONLY, allowNull: true },
    openingBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
    openingBalanceType: {
      type: DataTypes.ENUM("OUTSTANDING", "ADVANCE"),
      defaultValue: "OUTSTANDING",
    },
    billingType: {
      type: DataTypes.ENUM("PREPAID", "POSTPAID"),
      defaultValue: "POSTPAID",
    },
    billingCycle: {
      type: DataTypes.ENUM("MONTHLY", "DAILY", "END_OF_MONTH"),
      defaultValue: "MONTHLY",
    },
    billingCycleValue: { type: DataTypes.INTEGER, defaultValue: 1 },
    monthlyAdditionalCharge: { type: DataTypes.FLOAT, defaultValue: 0 },
    monthlyDiscount: { type: DataTypes.FLOAT, defaultValue: 0 },
    gstType: {
      type: DataTypes.ENUM("NONE", "CGST_SGST", "IGST"),
      defaultValue: "NONE",
    },
    fixedBillAmount: { type: DataTypes.FLOAT, allowNull: true },
  },
  {
    tableName: "customers",
  }
);

module.exports = Customer;
