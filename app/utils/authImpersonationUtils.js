const jwt = require("jsonwebtoken");
const { User, Role, RolePermission, Feature } = require("../models");

const getFeatureCodes = (user) =>
  user.Role.RolePermissions.filter((rp) => rp.allowed && rp.Feature).map(
    (rp) => rp.Feature.code
  );

const loadUserWithRole = (userId) =>
  User.findOne({
    where: { id: userId },
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

const buildAuthResponse = (targetUser, impersonationStack = []) => {
  const featureCodes = getFeatureCodes(targetUser);
  const parentId =
    impersonationStack.length > 0
      ? impersonationStack[impersonationStack.length - 1]
      : null;

  const token = jwt.sign(
    {
      id: targetUser.id,
      companyId: targetUser.companyId,
      roleId: targetUser.roleId,
      roleCode: targetUser.Role.code,
      phone: targetUser.phone,
      impersonationStack,
      impersonatedBy: parentId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  const response = {
    token,
    user: {
      id: targetUser.id,
      companyId: targetUser.companyId,
      name: targetUser.name,
      email: targetUser.email,
      phone: targetUser.phone,
      isActive: targetUser.isActive,
      role: targetUser.Role.name,
      roleCode: targetUser.Role.code,
      allowedFeatures: featureCodes,
      impersonationStack,
    },
  };

  if (parentId) {
    response.user.impersonatedBy = { id: parentId };
  }

  return response;
};

/** Enrich impersonatedBy with name/role for UI after parent is loaded. */
const enrichImpersonationMeta = async (response, impersonationStack) => {
  if (!impersonationStack?.length) return response;

  const parentId = impersonationStack[impersonationStack.length - 1];
  const parent = await User.findByPk(parentId, {
    attributes: ["id", "name"],
    include: [{ model: Role, attributes: ["code"] }],
  });

  if (parent) {
    response.user.impersonatedBy = {
      id: parent.id,
      name: parent.name,
      roleCode: parent.Role?.code,
    };
  }

  if (impersonationStack.length > 1) {
    const root = await User.findByPk(impersonationStack[0], {
      attributes: ["id", "name"],
      include: [{ model: Role, attributes: ["code"] }],
    });
    if (root) {
      response.user.impersonationRoot = {
        id: root.id,
        name: root.name,
        roleCode: root.Role?.code,
      };
    }
  }

  return response;
};

module.exports = {
  getFeatureCodes,
  loadUserWithRole,
  buildAuthResponse,
  enrichImpersonationMeta,
};
