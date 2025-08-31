const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Area = require("../models/Area");
const User = require("../models/User");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const { month, year, companyId } = req.query;

    // Set date range for current month if not specified
    let startDate, endDate;
    if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const companyFilter = companyId || req.user.companyId;

    // Global Statistics (All Time)
    const globalStats = {
      totalCustomers: await Customer.count({
        where: { companyId: companyFilter },
      }),
      totalCollected:
        (await Payment.sum("amount", {
          where: { companyId: companyFilter },
        })) || 0,
      totalPlans: await Plan.count({
        where: { companyId: companyFilter },
      }),
      totalAgents: await User.count({
        where: {
          companyId: companyFilter,
          roleId: 3, // Assuming roleId 3 is for agents
        },
      }),
    };

    // Monthly Statistics (Filtered by month/year)
    const monthlyStats = {
      newCustomersThisMonth: await Customer.count({
        where: {
          companyId: companyFilter,
          createdAt: {
            [Op.between]: [startDate, endDate],
          },
        },
      }),
      totalInvoiceAmountThisMonth:
        (await Invoice.sum("amountTotal", {
          where: {
            companyId: companyFilter,
            periodStart: {
              [Op.between]: [startDate, endDate],
            },
          },
        })) || 0,
      totalCollectedThisMonth:
        (await Payment.sum("amount", {
          where: {
            companyId: companyFilter,
            collectedAt: {
              [Op.between]: [startDate, endDate],
            },
          },
        })) || 0,
      pendingAmountThisMonth:
        (await Invoice.sum("amountTotal", {
          where: {
            companyId: companyFilter,
            status: {
              [Op.in]: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
            },
            periodStart: {
              [Op.between]: [startDate, endDate],
            },
          },
        })) || 0,
    };

    // Get total collected amount for the month
    const totalCollected = await Payment.sum("amount", {
      where: {
        companyId: companyFilter,
        collectedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Get total amount that should be collected this month
    const totalToCollect = await Invoice.sum("amountTotal", {
      where: {
        companyId: companyFilter,
        periodStart: {
          [Op.between]: [startDate, endDate],
        },
      },
    });

    // Get pending amount
    const pendingAmount = await Invoice.sum("amountTotal", {
      where: {
        companyId: companyFilter,
        status: {
          [Op.in]: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
        },
      },
    });

    // Get total payments made
    const totalPayments = await Payment.sum("amount", {
      where: {
        companyId: companyFilter,
      },
    });

    // Get area-wise collection
    const areaWiseCollection = await Payment.findAll({
      where: {
        companyId: companyFilter,
        collectedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
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
            },
          ],
        },
      ],
    });

    const areaStats = {};
    areaWiseCollection.forEach((payment) => {
      const areaName =
        payment.Invoice.Customer.Area?.areaName || "Unknown Area";
      if (!areaStats[areaName]) {
        areaStats[areaName] = 0;
      }
      areaStats[areaName] += payment.amount || 0;
    });

    // Get agent-wise collection
    const agentWiseCollection = await Payment.findAll({
      where: {
        companyId: companyFilter,
        collectedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: User,
          as: "collector",
          attributes: ["id", "name"],
        },
      ],
    });

    const agentStats = {};
    agentWiseCollection.forEach((payment) => {
      const agentName = payment.collector?.name || "Unknown Agent";
      if (!agentStats[agentName]) {
        agentStats[agentName] = 0;
      }
      agentStats[agentName] += payment.amount || 0;
    });

    // Get plan-wise subscription count
    const planWiseSubscriptions = await Subscription.findAll({
      where: {
        companyId: companyFilter,
        status: "ACTIVE",
      },
      include: [
        {
          model: Plan,
          attributes: ["id", "name"],
        },
      ],
    });

    const planStats = {};
    planWiseSubscriptions.forEach((subscription) => {
      const planName = subscription.Plan?.name || "Unknown Plan";
      const billingCycle = subscription.billingCycle || "Unknown";
      const key = `${planName} (${billingCycle})`;

      if (!planStats[key]) {
        planStats[key] = 0;
      }
      planStats[key]++;
    });

    // Get monthly collection trend (whole year)
    const monthlyTrend = [];
    const currentYear = new Date().getFullYear();

    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(currentYear, month, 1);
      const monthEnd = new Date(currentYear, month + 1, 0, 23, 59, 59);

      const monthCollection = await Payment.sum("amount", {
        where: {
          companyId: companyFilter,
          collectedAt: {
            [Op.between]: [monthStart, monthEnd],
          },
        },
      });

      monthlyTrend.push({
        month: monthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: monthCollection || 0,
      });
    }

    // Get payment method breakdown
    const paymentMethodBreakdown = await Payment.findAll({
      where: {
        companyId: companyFilter,
        collectedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      attributes: [
        "method",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      ],
      group: ["method"],
    });

    const stats = {
      globalStats,
      monthlyStats,
      overview: {
        totalCustomers: globalStats.totalCustomers,
        totalCollected: totalCollected || 0,
        totalToCollect: totalToCollect || 0,
        pendingAmount: pendingAmount || 0,
        totalPayments: totalPayments || 0,
        collectionRate:
          totalToCollect > 0
            ? (((totalCollected || 0) / totalToCollect) * 100).toFixed(2)
            : 0,
      },
      charts: {
        areaWiseCollection: Object.entries(areaStats).map(([area, amount]) => ({
          area,
          amount,
        })),
        agentWiseCollection: Object.entries(agentStats).map(
          ([agent, amount]) => ({
            agent,
            amount,
          })
        ),
        planWiseSubscriptions: Object.entries(planStats).map(
          ([plan, count]) => ({
            plan,
            count,
          })
        ),
        monthlyTrend,
        paymentMethodBreakdown: paymentMethodBreakdown.map((item) => ({
          method: item.method,
          count: parseInt(item.dataValues.count),
          amount: parseFloat(item.dataValues.totalAmount) || 0,
        })),
      },
      dateRange: {
        startDate,
        endDate,
      },
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Get area-wise collection for specific month
const getAreaWiseCollection = async (req, res) => {
  try {
    const { month, year, companyId } = req.query;

    let startDate, endDate;
    if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const companyFilter = companyId || req.user.companyId;

    const areaWiseCollection = await Payment.findAll({
      where: {
        companyId: companyFilter,
        collectedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
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
            },
          ],
        },
      ],
    });

    const areaStats = {};
    areaWiseCollection.forEach((payment) => {
      const areaName =
        payment.Invoice.Customer.Area?.areaName || "Unknown Area";
      if (!areaStats[areaName]) {
        areaStats[areaName] = {
          area: areaName,
          amount: 0,
          customers: new Set(),
        };
      }
      areaStats[areaName].amount += payment.amount || 0;
      areaStats[areaName].customers.add(payment.Invoice.Customer.id);
    });

    const result = Object.values(areaStats).map((stat) => ({
      area: stat.area,
      amount: stat.amount,
      customerCount: stat.customers.size,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching area-wise collection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch area-wise collection",
      error: error.message,
    });
  }
};

// Get agent-wise collection for specific month
const getAgentWiseCollection = async (req, res) => {
  try {
    const { month, year, companyId } = req.query;

    let startDate, endDate;
    if (month && year) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const companyFilter = companyId || req.user.companyId;

    const agentWiseCollection = await Payment.findAll({
      where: {
        companyId: companyFilter,
        collectedAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: User,
          as: "collector",
          attributes: ["id", "name"],
        },
      ],
    });

    const agentStats = {};
    agentWiseCollection.forEach((payment) => {
      const agentName = payment.collector?.name || "Unknown Agent";
      if (!agentStats[agentName]) {
        agentStats[agentName] = {
          agent: agentName,
          amount: 0,
          payments: 0,
        };
      }
      agentStats[agentName].amount += payment.amount || 0;
      agentStats[agentName].payments++;
    });

    const result = Object.values(agentStats);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching agent-wise collection:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch agent-wise collection",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAreaWiseCollection,
  getAgentWiseCollection,
};
