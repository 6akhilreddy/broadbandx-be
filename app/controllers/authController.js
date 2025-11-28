const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Role, RolePermission, Feature } = require("../models");
require("dotenv").config();

module.exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required" });
    }

    // Find user by phone
    const user = await User.findOne({
      where: { phone },
      attributes: { include: ["passwordHash"] },
      include: [
        {
          model: Role,
          include: [
            {
              model: RolePermission,
              include: [{ model: Feature }],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid phone" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone or password." });
    }

    // Get all allowed feature codes for user
    const featureCodes = user.Role.RolePermissions.filter(
      (rp) => rp.allowed && rp.Feature
    ).map((rp) => rp.Feature.code);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
        roleCode: user.Role.code,
        phone: user.phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Construct response object
    const response = {
      token,
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        role: user.Role.name,
        roleCode: user.Role.code,
        allowedFeatures: featureCodes,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

// Admin login as agent (impersonation)
module.exports.loginAsAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const adminUser = req.user;

    // Only admins and super admins can impersonate
    if (
      adminUser.roleCode !== "ADMIN" &&
      adminUser.roleCode !== "SUPER_ADMIN"
    ) {
      return res.status(403).json({
        message: "Access denied. Only admins can login as agents.",
      });
    }

    // Get the full admin user record to get name
    // Note: roleCode is in the Role table, not User table
    const fullAdminUser = await User.findByPk(adminUser.id, {
      attributes: ["id", "name", "companyId", "roleId"],
      include: [
        {
          model: Role,
          attributes: ["id", "name", "code"],
        },
      ],
    });

    // Get agent role
    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    // Find the agent
    const agent = await User.findOne({
      where: {
        id: agentId,
        roleId: agentRole.id,
        companyId: adminUser.companyId, // Ensure agent belongs to same company
      },
      include: [
        {
          model: Role,
          include: [
            {
              model: RolePermission,
              include: [{ model: Feature }],
            },
          ],
        },
      ],
    });

    if (!agent) {
      return res.status(404).json({ message: "Agent not found" });
    }

    // Get all allowed feature codes for agent
    const featureCodes = agent.Role.RolePermissions.filter(
      (rp) => rp.allowed && rp.Feature
    ).map((rp) => rp.Feature.code);

    // Generate JWT token with impersonation info
    const token = jwt.sign(
      {
        id: agent.id,
        companyId: agent.companyId,
        roleId: agent.roleId,
        roleCode: agent.Role.code,
        phone: agent.phone,
        // Store original admin info for impersonation
        impersonatedBy: fullAdminUser.id,
        originalRoleCode: fullAdminUser.Role?.code || adminUser.roleCode,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Construct response object
    const response = {
      token,
      user: {
        id: agent.id,
        companyId: agent.companyId,
        name: agent.name,
        email: agent.email,
        phone: agent.phone,
        isActive: agent.isActive,
        role: agent.Role.name,
        roleCode: agent.Role.code,
        allowedFeatures: featureCodes,
        // Include admin info for UI
        impersonatedBy: {
          id: fullAdminUser.id,
          name: fullAdminUser.name,
          roleCode: fullAdminUser.Role?.code || adminUser.roleCode,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Login as Agent Error:", error);
    res.status(500).json({ message: "Error logging in as agent", error });
  }
};

// Exit impersonation (return to admin)
module.exports.exitImpersonation = async (req, res) => {
  try {
    const currentUser = req.user;

    // Check if currently impersonating
    if (!currentUser.impersonatedBy) {
      return res.status(400).json({
        message: "Not currently impersonating any user.",
      });
    }

    // Get the original admin user
    const adminUser = await User.findOne({
      where: { id: currentUser.impersonatedBy },
      include: [
        {
          model: Role,
          include: [
            {
              model: RolePermission,
              include: [{ model: Feature }],
            },
          ],
        },
      ],
    });

    if (!adminUser) {
      return res.status(404).json({ message: "Original admin user not found" });
    }

    // Get all allowed feature codes for admin
    const featureCodes = adminUser.Role.RolePermissions.filter(
      (rp) => rp.allowed && rp.Feature
    ).map((rp) => rp.Feature.code);

    // Generate new JWT token for admin (without impersonation)
    const token = jwt.sign(
      {
        id: adminUser.id,
        companyId: adminUser.companyId,
        roleId: adminUser.roleId,
        roleCode: adminUser.Role.code,
        phone: adminUser.phone,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Construct response object
    const response = {
      token,
      user: {
        id: adminUser.id,
        companyId: adminUser.companyId,
        name: adminUser.name,
        email: adminUser.email,
        phone: adminUser.phone,
        isActive: adminUser.isActive,
        role: adminUser.Role.name,
        roleCode: adminUser.Role.code,
        allowedFeatures: featureCodes,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Exit Impersonation Error:", error);
    res.status(500).json({ message: "Error exiting impersonation", error });
  }
};
