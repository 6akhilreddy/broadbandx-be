const User = require("../models/User");
const Company = require("../models/Company");

// Create Admin for a specific company
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, companyId } = req.body;
    // Check if company exists
    const company = await Company.findByPk(companyId);
    if (!company) return res.status(404).json({ error: "Company not found" });
    // Create admin user
    const user = await User.create({
      name,
      email,
      phone,
      passwordHash: password,
      companyId,
      role: "ADMIN",
      isActive: true,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all Admins for a company
exports.getAdminsByCompany = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { companyId: req.params.companyId, role: "ADMIN" },
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Admin by ID
exports.getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      where: { id: req.params.id, role: "ADMIN" },
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Admin
exports.updateAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, isActive } = req.body;
    const admin = await User.findOne({
      where: { id: req.params.id, role: "ADMIN" },
    });
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    if (name !== undefined) admin.name = name;
    if (email !== undefined) admin.email = email;
    if (phone !== undefined) admin.phone = phone;
    if (password !== undefined) admin.passwordHash = password;
    if (isActive !== undefined) admin.isActive = isActive;
    await admin.save();
    res.json(admin);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
