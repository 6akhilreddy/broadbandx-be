const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { authenticate } = require("../middlewares");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get customer transaction history
router.get(
  "/customer/:customerId",
  transactionController.getCustomerTransactions
);

// Create a new transaction
router.post("/", transactionController.createTransaction);

// Get transaction statistics for a customer
router.get(
  "/customer/:customerId/stats",
  transactionController.getCustomerTransactionStats
);

module.exports = router;
