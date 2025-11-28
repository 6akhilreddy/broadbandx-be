const express = require("express");
const router = express.Router();
const complaintController = require("../controllers/complaintController");
const {
  companyFilter,
  requirePermission,
  requirePermissionWithCompany,
} = require("../middlewares");

// Create a new complaint
router.post(
  "/",
  ...requirePermissionWithCompany("complaint.add"),
  complaintController.createComplaint
);

// Get all complaints with filters
router.get(
  "/",
  ...requirePermission("complaints.view"),
  ...companyFilter,
  complaintController.getAllComplaints
);

// Search customers for complaint creation
router.get(
  "/search-customers",
  ...requirePermission("complaint.add"),
  complaintController.searchCustomers
);

// Get complaint by ID
router.get(
  "/:id",
  ...requirePermission("complaints.view"),
  ...companyFilter,
  complaintController.getComplaintById
);

// Update complaint
router.put(
  "/:id",
  ...requirePermissionWithCompany("complaint.edit"),
  complaintController.updateComplaint
);

// Delete complaint
router.delete(
  "/:id",
  ...requirePermissionWithCompany("complaint.delete"),
  complaintController.deleteComplaint
);

// Get comments for a complaint
router.get(
  "/:id/comments",
  ...requirePermission("complaints.view"),
  ...companyFilter,
  complaintController.getComplaintComments
);

// Add comment to a complaint
router.post(
  "/:id/comments",
  ...requirePermissionWithCompany("complaint.add"),
  complaintController.addComplaintComment
);

// Delete comment
router.delete(
  "/:id/comments/:commentId",
  ...requirePermissionWithCompany("complaint.edit"),
  complaintController.deleteComplaintComment
);

module.exports = router;
