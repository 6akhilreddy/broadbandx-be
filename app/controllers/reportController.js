const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Area = require("../models/Area");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// Get invoice history
const getInvoiceHistory = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      areaId,
      status,
      search,
      page = 1,
      limit = 20,
      companyId,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      companyId: companyId || req.user.companyId,
    };

    console.log("Invoice History Request:", {
      query: req.query,
      user: req.user,
      companyId: companyId || req.user.companyId,
      startDate,
      endDate,
    });

    if (startDate && endDate && startDate !== "" && endDate !== "") {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + " 23:59:59")],
      };
    }

    // Note: Invoice status removed - invoices are now linked to transactions
    // Filter by type if needed
    if (status) {
      // Map old status to invoice type if needed
      // For now, we'll ignore status filter
    }

    console.log("Where clause:", whereClause);

    // Get invoices with related data
    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Customer,
          where: search
            ? {
                [Op.or]: [
                  { fullName: { [Op.iLike]: `%${search}%` } },
                  { phone: { [Op.iLike]: `%${search}%` } },
                ],
              }
            : {},
          include: [
            {
              model: Area,
              where: areaId ? { id: areaId } : {},
              attributes: ["id", "areaName"],
            },
          ],
          attributes: ["id", "fullName", "customerCode", "phone", "areaId"],
        },
        {
          model: Payment,
          attributes: ["id", "amount", "method", "collectedAt"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    console.log("Query results:", { count, invoicesCount: invoices.length });

    // Debug: Check all invoices in database
    const allInvoices = await Invoice.findAll({
      attributes: ["id", "companyId", "createdAt", "type"],
      limit: 5,
    });
    console.log(
      "All invoices in DB (first 5):",
      allInvoices.map((inv) => ({
        id: inv.id,
        companyId: inv.companyId,
        createdAt: inv.createdAt,
        type: inv.type,
      }))
    );

    const invoiceHistory = invoices.map((invoice) => {
      const totalPaid = invoice.Payments.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      );
      const balance = invoice.amountTotal - totalPaid;

      return {
        id: invoice.id,
        customer: {
          id: invoice.Customer.id,
          name: invoice.Customer.fullName,
          customerCode: invoice.Customer.customerCode,
          phone: invoice.Customer.phone,
          area: invoice.Customer.Area?.areaName || "Unknown Area",
        },
        amountTotal: invoice.amountTotal,
        subtotal: invoice.subtotal,
        taxAmount: invoice.taxAmount,
        discounts: invoice.discounts,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        dueDate: invoice.dueDate,
        type: invoice.type,
        totalPaid,
        balance,
        createdAt: invoice.createdAt,
        payments: invoice.Payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          collectedAt: payment.collectedAt,
        })),
      };
    });

    res.json({
      success: true,
      data: {
        invoices: invoiceHistory,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching invoice history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice history",
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
      search,
      page = 1,
      limit = 20,
      companyId,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      companyId: companyId || req.user.companyId,
    };

    if (startDate && endDate) {
      whereClause.collectedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate + " 23:59:59")],
      };
    }

    if (paymentMethod) {
      whereClause.method = paymentMethod;
    }

    // Get payments with related data
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Invoice,
          include: [
            {
              model: Customer,
              where: search
                ? {
                    [Op.or]: [
                      { fullName: { [Op.iLike]: `%${search}%` } },
                      { phone: { [Op.iLike]: `%${search}%` } },
                    ],
                  }
                : {},
              include: [
                {
                  model: Area,
                  where: areaId ? { id: areaId } : {},
                  attributes: ["id", "areaName"],
                },
              ],
              attributes: ["id", "fullName", "customerCode", "phone", "areaId"],
            },
          ],
          attributes: ["id", "subtotal", "discounts", "amountTotal", "status"],
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
      amount: payment.amount,
      method: payment.method,
      collectedAt: payment.collectedAt,
      comments: payment.comments,
      customer: {
        id: payment.Invoice.Customer.id,
        name: payment.Invoice.Customer.fullName,
        customerCode: payment.Invoice.Customer.customerCode,
        phone: payment.Invoice.Customer.phone,
        area: payment.Invoice.Customer.Area?.areaName || "Unknown Area",
      },
      invoice: {
        id: payment.Invoice.id,
        amountTotal: payment.Invoice.amountTotal,
        type: payment.Invoice.type,
      },
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

