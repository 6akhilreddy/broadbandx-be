const Company = require("./Company");
const User = require("./User");
const Plan = require("./Plan");
const Customer = require("./Customer");
const CustomerHardware = require("./CustomerHardware");
const Subscription = require("./Subscription");
const Invoice = require("./Invoice");
const Payment = require("./Payment");
const Transaction = require("./Transaction");
const Feature = require("./Feature");
const Role = require("./Role");
const RolePermission = require("./RolePermission");
const Area = require("./Area");
const Complaint = require("./Complaint");
const ComplaintComment = require("./ComplaintComment");
const sequelize = require("../config/db");

const defineAssociations = require("./associations");

// Initialize associations
defineAssociations({
  Company,
  User,
  Plan,
  Customer,
  CustomerHardware,
  Subscription,
  Invoice,
  Payment,
  Transaction,
  Feature,
  Role,
  RolePermission,
  Area,
  Complaint,
  ComplaintComment,
});

module.exports = {
  sequelize,
  Company,
  User,
  Plan,
  Customer,
  CustomerHardware,
  Subscription,
  Invoice,
  Payment,
  Transaction,
  Feature,
  Role,
  RolePermission,
  Area,
  Complaint,
  ComplaintComment,
};
