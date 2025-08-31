const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get invoice history
router.get("/invoices", reportController.getInvoiceHistory);

// Get payment history
router.get("/payments", reportController.getPaymentHistory);

// Get user history
router.get("/user/:customerId", reportController.getUserHistory);

// Get areas for filter dropdown
router.get("/areas", reportController.getAreas);

// Test endpoint to get all invoices
router.get("/all-invoices", reportController.getAllInvoices);

module.exports = router;
