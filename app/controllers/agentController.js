// Import the User model instead of the Agent model
const User = require("../models/User");

// Create a new User with the role of AGENT
exports.createAgent = async (req, res) => {
  try {
    // Destructure all required fields from the request body, including password
    const { name, email, phone, isActive, password, companyId } = req.body;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User is not associated with a company." });
    }

    // Check if a password was provided
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Create a new user with the role set to 'AGENT' and associate with the company
    // The password will be automatically hashed by the beforeCreate hook in the User model
    const agent = await User.create({
      name,
      email,
      phone,
      isActive,
      passwordHash: password, // Pass the plain password to passwordHash
      role: "AGENT",
      companyId: companyId, // Associate agent with the admin's company
    });

    res.status(201).json(agent);
  } catch (err) {
    // Handle potential validation errors (like unique email/phone)
    res.status(400).json({ error: err.message });
  }
};

// Get all Users with the role of AGENT based on companyId
exports.getAllAgents = async (req, res) => {
  try {
    // Assuming companyId is available on the request from an auth middleware (e.g., req.user)
    const { companyId } = req.user;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User is not associated with a company." });
    }

    // Find all users where the role is 'AGENT' and the companyId matches
    const agents = await User.findAll({
      where: { role: "AGENT", companyId: companyId },
    });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single User by ID, ensuring they have the AGENT role and belong to the correct company
exports.getAgentById = async (req, res) => {
  try {
    // Assuming companyId is available on the request from an auth middleware (e.g., req.user)
    const { companyId } = req.user;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User is not associated with a company." });
    }

    // Find a user by their ID and ensure they have the 'AGENT' role and belong to the same company
    const agent = await User.findOne({
      where: { id: req.params.id, role: "AGENT", companyId: companyId },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a User with the AGENT role, scoped by companyId
exports.updateAgent = async (req, res) => {
  try {
    const { name, email, phone, isActive } = req.body;
    // Assuming companyId is available on the request from an auth middleware (e.g., req.user)
    const { companyId } = req.user;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User is not associated with a company." });
    }

    // Update user information where the ID and companyId match, and the role is 'AGENT'
    const [updated] = await User.update(
      { name, email, phone, isActive },
      { where: { id: req.params.id, role: "AGENT", companyId: companyId } }
    );

    if (!updated) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Find and return the updated agent
    const agent = await User.findOne({
      where: { id: req.params.id, role: "AGENT", companyId: companyId },
    });
    res.json(agent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a User with the AGENT role, scoped by companyId
exports.deleteAgent = async (req, res) => {
  try {
    // Assuming companyId is available on the request from an auth middleware (e.g., req.user)
    const { companyId } = req.user;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User is not associated with a company." });
    }

    // Delete a user where the ID and companyId match, and the role is 'AGENT'
    const deleted = await User.destroy({
      where: { id: req.params.id, role: "AGENT", companyId: companyId },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json({ message: "Agent deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
