const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const RolePermission = sequelize.define(
  "RolePermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    roleId: { type: DataTypes.INTEGER, allowNull: false },
    featureId: { type: DataTypes.INTEGER, allowNull: false },
    allowed: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "role_permissions",
  }
);

module.exports = RolePermission;

