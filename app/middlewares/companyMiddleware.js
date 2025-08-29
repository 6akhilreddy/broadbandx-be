// Middleware to add companyId to request for filtering
const addCompanyFilter = async (req, res, next) => {
  try {
    // Add companyId to request for filtering
    req.userCompanyId = req.user.companyId;
    req.userRoleCode = req.user.roleCode;

    next();
  } catch (error) {
    console.error("Company middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware to ensure user can only access their company's data
const ensureCompanyAccess = async (req, res, next) => {
  try {
    // Super admin can access all data
    if (req.user.roleCode === "SUPER_ADMIN") {
      req.userCompanyId = req.user.companyId;
      req.userRoleCode = req.user.roleCode;
      return next();
    }

    // Admin and Agent can only access their company's data
    if (req.user.companyId) {
      req.userCompanyId = req.user.companyId;
      req.userRoleCode = req.user.roleCode;
      return next();
    }

    return res.status(403).json({ message: "Access denied" });
  } catch (error) {
    console.error("Company access middleware error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  addCompanyFilter,
  ensureCompanyAccess,
};
