const express = require("express");
const router = express.Router();
const pendingChargeController = require("../controllers/pendingChargeController");
const { authenticate } = require("../middlewares");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get pending charges for a customer
router.get(
  "/customer/:customerId",
  pendingChargeController.getCustomerPendingCharges
);

// Create a new pending charge
router.post("/", pendingChargeController.createPendingCharge);

// Update a pending charge
router.put("/:id", pendingChargeController.updatePendingCharge);

// Delete a pending charge
router.delete("/:id", pendingChargeController.deletePendingCharge);

// Get pending charges summary for a customer
router.get(
  "/customer/:customerId/summary",
  pendingChargeController.getCustomerPendingChargesSummary
);

module.exports = router;
