const Plan = require("../models/Plan");

// Create Plan
exports.createPlan = async (req, res) => {
  try {
    const { companyId, name, monthlyPrice, gstRate, code, benefits, isActive } =
      req.body;
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

// Get all Plans
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Plan
exports.updatePlan = async (req, res) => {
  try {
    const { companyId, name, monthlyPrice, gstRate, code, benefits, isActive } =
      req.body;
    const [updated] = await Plan.update(
      { companyId, name, monthlyPrice, gstRate, code, benefits, isActive },
      { where: { id: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: "Plan not found" });
    const plan = await Plan.findByPk(req.params.id);
    res.json(plan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Plan
exports.deletePlan = async (req, res) => {
  try {
    const deleted = await Plan.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Plan not found" });
    res.json({ message: "Plan deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
