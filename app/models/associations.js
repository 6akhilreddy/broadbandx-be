const { DataTypes } = require("sequelize");
const Company = require("../models/Company");
const User = require("../models/User");
const Plan = require("../models/Plan");
const Customer = require("../models/Customer");
const CustomerHardware = require("../models/CustomerHardware");
const Subscription = require("../models/Subscription");
const Invoice = require("../models/Invoice");
const Payment = require("../models/Payment");
const Feature = require("../models/Feature");
const UserPermission = require("../models/UserPermission");
const Area = require("../models/Area");

// This function defines all the relationships between the models in the application.
const defineAssociations = () => {
  // 🔹 Area Associations 🔹
  // Area belongs to Company and User (createdBy)
  Company.hasMany(Area, { foreignKey: "companyId", onDelete: "CASCADE" });
  Area.belongsTo(Company, { foreignKey: "companyId" });
  User.hasMany(Area, {
    foreignKey: "createdBy",
    as: "CreatedAreas",
    onDelete: "SET NULL",
  });
  Area.belongsTo(User, { foreignKey: "createdBy", as: "CreatedBy" });
  // Customer belongs to Area
  Area.hasMany(Customer, { foreignKey: "areaId", onDelete: "RESTRICT" });
  Customer.belongsTo(Area, { foreignKey: "areaId" });
  // 🔹 Company Associations 🔹
  // A Company can have multiple Users, Plans, Customers, etc.
  Company.hasMany(User, { foreignKey: "companyId", onDelete: "SET NULL" });
  User.belongsTo(Company, { foreignKey: "companyId" });

  Company.hasMany(Plan, { foreignKey: "companyId", onDelete: "CASCADE" });
  Plan.belongsTo(Company, { foreignKey: "companyId" });

  Company.hasMany(Customer, { foreignKey: "companyId", onDelete: "CASCADE" });
  Customer.belongsTo(Company, { foreignKey: "companyId" });

  Company.hasMany(Subscription, {
    foreignKey: "companyId",
    onDelete: "CASCADE",
  });
  Subscription.belongsTo(Company, { foreignKey: "companyId" });

  Company.hasMany(Invoice, { foreignKey: "companyId", onDelete: "CASCADE" });
  Invoice.belongsTo(Company, { foreignKey: "companyId" });

  Company.hasMany(Payment, { foreignKey: "companyId", onDelete: "CASCADE" });
  Payment.belongsTo(Company, { foreignKey: "companyId" });

  // 🔹 User Associations 🔹
  // Tracks which user (agent) collected a payment.
  User.hasMany(Payment, {
    foreignKey: "collectedBy",
    as: "CollectedPayments",
    onDelete: "RESTRICT", // Prevent deleting a user who has collected payments
  });
  Payment.belongsTo(User, {
    as: "CollectedBy",
    foreignKey: "collectedBy",
  });

  // Tracks which user created a customer.
  User.hasMany(Customer, {
    foreignKey: "createdBy",
    as: "CreatedCustomers",
    onDelete: "RESTRICT", // Prevent deleting a user who has created customers
  });
  Customer.belongsTo(User, {
    as: "CreatedBy",
    foreignKey: "createdBy",
  });

  // Tracks which agent is assigned to a customer for collections/support.
  User.hasMany(Customer, {
    foreignKey: "assignedAgentId",
    as: "AssignedCustomers",
    onDelete: "SET NULL", // If agent is deleted, unassign them from customer
  });
  Customer.belongsTo(User, {
    as: "AssignedAgent",
    foreignKey: "assignedAgentId",
  });

  // Tracks which user manually overrode an invoice.
  User.hasMany(Invoice, {
    foreignKey: "manualOverrideBy",
    as: "OverriddenInvoices",
    onDelete: "SET NULL",
  });
  Invoice.belongsTo(User, {
    as: "OverriddenBy",
    foreignKey: "manualOverrideBy",
  });

  // User permissions through the join table.
  User.hasMany(UserPermission, { foreignKey: "userId", onDelete: "CASCADE" });
  UserPermission.belongsTo(User, { foreignKey: "userId" });

  // 🔹 Feature and UserPermission Associations 🔹
  // Establishes the many-to-many relationship between Users and Features.
  Feature.hasMany(UserPermission, {
    foreignKey: "featureId",
    onDelete: "CASCADE",
  });
  UserPermission.belongsTo(Feature, { foreignKey: "featureId" });

  // 🔹 Plan and Subscription Associations 🔹
  Plan.hasMany(Subscription, { foreignKey: "planId", onDelete: "RESTRICT" });
  Subscription.belongsTo(Plan, { foreignKey: "planId" });

  // 🔹 Customer Associations 🔹
  // A customer can have multiple hardware devices, subscriptions, and invoices.
  Customer.hasMany(CustomerHardware, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  CustomerHardware.belongsTo(Customer, { foreignKey: "customerId" });

  Customer.hasMany(Subscription, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  Subscription.belongsTo(Customer, { foreignKey: "customerId" });

  Customer.hasMany(Invoice, { foreignKey: "customerId", onDelete: "CASCADE" });
  Invoice.belongsTo(Customer, { foreignKey: "customerId" });

  // 🔹 Subscription and Invoice Associations 🔹
  Subscription.hasMany(Invoice, {
    foreignKey: "subscriptionId",
    onDelete: "CASCADE",
  });
  Invoice.belongsTo(Subscription, { foreignKey: "subscriptionId" });

  // 🔹 Invoice and Payment Associations 🔹
  Invoice.hasMany(Payment, { foreignKey: "invoiceId", onDelete: "CASCADE" });
  Payment.belongsTo(Invoice, { foreignKey: "invoiceId" });
};

module.exports = defineAssociations;
