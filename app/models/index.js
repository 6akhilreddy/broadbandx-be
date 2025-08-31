const Company = require("./Company");
const User = require("./User");
const Plan = require("./Plan");
const Customer = require("./Customer");
const CustomerHardware = require("./CustomerHardware");
const Subscription = require("./Subscription");
const Invoice = require("./Invoice");
const InvoiceItem = require("./InvoiceItem");
const Payment = require("./Payment");
const Transaction = require("./Transaction");
const PendingCharge = require("./PendingCharge");
const Feature = require("./Feature");
const Role = require("./Role");
const RolePermission = require("./RolePermission");
const Area = require("./Area");
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
  InvoiceItem,
  Payment,
  Transaction,
  PendingCharge,
  Feature,
  Role,
  RolePermission,
  Area,
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
  InvoiceItem,
  Payment,
  Transaction,
  PendingCharge,
  Feature,
  Role,
  RolePermission,
  Area,
};
