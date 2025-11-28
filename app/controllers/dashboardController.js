const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const Area = require("../models/Area");
const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const Transaction = require("../models/Transaction");
const Complaint = require("../models/Complaint");
const { getCurrentBalance } = require("../utils/financeUtils");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const { companyId } = req.query;
    const isAgent = req.user.roleCode === "AGENT";
    const agentId = isAgent ? req.user.id : null;

    // Get company filter - super admin can specify, others use their company
    const companyFilter =
      req.user.roleCode === "SUPER_ADMIN" && companyId
        ? companyId
        : req.user.companyId;

    if (!companyFilter && req.user.roleCode !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );

    // Current month start and end
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Next month start
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Build base where clause for company filtering
    const companyWhere = companyFilter ? { companyId: companyFilter } : {};

    // For agents, filter by collectedBy
    const paymentWhere =
      isAgent && agentId
        ? { ...companyWhere, collectedBy: agentId }
        : companyWhere;

    // 1. totalCollection - total collected amount so far
    const totalCollection =
      (await Payment.sum("amount", {
        where: paymentWhere,
      })) || 0;

    // 2. monthTotalCollection - this month's collection from start
    const monthTotalCollection =
      (await Payment.sum("amount", {
        where: {
          ...paymentWhere,
          collectedAt: {
            [Op.between]: [monthStart, monthEnd],
          },
        },
      })) || 0;

    // 3. todaysCollection - collection amount made today
    const todaysCollection =
      (await Payment.sum("amount", {
        where: {
          ...paymentWhere,
          collectedAt: {
            [Op.between]: [today, todayEnd],
          },
        },
      })) || 0;

    // 4. pendingAmount - total outstanding balance across all customers
    // Calculate by summing all current balances
    const customers = await Customer.findAll({
      where: companyWhere,
      attributes: ["id", "companyId"],
    });

    let pendingAmount = 0;
    for (const customer of customers) {
      const balance = await getCurrentBalance(customer.id, customer.companyId);
      pendingAmount += balance;
    }
    pendingAmount = Math.round(pendingAmount * 100) / 100;

    // 5. todaysRenewals - renewals made today (subscriptions with nextRenewalDate = today)
    const todaysRenewals = await Subscription.count({
      where: {
        ...companyWhere,
        status: "ACTIVE",
        nextRenewalDate: {
          [Op.eq]: today.toISOString().split("T")[0],
        },
      },
    });

    // 6. thisMonthRenewals - renewals that are pending this month
    const thisMonthRenewals = await Subscription.count({
      where: {
        ...companyWhere,
        status: "ACTIVE",
        nextRenewalDate: {
          [Op.between]: [
            monthStart.toISOString().split("T")[0],
            monthEnd.toISOString().split("T")[0],
          ],
        },
      },
    });

    // 7. upcomingRenewals - renewals that are upcoming from next month
    const upcomingRenewals = await Subscription.count({
      where: {
        ...companyWhere,
        status: "ACTIVE",
        nextRenewalDate: {
          [Op.gte]: nextMonthStart.toISOString().split("T")[0],
        },
      },
    });

    // 8. expiredRenewals - renewals that are past the renewal date
    const expiredRenewals = await Subscription.count({
      where: {
        ...companyWhere,
        status: "ACTIVE",
        nextRenewalDate: {
          [Op.lt]: today.toISOString().split("T")[0],
        },
      },
    });

    // 9. totalCustomers
    const totalCustomers = await Customer.count({
      where: companyWhere,
    });

    // 10. totalActiveCustomers
    const totalActiveCustomers = await Customer.count({
      where: {
        ...companyWhere,
        isActive: true,
      },
    });

    // 11. totalInactiveCustomers
    const totalInactiveCustomers = await Customer.count({
      where: {
        ...companyWhere,
        isActive: false,
      },
    });

    // 12. thisMonthNewCustomers
    const thisMonthNewCustomers = await Customer.count({
      where: {
        ...companyWhere,
        createdAt: {
          [Op.between]: [monthStart, monthEnd],
        },
      },
    });

    // 13. followUpCustomers - customers with follow up date = today
    const followUpCustomers = await Customer.count({
      where: {
        ...companyWhere,
        followUpDate: {
          [Op.eq]: today.toISOString().split("T")[0],
        },
      },
    });

    // 14. openComplaints - complaints with status OPEN
    // For agents, filter by assignedAgentId
    const complaintWhere =
      isAgent && agentId
        ? {
            ...companyWhere,
            status: "OPEN",
            isActive: true,
            assignedAgentId: agentId,
          }
        : {
            ...companyWhere,
            status: "OPEN",
            isActive: true,
          };

    const openComplaints = await Complaint.count({
      where: complaintWhere,
    });

    // Charts data

    // Monthly collection trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const trendMonthStart = new Date(
        trendDate.getFullYear(),
        trendDate.getMonth(),
        1
      );
      const trendMonthEnd = new Date(
        trendDate.getFullYear(),
        trendDate.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthCollection =
        (await Payment.sum("amount", {
          where: {
            ...paymentWhere,
            collectedAt: {
              [Op.between]: [trendMonthStart, trendMonthEnd],
            },
          },
        })) || 0;

      monthlyTrend.push({
        month: trendMonthStart.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: monthCollection,
      });
    }

    // Area wise collection (all time)
    const areaWisePayments = await Payment.findAll({
      where: paymentWhere,
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
    areaWisePayments.forEach((payment) => {
      const areaName =
        payment.Invoice?.Customer?.Area?.areaName || "Unknown Area";
      if (!areaStats[areaName]) {
        areaStats[areaName] = 0;
      }
      areaStats[areaName] += payment.amount || 0;
    });

    const areaWiseCollection = Object.entries(areaStats).map(
      ([area, amount]) => ({
        area,
        amount,
      })
    );

    // Plan wise subscriptions (active subscriptions)
    const planWiseSubscriptions = await Subscription.findAll({
      where: {
        ...companyWhere,
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
      if (!planStats[planName]) {
        planStats[planName] = 0;
      }
      planStats[planName]++;
    });

    const planWiseSubscriptionsData = Object.entries(planStats).map(
      ([plan, count]) => ({
        plan,
        count,
      })
    );

    // Build response
    const stats = {
      totalCollection,
      monthTotalCollection,
      todaysCollection,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      todaysRenewals,
      thisMonthRenewals,
      upcomingRenewals,
      expiredRenewals,
      totalCustomers,
      totalActiveCustomers,
      totalInactiveCustomers,
      thisMonthNewCustomers,
      followUpCustomers,
      openComplaints,
    };

    const charts = {
      monthlyTrend,
      areaWiseCollection,
      planWiseSubscriptions: planWiseSubscriptionsData,
    };

    res.json({
      success: true,
      data: {
        stats,
        charts,
      },
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

module.exports = {
  getDashboardStats,
};
