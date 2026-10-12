const {
  Transaction,
  Customer,
  User,
  Invoice,
  Payment,
  PendingCharge,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

// Get customer transaction history
const getCustomerTransactions = async (req, res) => {
  try {
    const { customerId } = req.params;
    const where = {
      customerId,
      isActive: true,
    };

    if (req.user.roleCode !== "SUPER_ADMIN" && req.user.companyId) {
      where.companyId = req.user.companyId;
    }

    const transactions = await Transaction.findAll({
      where,
      include: [
        {
          model: Customer,
          as: "Customer",
          attributes: ["id", "fullName", "customerCode"],
        },
        {
          model: User,
          as: "CreatedBy",
          attributes: ["id", "name"],
        },
      ],
      order: [["transactionDate", "DESC"]],
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer transactions",
      error: error.message,
    });
  }
};

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { id: createdBy } = req.user;
    const companyId =
      req.user.roleCode === "SUPER_ADMIN"
        ? req.body.companyId || req.user.companyId
        : req.user.companyId;

    const {
      customerId,
      type,
      direction,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId,
      referenceType,
      transactionDate,
    } = req.body;

    const transactionDirection =
      direction || (type === "PAYMENT" ? "CREDIT" : "DEBIT");

    const transaction = await Transaction.create({
      companyId,
      customerId,
      type,
      direction: transactionDirection,
      amount,
      balanceBefore,
      balanceAfter,
      description,
      referenceId,
      referenceType,
      transactionDate: transactionDate || new Date(),
      createdBy,
    });

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create transaction",
      error: error.message,
    });
  }
};

// Get transaction statistics for a customer
const getCustomerTransactionStats = async (req, res) => {
  try {
    const { customerId } = req.params;
    const where = {
      customerId,
      isActive: true,
    };

    if (req.user.roleCode !== "SUPER_ADMIN" && req.user.companyId) {
      where.companyId = req.user.companyId;
    }

    const stats = await Transaction.findOne({
      where,
      attributes: [
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
        [sequelize.fn("COUNT", sequelize.col("id")), "totalTransactions"],
      ],
    });

    const latestTransaction = await Transaction.findOne({
      where,
      order: [["transactionDate", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        totalAmount: parseFloat(stats?.dataValues?.totalAmount || 0),
        totalTransactions: parseInt(stats?.dataValues?.totalTransactions || 0),
        currentBalance: latestTransaction?.balanceAfter || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching transaction stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getCustomerTransactions,
  createTransaction,
  getCustomerTransactionStats,
};
