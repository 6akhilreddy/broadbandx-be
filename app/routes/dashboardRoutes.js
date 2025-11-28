const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get dashboard statistics
router.get("/stats", dashboardController.getDashboardStats);

module.exports = router;
