const { DataTypes } = require("sequelize");

// This function defines all the relationships between the models in the application.
const defineAssociations = (models = null) => {
  // Use passed models or require them
  const Company = models?.Company || require("../models/Company");
  const User = models?.User || require("../models/User");
  const Plan = models?.Plan || require("../models/Plan");
  const Customer = models?.Customer || require("../models/Customer");
  const CustomerHardware =
    models?.CustomerHardware || require("../models/CustomerHardware");
  const Subscription =
    models?.Subscription || require("../models/Subscription");
  const Invoice = models?.Invoice || require("../models/Invoice");
  const Payment = models?.Payment || require("../models/Payment");
  const Transaction = models?.Transaction || require("../models/Transaction");
  const Feature = models?.Feature || require("../models/Feature");
  const Role = models?.Role || require("../models/Role");
  const RolePermission =
    models?.RolePermission || require("../models/RolePermission");
  const Area = models?.Area || require("../models/Area");
  const Complaint = models?.Complaint || require("../models/Complaint");
  const ComplaintComment =
    models?.ComplaintComment || require("../models/ComplaintComment");
  const CustomerDocument =
    models?.CustomerDocument || require("../models/CustomerDocument");
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

  Company.hasMany(CustomerDocument, {
    foreignKey: "companyId",
    onDelete: "CASCADE",
  });
  CustomerDocument.belongsTo(Company, { foreignKey: "companyId" });

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
    as: "collector",
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

  // User created transactions
  User.hasMany(Transaction, {
    foreignKey: "createdBy",
    as: "CreatedTransactions",
    onDelete: "RESTRICT",
  });
  Transaction.belongsTo(User, {
    as: "CreatedBy",
    foreignKey: "createdBy",
  });

  // User belongs to Role
  User.belongsTo(Role, { foreignKey: "roleId" });
  Role.hasMany(User, { foreignKey: "roleId" });

  // Supervisor manages agents (optional hierarchy)
  User.belongsTo(User, { as: "Supervisor", foreignKey: "supervisorId" });
  User.hasMany(User, {
    as: "ManagedAgents",
    foreignKey: "supervisorId",
  });

  // 🔹 Feature and RolePermission Associations 🔹
  // Establishes the many-to-many relationship between Roles and Features.
  Feature.hasMany(RolePermission, {
    foreignKey: "featureId",
    onDelete: "CASCADE",
  });
  RolePermission.belongsTo(Feature, { foreignKey: "featureId" });

  // Role has many RolePermissions
  Role.hasMany(RolePermission, { foreignKey: "roleId", onDelete: "CASCADE" });
  RolePermission.belongsTo(Role, { foreignKey: "roleId" });

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

  Customer.hasMany(CustomerDocument, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  CustomerDocument.belongsTo(Customer, { foreignKey: "customerId" });

  // 🔹 Subscription and Invoice Associations 🔹
  Subscription.hasMany(Invoice, {
    foreignKey: "subscriptionId",
    onDelete: "SET NULL", // Subscription can be null for ADJUSTED invoices
  });
  Invoice.belongsTo(Subscription, { foreignKey: "subscriptionId" });

  // 🔹 Transaction and Invoice Associations 🔹
  Transaction.hasOne(Invoice, {
    foreignKey: "transactionId",
    onDelete: "CASCADE",
  });
  Invoice.belongsTo(Transaction, { foreignKey: "transactionId" });

  // 🔹 Transaction and Payment Associations 🔹
  Transaction.hasOne(Payment, {
    foreignKey: "transactionId",
    onDelete: "CASCADE",
  });
  Payment.belongsTo(Transaction, { foreignKey: "transactionId" });

  // 🔹 Invoice and Payment Associations (optional reference) 🔹
  Invoice.hasMany(Payment, {
    foreignKey: "invoiceId",
    onDelete: "SET NULL", // Payment can exist without invoice
  });
  Payment.belongsTo(Invoice, {
    foreignKey: "invoiceId",
    required: false,
  });

  // 🔹 Customer and Transaction Associations 🔹
  Customer.hasMany(Transaction, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  Transaction.belongsTo(Customer, { foreignKey: "customerId" });

  // 🔹 Customer and Payment Associations 🔹
  Customer.hasMany(Payment, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  Payment.belongsTo(Customer, { foreignKey: "customerId" });

  // 🔹 Company and Transaction Associations 🔹
  Company.hasMany(Transaction, {
    foreignKey: "companyId",
    onDelete: "CASCADE",
  });
  Transaction.belongsTo(Company, { foreignKey: "companyId" });

  // 🔹 Complaint Associations 🔹
  Company.hasMany(Complaint, { foreignKey: "companyId", onDelete: "CASCADE" });
  Complaint.belongsTo(Company, { foreignKey: "companyId" });

  Customer.hasMany(Complaint, {
    foreignKey: "customerId",
    onDelete: "CASCADE",
  });
  Complaint.belongsTo(Customer, { foreignKey: "customerId" });

  User.hasMany(Complaint, {
    foreignKey: "assignedAgentId",
    as: "AssignedComplaints",
    onDelete: "SET NULL",
  });
  Complaint.belongsTo(User, {
    as: "AssignedAgent",
    foreignKey: "assignedAgentId",
  });

  User.hasMany(Complaint, {
    foreignKey: "createdBy",
    as: "CreatedComplaints",
    onDelete: "RESTRICT",
  });
  Complaint.belongsTo(User, {
    as: "CreatedBy",
    foreignKey: "createdBy",
  });

  // 🔹 ComplaintComment Associations 🔹
  Complaint.hasMany(ComplaintComment, {
    foreignKey: "complaintId",
    onDelete: "CASCADE",
  });
  ComplaintComment.belongsTo(Complaint, { foreignKey: "complaintId" });

  User.hasMany(ComplaintComment, {
    foreignKey: "createdBy",
    as: "CreatedComplaintComments",
    onDelete: "RESTRICT",
  });
  ComplaintComment.belongsTo(User, {
    as: "CreatedBy",
    foreignKey: "createdBy",
  });
};

module.exports = defineAssociations;
