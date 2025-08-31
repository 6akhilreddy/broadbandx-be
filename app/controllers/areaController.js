const Area = require("../models/Area");
const { Op } = require("sequelize");

// Get all Areas for a company
exports.getAllAreas = async (req, res) => {
  try {
    const { companyId, search = "" } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const whereClause = { companyId };

    // Add search filter
    if (search) {
      whereClause.areaName = { [Op.iLike]: `%${search}%` };
    }

    const areas = await Area.findAll({
      where: whereClause,
      order: [["areaName", "ASC"]],
    });

    res.json(areas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Area by ID
exports.getAreaById = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const area = await Area.findOne({
      where: { id: req.params.id, companyId },
    });

    if (!area) {
      return res.status(404).json({ error: "Area not found" });
    }

    res.json(area);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create Area
exports.createArea = async (req, res) => {
  try {
    const { companyId, areaName, createdBy } = req.body;

    if (!companyId || !areaName || !createdBy) {
      return res
        .status(400)
        .json({ error: "Company ID, area name, and created by are required" });
    }

    const area = await Area.create({
      companyId,
      areaName,
      createdBy,
    });

    res.status(201).json(area);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update Area
exports.updateArea = async (req, res) => {
  try {
    const { companyId, areaName } = req.body;

    if (!companyId || !areaName) {
      return res
        .status(400)
        .json({ error: "Company ID and area name are required" });
    }

    const area = await Area.findOne({
      where: { id: req.params.id, companyId },
    });

    if (!area) {
      return res.status(404).json({ error: "Area not found" });
    }

    await area.update({ areaName });
    res.json(area);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Area
exports.deleteArea = async (req, res) => {
  try {
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: "Company ID is required" });
    }

    const area = await Area.findOne({
      where: { id: req.params.id, companyId },
    });

    if (!area) {
      return res.status(404).json({ error: "Area not found" });
    }

    await area.destroy();
    res.json({ message: "Area deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
