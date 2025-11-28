const { Transaction } = require("../models");
const { Op } = require("sequelize");

/**
 * Get current balance for a customer
 * @param {number} customerId
 * @param {number} companyId
 * @returns {Promise<number>} Current balance
 */
async function getCurrentBalance(customerId, companyId) {
  const latestTransaction = await Transaction.findOne({
    where: {
      customerId,
      companyId,
      isActive: true,
    },
    order: [
      ["transactionDate", "DESC"],
      ["id", "DESC"],
    ],
  });

  return latestTransaction?.balanceAfter || 0;
}

/**
 * Generate invoice number
 * @returns {string} Invoice number
 */
function generateInvoiceNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
}

/**
 * Generate payment number
 * @returns {string} Payment number
 */
function generatePaymentNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PAY-${timestamp}-${random}`;
}

/**
 * Recalculate balances for all transactions after a deleted transaction
 * @param {number} customerId
 * @param {number} companyId
 * @param {number} deletedTransactionId - ID of the deleted transaction
 * @returns {Promise<void>}
 */
async function recalculateBalances(
  customerId,
  companyId,
  deletedTransactionId
) {
  // Get the deleted transaction to know its date and balanceBefore
  const deletedTransaction = await Transaction.findOne({
    where: {
      id: deletedTransactionId,
      customerId,
      companyId,
    },
  });

  if (!deletedTransaction) return;

  // Get all active transactions that come after the deleted transaction chronologically
  // We need to recalculate all transactions with transactionDate >= deleted transaction's date
  // or if same date, with id > deleted transaction's id
  const transactions = await Transaction.findAll({
    where: {
      customerId,
      companyId,
      isActive: true,
      [Op.or]: [
        {
          transactionDate: {
            [Op.gt]: deletedTransaction.transactionDate,
          },
        },
        {
          transactionDate: deletedTransaction.transactionDate,
          id: { [Op.gt]: deletedTransactionId },
        },
      ],
    },
    order: [
      ["transactionDate", "ASC"],
      ["id", "ASC"],
    ],
  });

  if (transactions.length === 0) return;

  // The balance before the first transaction to recalculate should be
  // the balanceBefore of the deleted transaction (since we're removing it)
  let runningBalance = deletedTransaction.balanceBefore || 0;

  // Recalculate each transaction's balance
  for (const tx of transactions) {
    const balanceBefore = runningBalance;

    if (tx.direction === "DEBIT") {
      runningBalance += tx.amount;
    } else {
      runningBalance = Math.max(0, runningBalance - tx.amount);
    }

    await tx.update({
      balanceBefore,
      balanceAfter: runningBalance,
    });
  }
}

module.exports = {
  getCurrentBalance,
  generateInvoiceNumber,
  generatePaymentNumber,
  recalculateBalances,
};
