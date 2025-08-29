// Import the User model instead of the Agent model
const User = require("../models/User");
const Payment = require("../models/Payment");
const { Op } = require("sequelize");
const { Role } = require("../models");

// Create a new User with the role of AGENT
exports.createAgent = async (req, res) => {
  try {
    // Destructure all required fields from the request body, including password
    const { name, email, phone, status, password, companyId } = req.body;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "User is not associated with a company." });
    }

    // Check if a password was provided
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Get AGENT role ID
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Create a new user with the role set to 'AGENT' and associate with the company
    // The password will be automatically hashed by the beforeCreate hook in the User model
    const agent = await User.create({
      name,
      email,
      phone,
      isActive: status === "ACTIVE",
      passwordHash: password, // Pass the plain password to passwordHash
      roleId: agentRole.id,
      companyId: companyId, // Associate agent with the admin's company
    });

    res.status(201).json(agent);
  } catch (err) {
    // Handle potential validation errors (like unique email/phone)
    res.status(400).json({ error: err.message });
  }
};

// Get all Users with the role of AGENT based on companyId with collection data
exports.getAllAgents = async (req, res) => {
  try {
    const { companyId, search = "", status = "" } = req.query;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Company ID is required as a query parameter." });
    }

    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    const whereClause = { roleId: agentRole.id, companyId };

    // Add search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Add status filter
    if (status) {
      whereClause.isActive = status === "ACTIVE";
    }

    const agents = await User.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    // Get collection data for each agent
    const agentsWithCollection = await Promise.all(
      agents.map(async (agent) => {
        // Get total collection
        const totalCollection = await Payment.sum("amount", {
          where: {
            collectedBy: agent.id,
            companyId,
          },
        });

        // Get last month collection
        const lastMonthStart = new Date();
        lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
        lastMonthStart.setDate(1);
        lastMonthStart.setHours(0, 0, 0, 0);

        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(0);
        lastMonthEnd.setHours(23, 59, 59, 999);

        const lastMonthCollection = await Payment.sum("amount", {
          where: {
            collectedBy: agent.id,
            companyId,
            collectedAt: {
              [Op.between]: [lastMonthStart, lastMonthEnd],
            },
          },
        });

        // Get today's collection
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayCollection = await Payment.sum("amount", {
          where: {
            collectedBy: agent.id,
            companyId,
            collectedAt: {
              [Op.between]: [todayStart, todayEnd],
            },
          },
        });

        return {
          ...agent.toJSON(),
          collection: {
            total: totalCollection || 0,
            lastMonth: lastMonthCollection || 0,
            today: todayCollection || 0,
          },
          status: agent.isActive ? "ACTIVE" : "INACTIVE",
        };
      })
    );

    res.json(agentsWithCollection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single User by ID, ensuring they have the AGENT role and belong to the correct company
exports.getAgentById = async (req, res) => {
  try {
    // Get companyId from query parameters
    const { companyId } = req.query;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Company ID is required as a query parameter." });
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
    const { name, email, phone, status } = req.body;
    // Get companyId from query parameters
    const { companyId } = req.query;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Company ID is required as a query parameter." });
    }

    // Update user information where the ID and companyId match, and the role is 'AGENT'
    const [updated] = await User.update(
      { name, email, phone, isActive: status === "ACTIVE" },
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
    // Get companyId from query parameters
    const { companyId } = req.query;

    if (!companyId) {
      return res
        .status(400)
        .json({ error: "Company ID is required as a query parameter." });
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
