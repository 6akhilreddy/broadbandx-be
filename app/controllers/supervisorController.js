const User = require("../models/User");
const Payment = require("../models/Payment");
const { Op } = require("sequelize");
const { Role } = require("../models");
const { getAgentRoleId, getSupervisorRoleId } = require("../utils/supervisorUtils");

exports.createSupervisor = async (req, res) => {
  try {
    const { name, email, phone, status, password } = req.body;
    const companyId = req.userCompanyId;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const supervisorRole = await Role.findOne({ where: { code: "SUPERVISOR" } });
    if (!supervisorRole) {
      return res.status(500).json({ error: "Supervisor role not found" });
    }

    let processedEmail = email === "" ? null : email;
    let processedPhone = phone === "" ? null : phone;

    const supervisor = await User.create({
      name,
      email: processedEmail,
      phone: processedPhone,
      isActive: status === "ACTIVE" || status === undefined,
      passwordHash: password,
      roleId: supervisorRole.id,
      companyId,
    });

    res.status(201).json(supervisor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllSupervisors = async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const companyId = req.userCompanyId;

    const supervisorRole = await Role.findOne({ where: { code: "SUPERVISOR" } });
    if (!supervisorRole) {
      return res.status(500).json({ error: "Supervisor role not found" });
    }

    const agentRoleId = await getAgentRoleId();
    const whereClause = { roleId: supervisorRole.id, companyId };

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      whereClause.isActive = status === "ACTIVE";
    }

    const supervisors = await User.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    const supervisorsWithStats = await Promise.all(
      supervisors.map(async (supervisor) => {
        const agentCount = agentRoleId
          ? await User.count({
              where: {
                supervisorId: supervisor.id,
                roleId: agentRoleId,
                companyId,
              },
            })
          : 0;

        let teamCollection = 0;
        if (agentRoleId) {
          const agentIds = (
            await User.findAll({
              where: {
                supervisorId: supervisor.id,
                roleId: agentRoleId,
                companyId,
              },
              attributes: ["id"],
            })
          ).map((a) => a.id);

          if (agentIds.length) {
            teamCollection =
              (await Payment.sum("amount", {
                where: { collectedBy: { [Op.in]: agentIds }, companyId },
              })) || 0;
          }
        }

        return {
          ...supervisor.toJSON(),
          agentCount,
          collection: { total: teamCollection },
          status: supervisor.isActive ? "ACTIVE" : "INACTIVE",
        };
      })
    );

    res.json(supervisorsWithStats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSupervisorById = async (req, res) => {
  try {
    const companyId = req.userCompanyId;
    const supervisorRole = await Role.findOne({ where: { code: "SUPERVISOR" } });
    if (!supervisorRole) {
      return res.status(500).json({ error: "Supervisor role not found" });
    }

    const supervisor = await User.findOne({
      where: { id: req.params.id, roleId: supervisorRole.id, companyId },
    });

    if (!supervisor) {
      return res.status(404).json({ error: "Supervisor not found" });
    }

    const agentRoleId = await getAgentRoleId();
    const agents = agentRoleId
      ? await User.findAll({
          where: {
            supervisorId: supervisor.id,
            roleId: agentRoleId,
            companyId,
          },
          attributes: ["id", "name", "phone", "email", "isActive"],
          order: [["name", "ASC"]],
        })
      : [];

    res.json({
      ...supervisor.toJSON(),
      status: supervisor.isActive ? "ACTIVE" : "INACTIVE",
      agents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSupervisor = async (req, res) => {
  try {
    const { name, email, phone, status } = req.body;
    const companyId = req.userCompanyId;

    const processedEmail = email === "" ? null : email;
    const processedPhone = phone === "" ? null : phone;

    const supervisorRole = await Role.findOne({ where: { code: "SUPERVISOR" } });
    if (!supervisorRole) {
      return res.status(500).json({ error: "Supervisor role not found" });
    }

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
          roleId: supervisorRole.id,
          companyId,
        },
      }
    );

    if (!updated) {
      return res.status(404).json({ error: "Supervisor not found" });
    }

    const supervisor = await User.findOne({
      where: { id: req.params.id, roleId: supervisorRole.id, companyId },
    });
    res.json(supervisor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteSupervisor = async (req, res) => {
  try {
    const companyId = req.userCompanyId;
    const supervisorRole = await Role.findOne({ where: { code: "SUPERVISOR" } });
    if (!supervisorRole) {
      return res.status(500).json({ error: "Supervisor role not found" });
    }

    const supervisorId = parseInt(req.params.id, 10);
    const agentRoleId = await getAgentRoleId();

    if (agentRoleId) {
      await User.update(
        { supervisorId: null },
        { where: { supervisorId, roleId: agentRoleId, companyId } }
      );
    }

    const deleted = await User.destroy({
      where: { id: supervisorId, roleId: supervisorRole.id, companyId },
    });

    if (!deleted) {
      return res.status(404).json({ error: "Supervisor not found" });
    }
    res.json({ message: "Supervisor deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/** Validate supervisor belongs to company (for agent assignment). */
exports.validateSupervisorForCompany = async (supervisorId, companyId) => {
  if (!supervisorId) return true;
  const supervisorRoleId = await getSupervisorRoleId();
  if (!supervisorRoleId) return false;
  const supervisor = await User.findOne({
    where: { id: supervisorId, roleId: supervisorRoleId, companyId },
  });
  return !!supervisor;
};
