/**
 * Shared billing calculations for customer create, renew, and invoice generation.
 */

const GST_RATES = {
  CGST_SGST: 18, // 9% + 9% on subtotal
  IGST: 18,
};

function getLastDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDateOnly(date) {
  return date.toISOString().split("T")[0];
}

/**
 * Compute billing period end from start date and cycle settings.
 */
function calculatePeriodEnd(startDate, billingCycle, billingCycleValue = 1) {
  const start = new Date(startDate);
  let periodEnd;

  if (billingCycle === "END_OF_MONTH") {
    periodEnd = getLastDayOfMonth(start);
  } else if (billingCycle === "DAILY") {
    periodEnd = new Date(start);
    periodEnd.setDate(periodEnd.getDate() + billingCycleValue - 1);
  } else {
    // MONTHLY
    periodEnd = new Date(start);
    periodEnd.setMonth(periodEnd.getMonth() + billingCycleValue);
    periodEnd.setDate(periodEnd.getDate() - 1);
  }

  return formatDateOnly(periodEnd);
}

/**
 * Next renewal date = day after period end.
 */
function calculateNextRenewalDate(periodEnd) {
  const next = new Date(periodEnd);
  next.setDate(next.getDate() + 1);
  return formatDateOnly(next);
}

/**
 * Cycle multiplier for recurring charges (months or days treated as units).
 */
function getCycleMultiplier(billingCycle, billingCycleValue = 1) {
  return billingCycle === "DAILY" ? billingCycleValue : billingCycleValue;
}

/**
 * Build invoice line items from plan subscriptions and optional fixed bill.
 */
function buildPlanLineItems(subscriptionsWithPlans, fixedBillAmount, cycleMultiplier) {
  const items = [];

  if (fixedBillAmount > 0) {
    const total = Math.round(fixedBillAmount * cycleMultiplier * 100) / 100;
    items.push({
      name: "Fixed Bill Amount",
      quantity: cycleMultiplier,
      unitPrice: fixedBillAmount,
      totalAmount: total,
      itemType: "FIXED_BILL",
    });
    return items;
  }

  for (const sub of subscriptionsWithPlans) {
    const plan = sub.Plan || sub.plan;
    const unitPrice = sub.agreedMonthlyPrice ?? plan?.monthlyPrice ?? 0;
    const qty = sub.quantity || 1;
    const lineMultiplier = cycleMultiplier * qty;
    const totalAmount =
      Math.round(unitPrice * lineMultiplier * 100) / 100;

    items.push({
      name: plan?.name || "Plan",
      quantity: lineMultiplier,
      unitPrice,
      totalAmount,
      itemType: "INTERNET_SERVICE",
      planId: sub.planId,
      subscriptionId: sub.id,
    });
  }

  return items;
}

/**
 * Monthly adjustment: additional charge OR discount (mutually exclusive in UI).
 */
function getMonthlyAdjustment(customer) {
  const charge = parseFloat(customer.monthlyAdditionalCharge) || 0;
  const discount = parseFloat(customer.monthlyDiscount) || 0;
  return charge - discount;
}

/**
 * GST tax amount from subtotal and gst type.
 */
function calculateTaxAmount(subtotal, gstType) {
  if (!gstType || gstType === "NONE") return 0;
  const rate = GST_RATES[gstType] || 0;
  return Math.round(subtotal * (rate / 100) * 100) / 100;
}

/**
 * Full invoice breakdown for a billing period.
 */
function calculateInvoiceTotals(customer, subscriptionsWithPlans, cycleMultiplier) {
  const fixedBill = parseFloat(customer.fixedBillAmount) || 0;
  const items = buildPlanLineItems(
    subscriptionsWithPlans,
    fixedBill,
    cycleMultiplier
  );

  let plansSubtotal = items.reduce((sum, i) => sum + i.totalAmount, 0);
  const monthlyAdj = getMonthlyAdjustment(customer);
  const adjustmentTotal =
    Math.round(monthlyAdj * cycleMultiplier * 100) / 100;

  if (adjustmentTotal !== 0) {
    items.push({
      name: adjustmentTotal >= 0 ? "Additional Charge" : "Discount",
      quantity: 1,
      unitPrice: Math.abs(adjustmentTotal),
      totalAmount: adjustmentTotal,
      itemType: adjustmentTotal >= 0 ? "ADDITIONAL" : "DISCOUNT",
    });
  }

  const subtotal =
    Math.round((plansSubtotal + adjustmentTotal) * 100) / 100;
  const taxAmount = calculateTaxAmount(subtotal, customer.gstType);
  const amountBeforeOpening = Math.round((subtotal + taxAmount) * 100) / 100;

  return {
    items,
    subtotal,
    taxAmount,
    discounts: monthlyAdj < 0 ? Math.abs(adjustmentTotal) : 0,
    amountBeforeOpening,
    amountTotal: amountBeforeOpening, // opening applied via balance ledger
  };
}

/**
 * Apply opening balance to invoice total (for display / when no ledger entry yet).
 */
function applyOpeningBalanceToTotal(amount, openingBalance, openingBalanceType) {
  const ob = parseFloat(openingBalance) || 0;
  if (ob <= 0) return amount;
  if (openingBalanceType === "ADVANCE") {
    return Math.max(0, Math.round((amount - ob) * 100) / 100);
  }
  // OUTSTANDING
  return Math.round((amount + ob) * 100) / 100;
}

/**
 * Helper text for billing UI (mirrors reference app).
 */
function getBillingHelperTexts(customer, periodStart, periodEnd) {
  const ob = parseFloat(customer.openingBalance) || 0;
  const adj = getMonthlyAdjustment(customer);
  const cycleVal = customer.billingCycleValue || 1;
  const startFmt = periodStart
    ? new Date(periodStart).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const openingText =
    ob > 0
      ? customer.openingBalanceType === "ADVANCE"
        ? `Automatic Bills will be generated from ${startFmt} and ₹ ${ob} will be subtracted from bill`
        : `Automatic Bills will be generated from ${startFmt} and ₹ ${ob} will be added to bill`
      : `Automatic Bills will be generated from ${startFmt}`;

  const adjText =
    adj >= 0
      ? `₹ ${Math.abs(adj)} will be added to every bill`
      : `₹ ${Math.abs(adj)} will be subtracted from every bill`;

  let durationText = "";
  if (customer.billingCycle === "END_OF_MONTH") {
    durationText = "Bill will be generated automatically at the end of month.";
  } else if (customer.billingCycle === "DAILY") {
    durationText = `Bill will be generated automatically after every ${cycleVal} day(s).`;
  } else {
    durationText = `Bill will be generated automatically after every ${cycleVal} month(s).`;
  }

  const billTypeText =
    customer.billingType === "PREPAID" ? "Advance Billing." : "Normal Billing.";

  return { openingText, adjText, durationText, billTypeText };
}

/**
 * Generate next billing number for a company.
 */
async function getNextBillingNumber(Customer, companyId) {
  const maxRow = await Customer.findOne({
    where: { companyId },
    attributes: ["billingNumber"],
    order: [["billingNumber", "DESC"]],
  });
  return (maxRow?.billingNumber || 0) + 1;
}

module.exports = {
  calculatePeriodEnd,
  calculateNextRenewalDate,
  getCycleMultiplier,
  buildPlanLineItems,
  getMonthlyAdjustment,
  calculateTaxAmount,
  calculateInvoiceTotals,
  applyOpeningBalanceToTotal,
  getBillingHelperTexts,
  getNextBillingNumber,
  getLastDayOfMonth,
};
