const Subscription = require("../models/Subscription");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");
const Transaction = require("../models/Transaction");
const {
  getCurrentBalance,
  generateInvoiceNumber,
} = require("../utils/financeUtils");
const {
  calculatePeriodEnd,
  calculateNextRenewalDate,
  getCycleMultiplier,
  calculateInvoiceTotals,
  getNextBillingNumber,
} = require("../utils/billingUtils");

/**
 * Normalize plan lines from API (supports planLines or legacy subscription/subscriptions).
 */
function normalizePlanLines(body) {
  if (body.planLines?.length) {
    const merged = new Map();
    for (const line of body.planLines) {
      const planId = parseInt(line.planId, 10);
      if (!planId) continue;
      const qty = parseInt(line.quantity, 10) || 1;
      const existing = merged.get(planId);
      if (existing) {
        existing.quantity += qty;
        if (line.agreedMonthlyPrice != null) {
          existing.agreedMonthlyPrice = parseFloat(line.agreedMonthlyPrice);
        }
      } else {
        merged.set(planId, {
          planId,
          quantity: qty,
          agreedMonthlyPrice:
            line.agreedMonthlyPrice != null
              ? parseFloat(line.agreedMonthlyPrice)
              : null,
        });
      }
    }
    return [...merged.values()];
  }

  if (body.subscriptions?.length) {
    return body.subscriptions.map((s) => ({
      planId: parseInt(s.planId, 10),
      quantity: parseInt(s.quantity, 10) || 1,
      agreedMonthlyPrice:
        s.agreedMonthlyPrice != null
          ? parseFloat(s.agreedMonthlyPrice)
          : s.monthlyPrice != null
            ? parseFloat(s.monthlyPrice)
            : null,
    }));
  }

  if (body.subscription?.planId) {
    return [
      {
        planId: parseInt(body.subscription.planId, 10),
        quantity: parseInt(body.subscription.quantity, 10) || 1,
        agreedMonthlyPrice:
          body.subscription.agreedMonthlyPrice != null
            ? parseFloat(body.subscription.agreedMonthlyPrice)
            : null,
      },
    ];
  }

  return [];
}

async function createPlanSubscriptions(
  customer,
  planLines,
  companyId,
  billingStartDate,
  dbTransaction
) {
  const created = [];

  for (const line of planLines) {
    const plan = await Plan.findOne({
      where: { id: line.planId, companyId },
      transaction: dbTransaction,
    });
    if (!plan) continue;

    const periodEnd = calculatePeriodEnd(
      billingStartDate,
      customer.billingCycle,
      customer.billingCycleValue
    );
    const nextRenewal = calculateNextRenewalDate(periodEnd);

    const sub = await Subscription.create(
      {
        companyId,
        customerId: customer.id,
        planId: line.planId,
        quantity: line.quantity || 1,
        startDate: billingStartDate,
        lastRenewalDate: billingStartDate,
        nextRenewalDate: nextRenewal,
        agreedMonthlyPrice:
          line.agreedMonthlyPrice != null
            ? line.agreedMonthlyPrice
            : plan.monthlyPrice,
        status: "ACTIVE",
      },
      { transaction: dbTransaction }
    );
    sub.Plan = plan;
    created.push(sub);
  }

  return created;
}

async function createOpeningBalanceTransaction(
  customer,
  companyId,
  createdBy,
  dbTransaction
) {
  const amount = parseFloat(customer.openingBalance) || 0;
  if (amount <= 0) return null;

  // Advance is applied on the first invoice; only outstanding gets a ledger entry here
  if (customer.openingBalanceType === "ADVANCE") return null;

  const direction = "DEBIT";
  const balanceBefore = 0;
  const balanceAfter = amount;

  return Transaction.create(
    {
      companyId,
      customerId: customer.id,
      type: "BALANCE_ADJUSTMENT",
      direction,
      amount,
      balanceBefore,
      balanceAfter,
      description: `Opening outstanding balance ₹${amount}`,
      referenceType: "opening_balance",
      transactionDate: new Date(),
      createdBy,
    },
    { transaction: dbTransaction }
  );
}

