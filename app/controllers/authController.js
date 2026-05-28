const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { User, Role, RolePermission, Feature } = require("../models");
const {
  loadUserWithRole,
  buildAuthResponse,
  enrichImpersonationMeta,
} = require("../utils/authImpersonationUtils");
require("dotenv").config();

module.exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required" });
    }

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

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid phone or password." });
    }

    const featureCodes = user.Role.RolePermissions.filter(
      (rp) => rp.allowed && rp.Feature
    ).map((rp) => rp.Feature.code);

    const token = jwt.sign(
      {
        id: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
        roleCode: user.Role.code,
        phone: user.phone,
        impersonationStack: [],
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
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
        impersonationStack: [],
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Error logging in", error });
  }
};

const canImpersonate = (roleCode) =>
  roleCode === "ADMIN" || roleCode === "SUPER_ADMIN" || roleCode === "SUPERVISOR";

// Admin login as supervisor
module.exports.loginAsSupervisor = async (req, res) => {
  try {
    const { supervisorId } = req.params;
    const actor = req.user;

    if (actor.roleCode !== "ADMIN" && actor.roleCode !== "SUPER_ADMIN") {
      return res.status(403).json({
        message: "Access denied. Only admins can login as supervisors.",
      });
    }

    const supervisorRole = await Role.findOne({ where: { code: "SUPERVISOR" } });
    if (!supervisorRole) {
      return res.status(500).json({ error: "Supervisor role not found" });
    }

    const supervisor = await loadUserWithRole(supervisorId);
    if (
      !supervisor ||
      supervisor.roleId !== supervisorRole.id ||
      supervisor.companyId !== actor.companyId
    ) {
      return res.status(404).json({ message: "Supervisor not found" });
    }

    const impersonationStack = [actor.id];
    let response = buildAuthResponse(supervisor, impersonationStack);
    response = await enrichImpersonationMeta(response, impersonationStack);

    res.status(200).json(response);
  } catch (error) {
    console.error("Login as Supervisor Error:", error);
    res.status(500).json({ message: "Error logging in as supervisor", error });
  }
};

// Admin or supervisor login as agent
module.exports.loginAsAgent = async (req, res) => {
  try {
    const { agentId } = req.params;
    const actor = req.user;

    if (!canImpersonate(actor.roleCode)) {
      return res.status(403).json({
        message: "Access denied. You cannot login as an agent.",
      });
    }

    const agentRole = await Role.findOne({ where: { code: "AGENT" } });
    if (!agentRole) {
      return res.status(500).json({ error: "Agent role not found" });
    }

    const agent = await loadUserWithRole(agentId);
    if (!agent || agent.roleId !== agentRole.id) {
      return res.status(404).json({ message: "Agent not found" });
    }

    if (actor.roleCode === "SUPERVISOR") {
      if (agent.supervisorId !== actor.id) {
        return res.status(403).json({
          message: "Access denied. Agent is not under your supervision.",
        });
      }
    } else if (agent.companyId !== actor.companyId) {
      return res.status(404).json({ message: "Agent not found" });
    }

    const existingStack = req.user.impersonationStack || [];
    const impersonationStack = [...existingStack, actor.id];

    let response = buildAuthResponse(agent, impersonationStack);
    response = await enrichImpersonationMeta(response, impersonationStack);

    res.status(200).json(response);
  } catch (error) {
    console.error("Login as Agent Error:", error);
    res.status(500).json({ message: "Error logging in as agent", error });
  }
};

// Exit impersonation (one level up the stack)
module.exports.exitImpersonation = async (req, res) => {
  try {
    const stack =
      req.user.impersonationStack ||
      (req.user.impersonatedBy ? [req.user.impersonatedBy] : []);

    if (!stack.length) {
      return res.status(400).json({
        message: "Not currently impersonating any user.",
      });
    }

    const parentId = stack[stack.length - 1];
    const newStack = stack.slice(0, -1);

    const parentUser = await loadUserWithRole(parentId);
    if (!parentUser) {
      return res.status(404).json({ message: "Parent user not found" });
    }

    let response = buildAuthResponse(parentUser, newStack);
    if (newStack.length) {
      response = await enrichImpersonationMeta(response, newStack);
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Exit Impersonation Error:", error);
    res.status(500).json({ message: "Error exiting impersonation", error });
  }
};
