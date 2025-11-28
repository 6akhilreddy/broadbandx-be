const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ComplaintComment = sequelize.define(
  "ComplaintComment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    complaintId: { type: DataTypes.INTEGER, allowNull: false },
    comment: { type: DataTypes.TEXT, allowNull: false },
    createdBy: { type: DataTypes.INTEGER, allowNull: false },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  {
    tableName: "complaint_comments",
    timestamps: true,
  }
);

module.exports = ComplaintComment;

