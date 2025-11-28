const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Area = require("../models/Area");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const {
  getCurrentBalance,
  generatePaymentNumber,
} = require("../utils/financeUtils");

// Search customers for payment recording
const searchCustomers = async (req, res) => {
  try {
    const { query, areaId, companyId } = req.query;

    const whereClause = {};

    // For super admin, don't filter by companyId (can see all customers)
    // For other users, filter by their companyId
    if (req.user.roleCode !== "SUPER_ADMIN") {
      whereClause.companyId = companyId || req.user.companyId;
    } else if (companyId) {
      // Super admin can filter by specific company if provided
      whereClause.companyId = companyId;
    }

    if (query) {
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: `%${query}%` } },
        { customerCode: { [Op.iLike]: `%${query}%` } },
        { phone: { [Op.iLike]: `%${query}%` } },
      ];
    }

    if (areaId) {
      whereClause.areaId = areaId;
    }

    const customers = await Customer.findAll({
      where: whereClause,
      include: [
        {
          model: Area,
          attributes: ["id", "areaName"],
        },
      ],
      attributes: [
        "id",
        "fullName",
        "customerCode",
        "phone",
        "areaId",
        "companyId",
      ],
      limit: 20,
      order: [["fullName", "ASC"]],
    });

    // Get balances for all customers
    const customersWithBalance = await Promise.all(
      customers.map(async (customer) => {
        const balanceAmount = await getCurrentBalance(
          customer.id,
          customer.companyId
        );

        // Get latest invoice for reference
        const latestInvoice = await Invoice.findOne({
          where: { customerId: customer.id, isActive: true },
          order: [["createdAt", "DESC"]],
        });

        return {
          id: customer.id,
          fullName: customer.fullName,
          customerCode: customer.customerCode,
          phone: customer.phone,
          area: customer.Area?.areaName || "Unknown Area",
          balanceAmount,
          lastBillAmount: latestInvoice?.amountTotal || 0,
          lastPayment: 0, // Can be calculated if needed
        };
      })
    );

    res.json({
      success: true,
      data: customersWithBalance,
    });
  } catch (error) {
    console.error("Error searching customers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search customers",
      error: error.message,
    });
  }
};

// Get customer payment details
const getCustomerPaymentDetails = async (req, res) => {
  try {
    const { customerId } = req.params;

    const whereClause = {
      id: customerId,
    };

    // For super admin, don't filter by companyId (can see all customers)
    // For other users, filter by their companyId
    if (req.user.roleCode !== "SUPER_ADMIN") {
      whereClause.companyId = req.user.companyId;
    }

    const customer = await Customer.findOne({
      where: whereClause,
      include: [
        {
          model: Area,
          attributes: ["id", "areaName"],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Get current balance
    const balanceAmount = await getCurrentBalance(
      customerId,
      customer.companyId
    );

    // Get latest invoice for reference
    const latestInvoice = await Invoice.findOne({
      where: { customerId, isActive: true },
      order: [["createdAt", "DESC"]],
    });

    // Get latest payment
    const latestPayment = await Payment.findOne({
      where: { customerId, isActive: true },
      order: [["collectedAt", "DESC"]],
      include: [
        {
          model: User,
          as: "collector",
          attributes: ["id", "name"],
        },
      ],
    });

    const paymentDetails = {
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        customerCode: customer.customerCode,
        phone: customer.phone,
        area: customer.Area?.areaName || "Unknown Area",
      },
      balanceAmount,
      lastBillAmount: latestInvoice?.amountTotal || 0,
      lastPayment: {
        amount: latestPayment?.amount || 0,
        date: latestPayment?.collectedAt || null,
        method: latestPayment?.method || null,
      },
      latestInvoice: latestInvoice
        ? {
            id: latestInvoice.id,
            invoiceNumber: latestInvoice.invoiceNumber,
            amountTotal: latestInvoice.amountTotal,
            subtotal: latestInvoice.subtotal,
            dueDate: latestInvoice.dueDate,
            type: latestInvoice.type,
          }
        : null,
    };

    res.json({
      success: true,
      data: paymentDetails,
    });
  } catch (error) {
    console.error("Error getting customer payment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get customer payment details",
      error: error.message,
    });
  }
};

// Record a payment (independent of invoices)
const recordPayment = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { customerId, invoiceId, amount, discount, method, comments } =
      req.body;

    // Validate required fields
    if (!customerId || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: "Customer ID, amount, and payment method are required",
      });
    }

    // Find the customer
    const whereClause = {
      id: customerId,
    };

    // For super admin, don't filter by companyId (can see all customers)
    // For other users, filter by their companyId
    if (req.user.roleCode !== "SUPER_ADMIN") {
      whereClause.companyId = req.user.companyId;
    }

    const customer = await Customer.findOne({
      where: whereClause,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const companyId =
      req.user.roleCode === "SUPER_ADMIN"
        ? customer.companyId
        : req.user.companyId;

    // Get current balance
    const currentBalance = await getCurrentBalance(customerId, companyId);
    const paymentAmount = parseFloat(amount) - (parseFloat(discount) || 0);
    const newBalance = Math.max(0, currentBalance - paymentAmount);

    // Create transaction first
    const paymentTransaction = await Transaction.create(
      {
        companyId,
        customerId,
        type: "PAYMENT",
        direction: "CREDIT",
        amount: paymentAmount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: `Payment of ₹${paymentAmount.toFixed(
          2
        )} via ${method.toUpperCase()}${comments ? ` - ${comments}` : ""}`,
        referenceType: "payment",
        transactionDate: new Date(),
        createdBy: req.user.id,
      },
      { transaction: dbTransaction }
    );

    // Create payment document
    const payment = await Payment.create(
      {
        transactionId: paymentTransaction.id,
        paymentNumber: generatePaymentNumber(),
        companyId,
        customerId,
        invoiceId: invoiceId || null, // Optional - for reference only
        amount: paymentAmount,
        discount: parseFloat(discount) || 0,
        method: method.toUpperCase(),
        collectedBy: req.user.id,
        collectedAt: new Date(),
        comments: comments || "",
      },
      { transaction: dbTransaction }
    );

    // Update transaction reference
    await paymentTransaction.update(
      { referenceId: payment.id },
      { transaction: dbTransaction }
    );

    await dbTransaction.commit();

    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        method: payment.method,
        collectedAt: payment.collectedAt,
        newBalance,
      },
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error recording payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error: error.message,
    });
  }
};

