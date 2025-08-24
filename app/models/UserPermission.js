const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const UserPermission = sequelize.define(
  "UserPermission",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    featureId: { type: DataTypes.INTEGER, allowNull: false },
    allowed: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "user_permissions",
  }
);

module.exports = UserPermission;
