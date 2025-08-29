const {
  authenticate,
  hasPermission,
  isSuperAdmin,
} = require("./authMiddleware");
const {
  addCompanyFilter,
  ensureCompanyAccess,
} = require("./companyMiddleware");

// Middleware combinations for different route types
const authOnly = [authenticate];
const companyFilter = [authenticate, addCompanyFilter];
const companyAccess = [authenticate, ensureCompanyAccess];
const superAdminOnly = [authenticate, isSuperAdmin];
const superAdminWithCompany = [authenticate, isSuperAdmin, ensureCompanyAccess];

// Permission-based middleware factory
const requirePermission = (permission) => [
  authenticate,
  hasPermission(permission),
];
const requirePermissionWithCompany = (permission) => [
  authenticate,
  hasPermission(permission),
  ensureCompanyAccess,
];

// Export individual middleware functions
module.exports = {
  // Individual middleware
  authenticate,
  hasPermission,
  isSuperAdmin,
  addCompanyFilter,
  ensureCompanyAccess,

  // Pre-configured middleware combinations
  authOnly,
  companyFilter,
  companyAccess,
  superAdminOnly,
  superAdminWithCompany,

  // Permission-based middleware
  requirePermission,
  requirePermissionWithCompany,
};
