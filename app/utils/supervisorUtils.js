const { Op } = require("sequelize");
const { User, Role } = require("../models");

let agentRoleIdCache = null;

const getAgentRoleId = async () => {
  if (!agentRoleIdCache) {
    const role = await Role.findOne({ where: { code: "AGENT" } });
    agentRoleIdCache = role?.id || null;
  }
  return agentRoleIdCache;
};

const getSupervisorRoleId = async () => {
  const role = await Role.findOne({ where: { code: "SUPERVISOR" } });
  return role?.id || null;
};

/** Agent user IDs managed by this supervisor (same company). */
const getManagedAgentIds = async (supervisorId, companyId) => {
  const agentRoleId = await getAgentRoleId();
  if (!agentRoleId || !supervisorId) return [];

  const agents = await User.findAll({
    where: {
      supervisorId,
      roleId: agentRoleId,
      ...(companyId ? { companyId } : {}),
    },
    attributes: ["id"],
  });
  return agents.map((a) => a.id);
};

const isSupervisor = (user) => user?.roleCode === "SUPERVISOR";
const isAgent = (user) => user?.roleCode === "AGENT";

/** Payment filter: agent = self; supervisor = team; admin = company. */
const buildPaymentWhere = (user, companyWhere, managedAgentIds = []) => {
  if (isAgent(user)) {
    return { ...companyWhere, collectedBy: user.id };
  }
  if (isSupervisor(user)) {
    if (!managedAgentIds.length) {
      return { ...companyWhere, collectedBy: { [Op.in]: [-1] } };
    }
    return { ...companyWhere, collectedBy: { [Op.in]: managedAgentIds } };
  }
  return companyWhere;
};

/** Customer filter for supervisor team scope. */
const buildCustomerWhere = (user, companyWhere, managedAgentIds = []) => {
  if (isSupervisor(user)) {
    if (!managedAgentIds.length) {
      return { ...companyWhere, id: { [Op.in]: [-1] } };
    }
    return {
      ...companyWhere,
      assignedAgentId: { [Op.in]: managedAgentIds },
    };
  }
  return companyWhere;
};

/** Complaint filter for supervisor team scope. */
const buildComplaintWhere = (user, companyWhere, managedAgentIds = []) => {
  if (isAgent(user)) {
    return { ...companyWhere, assignedAgentId: user.id };
  }
  if (isSupervisor(user)) {
    if (!managedAgentIds.length) {
      return { ...companyWhere, assignedAgentId: { [Op.in]: [-1] } };
    }
    return { ...companyWhere, assignedAgentId: { [Op.in]: managedAgentIds } };
  }
  return companyWhere;
};

module.exports = {
  getAgentRoleId,
  getSupervisorRoleId,
  getManagedAgentIds,
  buildPaymentWhere,
  buildCustomerWhere,
  buildComplaintWhere,
  isSupervisor,
  isAgent,
};
