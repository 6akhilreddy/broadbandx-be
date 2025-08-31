const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get dashboard statistics
router.get("/stats", dashboardController.getDashboardStats);

// Get area-wise collection
router.get("/area-collection", dashboardController.getAreaWiseCollection);

// Get agent-wise collection
router.get("/agent-collection", dashboardController.getAgentWiseCollection);

module.exports = router;
