const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const CustomerDocument = sequelize.define(
  "CustomerDocument",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    companyId: { type: DataTypes.INTEGER, allowNull: false },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    displayName: { type: DataTypes.STRING, allowNull: true },
    originalName: { type: DataTypes.STRING, allowNull: false },
    storedName: { type: DataTypes.STRING, allowNull: false },
    mimeType: { type: DataTypes.STRING, allowNull: true },
    sizeBytes: { type: DataTypes.INTEGER, allowNull: true },
    relativePath: { type: DataTypes.STRING, allowNull: false },
    uploadedBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "customer_documents",
    timestamps: true,
  }
);

module.exports = CustomerDocument;

