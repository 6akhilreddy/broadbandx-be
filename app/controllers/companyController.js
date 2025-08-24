const Company = require("../models/Company");

// Create Company
exports.createCompany = async (req, res) => {
  try {
    const { name, address, isActive } = req.body;
    const company = await Company.create({ name, address, isActive });
    res.status(201).json(company);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all Companies
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Company
exports.updateCompany = async (req, res) => {
  try {
    const { name, address, isActive } = req.body;
    const [updated] = await Company.update(
      { name, address, isActive },
      { where: { id: req.params.id } }
    );
    if (!updated) return res.status(404).json({ error: "Company not found" });
    const company = await Company.findByPk(req.params.id);
    res.json(company);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    const deleted = await Company.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: "Company not found" });
    res.json({ message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
