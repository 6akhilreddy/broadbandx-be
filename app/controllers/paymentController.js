const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Area = require("../models/Area");
const User = require("../models/User");

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
        {
          model: Invoice,
          where: {
            status: {
              [Op.in]: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
            },
          },
          required: false,
          order: [["createdAt", "DESC"]],
          limit: 1,
        },
      ],
      attributes: ["id", "fullName", "customerCode", "phone", "areaId"],
      limit: 20,
      order: [["fullName", "ASC"]],
    });

    const customersWithBalance = customers.map((customer) => {
      const latestInvoice = customer.Invoices?.[0];
      const balanceAmount = latestInvoice ? latestInvoice.amountTotal : 0;

      return {
        id: customer.id,
        fullName: customer.fullName,
        customerCode: customer.customerCode,
        phone: customer.phone,
        area: customer.Area?.areaName || "Unknown Area",
        balanceAmount,
        lastBillAmount: latestInvoice?.amountTotal || 0,
        lastPayment: 0, // Will be calculated separately
      };
    });

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
        {
          model: Invoice,
          include: [
            {
              model: Payment,
              order: [["createdAt", "DESC"]],
              limit: 1,
            },
          ],
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const latestInvoice = customer.Invoices?.[0];
    const lastPayment = latestInvoice?.Payments?.[0];

    // Calculate balance
    const balanceAmount = latestInvoice
      ? latestInvoice.amountTotal - (lastPayment?.amount || 0)
      : 0;

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
        amount: lastPayment?.amount || 0,
        date: lastPayment?.collectedAt || null,
      },
      latestInvoice: latestInvoice
        ? {
            id: latestInvoice.id,
            amountTotal: latestInvoice.amountTotal,
            subtotal: latestInvoice.subtotal,
            dueDate: latestInvoice.dueDate,
            status: latestInvoice.status,
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

// Record a payment
const recordPayment = async (req, res) => {
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

    // Find the customer and their latest pending invoice
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
          model: Invoice,
          where: invoiceId
            ? { id: invoiceId }
            : {
                status: {
                  [Op.in]: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
                },
              },
          order: [["createdAt", "DESC"]],
          limit: 1,
        },
      ],
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const invoice = customer.Invoices?.[0];
    if (!invoice) {
      return res.status(400).json({
        success: false,
        message: "No pending invoice found for this customer",
      });
    }

    // Create payment record
    const paymentData = {
      companyId:
        req.user.roleCode === "SUPER_ADMIN"
          ? invoice.companyId
          : req.user.companyId,
      invoiceId: invoice.id,
      collectedBy: req.user.id,
      collectedAt: new Date(),
      method: method.toUpperCase(),
      amount: parseFloat(amount),
      comments: comments || "",
    };

    const payment = await Payment.create(paymentData);

    // Update invoice status
    const totalPaid = await Payment.sum("amount", {
      where: { invoiceId: invoice.id },
    });

    let newStatus = "PARTIALLY_PAID";
    if (totalPaid >= invoice.amountTotal) {
      newStatus = "PAID";
    } else if (invoice.dueDate && new Date() > new Date(invoice.dueDate)) {
      newStatus = "OVERDUE";
    }

    await invoice.update({
      status: newStatus,
      discounts: (invoice.discounts || 0) + (parseFloat(discount) || 0),
    });

    res.json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
        collectedAt: payment.collectedAt,
        invoiceStatus: newStatus,
      },
    });
  } catch (error) {
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
    const whereClause = {};

    // For super admin, don't filter by companyId (can see all payments)
    // For other users, filter by their companyId
    if (req.user.roleCode !== "SUPER_ADMIN") {
      whereClause.companyId = companyId || req.user.companyId;
    } else if (companyId) {
      // Super admin can filter by specific company if provided
      whereClause.companyId = companyId;
    }

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
              where: customerId ? { id: customerId } : {},
              include: [
                {
                  model: Area,
                  where: areaId ? { id: areaId } : {},
                  attributes: ["id", "areaName"],
                },
              ],
              attributes: ["id", "fullName", "customerCode", "areaId"],
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
        area: payment.Invoice.Customer.Area?.areaName || "Unknown Area",
      },
      invoice: {
        id: payment.Invoice.id,
        amountTotal: payment.Invoice.amountTotal,
        status: payment.Invoice.status,
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

module.exports = {
  searchCustomers,
  getCustomerPaymentDetails,
  recordPayment,
  getPaymentHistory,
};
