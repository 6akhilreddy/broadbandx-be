const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Area = require("../models/Area");
const User = require("../models/User");
const Company = require("../models/Company");

// Get collection data with filters
const getCollectionData = async (req, res) => {
  try {
    const { startDate, endDate, areaId, paymentMethod, companyId } = req.query;

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
    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Invoice,
          include: [
            {
              model: Customer,
              include: [
                {
                  model: Area,
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
    });

    // Filter payments by area if areaId is specified
    const filteredPayments = areaId
      ? payments.filter(
          (payment) =>
            payment.Invoice.Customer.Area &&
            payment.Invoice.Customer.Area.id == areaId
        )
      : payments;

    // Group by date
    const groupedByDate = filteredPayments.reduce((acc, payment) => {
      const date = payment.collectedAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          totalCustomers: 0,
          totalAmount: 0,
          totalDiscount: 0,
          totalPayment: 0,
          paymentsByMethod: {},
          customers: [],
        };
      }

      const customer = payment.Invoice.Customer;
      const area = customer.Area;
      const collector = payment.collector;

      // Add to totals
      acc[date].totalCustomers++;
      acc[date].totalAmount += payment.amount || 0;
      acc[date].totalDiscount += payment.Invoice.discounts || 0;
      acc[date].totalPayment +=
        (payment.amount || 0) + (payment.Invoice.discounts || 0);

      // Group by payment method
      if (!acc[date].paymentsByMethod[payment.method]) {
        acc[date].paymentsByMethod[payment.method] = {
          method: payment.method,
          customers: 0,
          amount: 0,
          discount: 0,
          payment: 0,
        };
      }

      acc[date].paymentsByMethod[payment.method].customers++;
      acc[date].paymentsByMethod[payment.method].amount += payment.amount || 0;
      acc[date].paymentsByMethod[payment.method].discount +=
        payment.Invoice.discounts || 0;
      acc[date].paymentsByMethod[payment.method].payment +=
        (payment.amount || 0) + (payment.Invoice.discounts || 0);

      // Add customer details with null checks
      acc[date].customers.push({
        id: customer.id,
        name: customer.fullName,
        area: area ? area.areaName : "Unknown Area",
        previousBalance: payment.Invoice.subtotal || 0,
        paidAmount: payment.amount || 0,
        discount: payment.Invoice.discounts || 0,
        currentBalance: (payment.Invoice.subtotal || 0) - (payment.amount || 0),
        collectedBy: collector ? collector.name : "Unknown Collector",
        customerCode: customer.customerCode,
        paymentMethod: payment.method,
        collectedAt: payment.collectedAt,
      });

      return acc;
    }, {});

    // Convert to array and sort by date (descending)
    const result = Object.values(groupedByDate).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching collection data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collection data",
      error: error.message,
    });
  }
};

// Get collection summary statistics
const getCollectionSummary = async (req, res) => {
  try {
    const { startDate, endDate, areaId, paymentMethod, companyId } = req.query;

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
    const payments = await Payment.findAll({
      where: whereClause,
      include: [
        {
          model: Invoice,
          include: [
            {
              model: Customer,
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
      ],
    });

    // Calculate summary statistics
    const totalPaid = payments.reduce(
      (sum, payment) => sum + (payment.amount || 0),
      0
    );
    const totalDiscount = payments.reduce(
      (sum, payment) => sum + (payment.Invoice.discounts || 0),
      0
    );

    // Get all invoices for the period to calculate total amount that should be collected
    const allInvoices = await Invoice.findAll({
      where: {
        companyId: companyId || req.user.companyId,
        ...(startDate && endDate
          ? {
              periodStart: {
                [Op.between]: [
                  new Date(startDate),
                  new Date(endDate + " 23:59:59"),
                ],
              },
            }
          : {}),
      },
      include: [
        {
          model: Customer,
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
    });

    const totalPayments = allInvoices.reduce((sum, invoice) => {
      return sum + (invoice.amountTotal || 0);
    }, 0);

    const totalCustomers = payments.length;

    // Get pending invoices for balance calculation
    const pendingInvoices = await Invoice.findAll({
      where: {
        companyId: companyId || req.user.companyId,
        status: {
          [Op.in]: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
      include: [
        {
          model: Customer,
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
    });

    const totalBalanceToCollect = pendingInvoices.reduce((sum, invoice) => {
      return sum + (invoice.amountTotal || 0);
    }, 0);

    // Get payment method breakdown
    const paymentMethodBreakdown = payments.reduce((acc, payment) => {
      const method = payment.method;
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          amount: 0,
        };
      }
      acc[method].count++;
      acc[method].amount += payment.amount || 0;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalPaid,
        totalDiscount,
        totalPayments,
        totalCustomers,
        totalBalanceToCollect,
        paymentMethodBreakdown: Object.values(paymentMethodBreakdown),
      },
    });
  } catch (error) {
    console.error("Error fetching collection summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collection summary",
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

module.exports = {
  getCollectionData,
  getCollectionSummary,
  getAreas,
};