// Get user history (combined invoice and payment history for a specific user)
const getUserHistory = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate, companyId } = req.query;

    // Verify customer exists and belongs to company
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        companyId: companyId || req.user.companyId,
      },
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

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter[Op.between] = [
        new Date(startDate),
        new Date(endDate + " 23:59:59"),
      ];
    }

    // Get all invoices for the customer
    const invoices = await Invoice.findAll({
      where: {
        customerId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      },
      include: [
        {
          model: Payment,
          attributes: ["id", "amount", "method", "collectedAt", "comments"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Get all payments for the customer (through invoices)
    const payments = await Payment.findAll({
      where: {
        invoiceId: {
          [Op.in]: invoices.map((inv) => inv.id),
        },
        ...(Object.keys(dateFilter).length > 0 && { collectedAt: dateFilter }),
      },
      include: [
        {
          model: Invoice,
          attributes: ["id", "amountTotal", "status"],
        },
        {
          model: User,
          as: "collector",
          attributes: ["id", "name"],
        },
      ],
      order: [["collectedAt", "DESC"]],
    });

    // Get all add-on bills and adjustments for the customer (replaces pending charges)
    const addOnBills = await Transaction.findAll({
      where: {
        customerId,
        companyId: companyId || req.user.companyId,
        isActive: true,
        type: {
          [Op.in]: ["ADD_ON_BILL", "BALANCE_ADJUSTMENT"],
        },
        ...(Object.keys(dateFilter).length > 0 && {
          transactionDate: dateFilter,
        }),
      },
      include: [
        {
          model: User,
          as: "CreatedBy",
          attributes: ["id", "name"],
        },
        {
          model: Invoice,
          attributes: ["id", "invoiceNumber", "type"],
          required: false,
        },
      ],
      order: [["transactionDate", "DESC"]],
    });

    // Combine and sort all activities
    const activities = [];

    // Add invoices
    invoices.forEach((invoice) => {
      activities.push({
        type: "INVOICE",
        id: invoice.id,
        date: invoice.createdAt,
        amount: invoice.amountTotal,
        invoiceType: invoice.type,
        description: `Invoice generated for ${invoice.periodStart || ""} to ${
          invoice.periodEnd || ""
        }`,
        dueDate: invoice.dueDate,
        payments: invoice.Payments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          collectedAt: payment.collectedAt,
          comments: payment.comments,
        })),
      });
    });

    // Add payments
    payments.forEach((payment) => {
      activities.push({
        type: "PAYMENT",
        id: payment.id,
        date: payment.collectedAt,
        amount: payment.amount,
        method: payment.method,
        description: `Payment received via ${payment.method}`,
        collector: payment.collector?.name || "Unknown",
        comments: payment.comments,
        invoiceId: payment.invoiceId,
      });
    });

    // Add add-on bills and adjustments
    addOnBills.forEach((tx) => {
      activities.push({
        type: tx.type === "ADD_ON_BILL" ? "ADD_ON_BILL" : "ADJUSTMENT",
        id: tx.id,
        date: tx.transactionDate,
        amount: tx.amount,
        description: tx.description,
        createdBy: tx.CreatedBy?.name || "Unknown",
        invoice: tx.Invoice
          ? {
              id: tx.Invoice.id,
              invoiceNumber: tx.Invoice.invoiceNumber,
              type: tx.Invoice.type,
            }
          : null,
      });
    });

    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const userHistory = {
      customer: {
        id: customer.id,
        name: customer.fullName,
        customerCode: customer.customerCode,
        phone: customer.phone,
        area: customer.Area?.areaName || "Unknown Area",
      },
      activities,
      summary: {
        totalInvoices: invoices.length,
        totalPayments: payments.length,
        totalAdjustments: addOnBills.filter(
          (t) => t.type === "BALANCE_ADJUSTMENT"
        ).length,
        totalAddOnBills: addOnBills.filter((t) => t.type === "ADD_ON_BILL")
          .length,
        totalAmount: invoices.reduce(
          (sum, inv) => sum + (inv.amountTotal || 0),
          0
        ),
        totalPaid: payments.reduce((sum, pay) => sum + (pay.amount || 0), 0),
        totalAdjustmentsAmount: addOnBills.reduce(
          (sum, tx) => sum + (tx.amount || 0),
          0
        ),
        outstandingBalance:
          addOnBills.length > 0 ? addOnBills[0].balanceAfter : 0, // Current balance from latest transaction
      },
    };

    res.json({
      success: true,
      data: userHistory,
    });
  } catch (error) {
    console.error("Error fetching user history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user history",
      error: error.message,
    });
  }
};

// Get areas for filter dropdown
const getAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({
      where: {
        companyId: req.user.companyId,
      },
      attributes: ["id", "areaName"],
      order: [["areaName", "ASC"]],
    });

    res.json({
      success: true,
      data: areas,
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch areas",
      error: error.message,
    });
  }
};

// Test endpoint to get all invoices without filters
const getAllInvoices = async (req, res) => {
  try {
    console.log("Getting all invoices for company:", req.user.companyId);

    const invoices = await Invoice.findAll({
      where: {
        companyId: req.user.companyId,
      },
      include: [
        {
          model: Customer,
          attributes: ["id", "fullName", "customerCode"],
        },
      ],
      attributes: ["id", "amountTotal", "status", "createdAt"],
      limit: 10,
    });

    console.log("Found invoices:", invoices.length);

    res.json({
      success: true,
      data: {
        invoices: invoices.map((inv) => ({
          id: inv.id,
          amountTotal: inv.amountTotal,
          type: inv.type,
          createdAt: inv.createdAt,
          customer: inv.Customer
            ? {
                id: inv.Customer.id,
                name: inv.Customer.fullName,
                customerCode: inv.Customer.customerCode,
              }
            : null,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching all invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

module.exports = {
  getInvoiceHistory,
  getPaymentHistory,
  getUserHistory,
  getAreas,
  getAllInvoices,
};