// Get payment history
const getPaymentHistory = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      areaId,
      paymentMethod,
      customerId,
      page = 1,
      limit = 20,
      companyId,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      isActive: true,
    };

    // For super admin, don't filter by companyId (can see all payments)
    // For other users, filter by their companyId
    if (req.user.roleCode !== "SUPER_ADMIN") {
      whereClause.companyId = companyId || req.user.companyId;
    } else if (companyId) {
      // Super admin can filter by specific company if provided
      whereClause.companyId = companyId;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    if (startDate && endDate) {
      whereClause.collectedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + " 23:59:59")],
      };
    }

    if (paymentMethod) {
      whereClause.method = paymentMethod.toUpperCase();
    }

    // Get payments with related data
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          where: areaId ? { areaId } : {},
          include: [
            {
              model: Area,
              attributes: ["id", "areaName"],
            },
          ],
          attributes: ["id", "fullName", "customerCode", "phone", "areaId"],
        },
        {
          model: Invoice,
          attributes: ["id", "invoiceNumber", "amountTotal", "type"],
          required: false,
        },
        {
          model: User,
          as: "collector",
          attributes: ["id", "name"],
        },
      ],
      order: [["collectedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const paymentHistory = payments.map((payment) => ({
      id: payment.id,
      paymentNumber: payment.paymentNumber,
      amount: payment.amount,
      discount: payment.discount,
      method: payment.method,
      collectedAt: payment.collectedAt,
      comments: payment.comments,
      customer: {
        id: payment.Customer.id,
        name: payment.Customer.fullName,
        customerCode: payment.Customer.customerCode,
        phone: payment.Customer.phone,
        area: payment.Customer.Area?.areaName || "Unknown Area",
      },
      invoice: payment.Invoice
        ? {
            id: payment.Invoice.id,
            invoiceNumber: payment.Invoice.invoiceNumber,
            amountTotal: payment.Invoice.amountTotal,
            type: payment.Invoice.type,
          }
        : null,
      collector: payment.collector?.name || "Unknown",
    }));

    res.json({
      success: true,
      data: {
        payments: paymentHistory,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  const dbTransaction = await sequelize.transaction();
  try {
    const { paymentId } = req.params;
    const { companyId } = req.user;

    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        companyId,
        isActive: true,
      },
      include: [
        {
          model: Transaction,
        },
      ],
      transaction: dbTransaction,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Verify this is the latest transaction (most recent by date and id)
    if (payment.Transaction) {
      const latestTransaction = await Transaction.findOne({
        where: {
          customerId: payment.customerId,
          companyId,
          isActive: true,
        },
        order: [
          ["transactionDate", "DESC"],
          ["id", "DESC"],
        ],
        transaction: dbTransaction,
      });

      // Compare IDs as integers to avoid type mismatch issues
      const paymentTransactionId = parseInt(payment.Transaction.id, 10);
      const latestId = latestTransaction
        ? parseInt(latestTransaction.id, 10)
        : null;

      if (!latestTransaction || latestId !== paymentTransactionId) {
        await dbTransaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Only the latest payment can be deleted",
        });
      }
    }

    // Soft delete payment
    await payment.update({ isActive: false }, { transaction: dbTransaction });

    // Soft delete associated transaction (no recalculation needed since it's the latest)
    if (payment.Transaction) {
      await payment.Transaction.update(
        { isActive: false },
        { transaction: dbTransaction }
      );
    }

    await dbTransaction.commit();

    res.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    await dbTransaction.rollback();
    console.error("Error deleting payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};

// Get payment details for preview
const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { companyId } = req.user;

    const payment = await Payment.findOne({
      where: {
        id: paymentId,
        companyId,
        isActive: true,
      },
      include: [
        {
          model: Transaction,
        },
        {
          model: Invoice,
          attributes: [
            "id",
            "invoiceNumber",
            "amountTotal",
            "periodStart",
            "periodEnd",
            "type",
          ],
          include: [
            {
              model: Customer,
              attributes: [
                "id",
                "fullName",
                "customerCode",
                "phone",
                "address",
              ],
              include: [
                {
                  model: Area,
                  attributes: ["areaName"],
                },
              ],
            },
          ],
          required: false,
        },
        {
          model: Customer,
          attributes: ["id", "fullName", "customerCode", "phone", "address"],
          include: [
            {
              model: Area,
              attributes: ["areaName"],
            },
          ],
        },
        {
          model: User,
          as: "collector",
          attributes: ["id", "name"],
        },
      ],
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.json({
      success: true,
      data: payment.toJSON(),
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

module.exports = {
  searchCustomers,
  getCustomerPaymentDetails,
  recordPayment,
  getPaymentHistory,
  deletePayment,
  getPaymentDetails,
};
