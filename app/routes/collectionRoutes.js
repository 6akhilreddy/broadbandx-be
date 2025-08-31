const express = require("express");
const router = express.Router();
const collectionController = require("../controllers/collectionController");
const { authenticate } = require("../middlewares/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticate);

// Get collection data with filters
router.get("/data", collectionController.getCollectionData);

// Get collection summary statistics
router.get("/summary", collectionController.getCollectionSummary);

// Get areas for filter dropdown
router.get("/areas", collectionController.getAreas);

module.exports = router;