async function generateInitialInvoice(
  customer,
  subscriptionsWithPlans,
  req,
  dbTransaction
) {
  const companyId =
    req.userRoleCode !== "SUPER_ADMIN" && req.userCompanyId
      ? req.userCompanyId
      : customer.companyId;

  const billingStartDate =
    customer.billingStartDate ||
    subscriptionsWithPlans[0]?.startDate ||
    new Date().toISOString().split("T")[0];

  const periodEnd = calculatePeriodEnd(
    billingStartDate,
    customer.billingCycle,
    customer.billingCycleValue
  );
  const cycleMultiplier = getCycleMultiplier(
    customer.billingCycle,
    customer.billingCycleValue
  );

  const totals = calculateInvoiceTotals(
    customer,
    subscriptionsWithPlans,
    cycleMultiplier
  );

  const prevBalance = await getCurrentBalance(customer.id, companyId);
  let periodCharges = totals.amountBeforeOpening;
  const openingAmount = parseFloat(customer.openingBalance) || 0;
  if (openingAmount > 0 && customer.openingBalanceType === "ADVANCE") {
    periodCharges = Math.max(
      0,
      Math.round((periodCharges - openingAmount) * 100) / 100
    );
  }
  const invoiceAmount =
    Math.round((periodCharges + (prevBalance > 0 ? prevBalance : 0)) * 100) / 100;

  const balanceBefore = prevBalance;
  const balanceAfter = Math.round((balanceBefore + periodCharges) * 100) / 100;

  const invoiceItems = [...totals.items];
  if (prevBalance > 0) {
    invoiceItems.push({
      name: "Previous Balance",
      quantity: 1,
      unitPrice: prevBalance,
      totalAmount: prevBalance,
      itemType: "PREV_BALANCE",
    });
  }

  const invoiceTransaction = await Transaction.create(
    {
      companyId,
      customerId: customer.id,
      type: "INVOICE",
      direction: "DEBIT",
      amount: periodCharges,
      balanceBefore,
      balanceAfter,
      description: `Subscription invoice ${billingStartDate} to ${periodEnd}`,
      referenceType: "invoice",
      transactionDate: new Date(),
      createdBy: req.user.id,
    },
    { transaction: dbTransaction }
  );

  const invoice = await Invoice.create(
    {
      transactionId: invoiceTransaction.id,
      invoiceNumber: generateInvoiceNumber(),
      type: "SUBSCRIPTION",
      companyId,
      customerId: customer.id,
      subscriptionId: subscriptionsWithPlans[0]?.id || null,
      periodStart: billingStartDate,
      periodEnd,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discounts: totals.discounts,
      amountTotal: invoiceAmount,
      prevBalance: prevBalance > 0 ? prevBalance : null,
      items: invoiceItems,
      dueDate: periodEnd,
    },
    { transaction: dbTransaction }
  );

  await invoiceTransaction.update(
    { referenceId: invoice.id },
    { transaction: dbTransaction }
  );

  return invoice;
}

async function renewCustomerBilling(customer, subscriptions, companyId, createdBy, dbTransaction) {
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
  if (!activeSubs.length) {
    throw new Error("No active subscriptions");
  }

  const periodStart =
    activeSubs[0].nextRenewalDate || new Date().toISOString().split("T")[0];
  const periodEnd = calculatePeriodEnd(
    periodStart,
    customer.billingCycle,
    customer.billingCycleValue
  );
  const nextRenewal = calculateNextRenewalDate(periodEnd);
  const cycleMultiplier = getCycleMultiplier(
    customer.billingCycle,
    customer.billingCycleValue
  );

  const totals = calculateInvoiceTotals(customer, activeSubs, cycleMultiplier);
  const prevBalance = await getCurrentBalance(customer.id, companyId);
  const periodCharges = totals.amountBeforeOpening;
  const invoiceAmount =
    Math.round((periodCharges + (prevBalance > 0 ? prevBalance : 0)) * 100) /
    100;
  const balanceAfter = Math.round((prevBalance + periodCharges) * 100) / 100;

  for (const sub of activeSubs) {
    await sub.update(
      {
        lastRenewalDate: periodStart,
        nextRenewalDate: nextRenewal,
      },
      { transaction: dbTransaction }
    );
  }

  const invoiceItems = [...totals.items];
  if (prevBalance > 0) {
    invoiceItems.push({
      name: "Previous Balance",
      quantity: 1,
      unitPrice: prevBalance,
      totalAmount: prevBalance,
      itemType: "PREV_BALANCE",
    });
  }

  const invoiceTransaction = await Transaction.create(
    {
      companyId,
      customerId: customer.id,
      type: "INVOICE",
      direction: "DEBIT",
      amount: periodCharges,
      balanceBefore: prevBalance,
      balanceAfter,
      description: `Subscription invoice ${periodStart} to ${periodEnd}`,
      referenceType: "invoice",
      transactionDate: new Date(),
      createdBy,
    },
    { transaction: dbTransaction }
  );

  const invoice = await Invoice.create(
    {
      transactionId: invoiceTransaction.id,
      invoiceNumber: generateInvoiceNumber(),
      type: "SUBSCRIPTION",
      companyId,
      customerId: customer.id,
      subscriptionId: activeSubs[0].id,
      periodStart,
      periodEnd,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      discounts: totals.discounts,
      amountTotal: invoiceAmount,
      prevBalance: prevBalance > 0 ? prevBalance : null,
      items: invoiceItems,
      dueDate: periodEnd,
    },
    { transaction: dbTransaction }
  );

  await invoiceTransaction.update(
    { referenceId: invoice.id },
    { transaction: dbTransaction }
  );

  return { invoice, invoiceTransaction, subscriptions: activeSubs };
}

module.exports = {
  normalizePlanLines,
  createPlanSubscriptions,
  createOpeningBalanceTransaction,
  generateInitialInvoice,
  renewCustomerBilling,
  getNextBillingNumber,
};
