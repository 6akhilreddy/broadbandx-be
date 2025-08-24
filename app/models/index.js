const Company = require("./Company");
const User = require("./User");
const Plan = require("./Plan");
const Customer = require("./Customer");
const CustomerHardware = require("./CustomerHardware");
const Subscription = require("./Subscription");
const Invoice = require("./Invoice");
const Payment = require("./Payment");
const Feature = require("./Feature");
const UserPermission = require("./UserPermission");
const sequelize = require("../config/db");

const defineAssociations = require("./associations");

// Initialize associations
defineAssociations();

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
  Feature,
  UserPermission,
};
