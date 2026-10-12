const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const {
  companyFilter,
  requirePermission,
  requirePermissionWithCompany,
} = require("../middlewares");

// Get all inventory with filters, search, and KPI summaries
router.get(
  "/",
  ...requirePermission("inventory.view"),
  ...companyFilter,
  inventoryController.getInventory
);

// Get available inventory for selection in Add Customer and Replace Modal
router.get(
  "/available",
  ...requirePermission("inventory.view"),
  ...companyFilter,
  inventoryController.getAvailableInventory
);

// Get inventory item by ID
router.get(
  "/:id",
  ...requirePermission("inventory.view"),
  ...companyFilter,
  inventoryController.getInventoryById
);

// Add new hardware to inventory
router.post(
  "/",
  ...requirePermissionWithCompany("inventory.add"),
  inventoryController.createHardware
);

// Update inventory item
router.put(
  "/:id",
  ...requirePermissionWithCompany("inventory.edit"),
  inventoryController.updateHardware
);

// Replace hardware for a customer
router.post(
  "/:id/replace",
  ...requirePermissionWithCompany("inventory.edit"),
  inventoryController.replaceHardware
);

// Delete / Deactivate inventory item
router.delete(
  "/:id",
  ...requirePermissionWithCompany("inventory.delete"),
  inventoryController.deleteHardware
);

module.exports = router;
