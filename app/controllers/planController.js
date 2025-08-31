const Plan = require("../models/Plan");
const { Op } = require("sequelize");

// Create Plan
exports.createPlan = async (req, res) => {
  try {
    const { name, monthlyPrice, gstRate, code, benefits, isActive } = req.body;

    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    const plan = await Plan.create({
      companyId,
      name,
      monthlyPrice,
      gstRate,
      code,
      benefits,
      isActive,
    });
    res.status(201).json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all Plans with filtering
exports.getAllPlans = async (req, res) => {
  try {
    const { search = "", isActive = "" } = req.query;

    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    const whereClause = { companyId };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Add status filter
    if (isActive !== "") {
      whereClause.isActive = isActive === "true";
    }

    const plans = await Plan.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Plan by ID
exports.getPlanById = async (req, res) => {
  try {
    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    const plan = await Plan.findOne({
      where: { id: req.params.id, companyId },
    });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Plan
exports.updatePlan = async (req, res) => {
  try {
    const { name, monthlyPrice, gstRate, code, benefits, isActive } = req.body;

    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    const [updated] = await Plan.update(
      { name, monthlyPrice, gstRate, code, benefits, isActive },
      { where: { id: req.params.id, companyId } }
    );
    if (!updated) return res.status(404).json({ error: "Plan not found" });
    const plan = await Plan.findOne({
      where: { id: req.params.id, companyId },
    });
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Plan
exports.deletePlan = async (req, res) => {
  try {
    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    const deleted = await Plan.destroy({
      where: { id: req.params.id, companyId },
    });
    if (!deleted) return res.status(404).json({ error: "Plan not found" });
    res.json({ message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
