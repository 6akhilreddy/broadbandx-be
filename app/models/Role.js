const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: { 
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true 
    },
    code: { 
      type: DataTypes.STRING, 
      allowNull: false,
      unique: true 
    },
    description: { type: DataTypes.TEXT },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "roles",
  }
);

module.exports = Role;

