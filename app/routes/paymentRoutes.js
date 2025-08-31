const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Search customers for payment recording
router.get("/search-customers", paymentController.searchCustomers);

// Get customer payment details
router.get(
  "/customer/:customerId",
  paymentController.getCustomerPaymentDetails
);

// Record a payment
router.post("/record", paymentController.recordPayment);

// Get payment history
router.get("/history", paymentController.getPaymentHistory);

module.exports = router;
