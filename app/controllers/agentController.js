// Import the User model instead of the Agent model
const User = require("../models/User");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const Invoice = require("../models/Invoice");
const { Op } = require("sequelize");
const { Role } = require("../models");

// Create a new User with the role of AGENT
exports.createAgent = async (req, res) => {
  try {
    // Destructure all required fields from the request body, including password
    const { name, email, phone, status, password } = req.body;

    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    // Check if a password was provided
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Get AGENT role ID
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Handle unique fields - convert empty strings to null
    if (email === "") {
      email = null;
    }
    if (phone === "") {
      phone = null;
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
    const { search = "", status = "" } = req.query;

    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

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
    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    // Get AGENT role ID
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Find a user by their ID and ensure they have the 'AGENT' role and belong to the same company
    const agent = await User.findOne({
      where: { id: req.params.id, roleId: agentRole.id, companyId: companyId },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Get collection data for the agent
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

    const agentWithCollection = {
      ...agent.toJSON(),
      collection: {
        total: totalCollection || 0,
        lastMonth: lastMonthCollection || 0,
        today: todayCollection || 0,
      },
      status: agent.isActive ? "ACTIVE" : "INACTIVE",
    };

    res.json(agentWithCollection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a User with the AGENT role, scoped by companyId
exports.updateAgent = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    // Handle unique fields - convert empty strings to null
    let processedEmail = email;
    let processedPhone = phone;
    if (email === "") {
      processedEmail = null;
    }
    if (phone === "") {
      processedPhone = null;
    }

    // Get AGENT role ID
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Update user information where the ID and companyId match, and the role is 'AGENT'
    const [updated] = await User.update(
      {
        name,
        email: processedEmail,
        phone: processedPhone,
        isActive: status === "ACTIVE",
      },
      {
        where: {
          id: req.params.id,
          roleId: agentRole.id,
          companyId: companyId,
        },
      }
    );

    if (!updated) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Find and return the updated agent
    const agent = await User.findOne({
      where: { id: req.params.id, roleId: agentRole.id, companyId: companyId },
    });
    res.json(agent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete a User with the AGENT role, scoped by companyId
exports.deleteAgent = async (req, res) => {
  try {
    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    // Get AGENT role ID
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Delete a user where the ID and companyId match, and the role is 'AGENT'
    const deleted = await User.destroy({
      where: { id: req.params.id, roleId: agentRole.id, companyId: companyId },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Agent not found" });
    }
    res.json({ message: "Agent deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get payment history for a specific agent
exports.getAgentPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    // Use companyId from JWT token (set by middleware)
    const companyId = req.userCompanyId;

    // Get AGENT role ID
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Verify the agent exists and belongs to the company
    const agent = await User.findOne({
      where: { id, roleId: agentRole.id, companyId },
    });

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    // Build where clause for payments
    const whereClause = {
      collectedBy: id,
      companyId,
    };

    // Add date filters if provided
    if (startDate || endDate) {
      whereClause.collectedAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        whereClause.collectedAt[Op.gte] = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        whereClause.collectedAt[Op.lte] = end;
      }
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get payments with customer information through invoice
    const { count, rows: payments } = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Invoice,
          attributes: ["id"],
          include: [
            {
              model: Customer,
              attributes: ["id", "fullName"],
            },
          ],
        },
      ],
      order: [["collectedAt", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Calculate pagination info
    const totalPages = Math.ceil(count / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    res.json({
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.method,
        collectedAt: payment.collectedAt,
        status: "COMPLETED", // Assuming all payments are completed
        customer: payment.Invoice?.Customer
          ? {
              id: payment.Invoice.Customer.id,
              name: payment.Invoice.Customer.fullName,
            }
          : null,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        hasNext,
        hasPrevious,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
