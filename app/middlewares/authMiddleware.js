const jwt = require("jsonwebtoken");
const { User, Role, RolePermission, Feature } = require("../models");
require("dotenv").config();

// Middleware to verify JWT token and get user role
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    // Get user with role information
    const user = await User.findByPk(decoded.id, {
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
      return res.status(401).json({ message: "User not found." });
    }

    // Add user information to request
    req.user = {
      ...decoded,
      role: user.Role.name,
      roleCode: user.Role.code,
      companyId: user.companyId,
      allowedFeatures: user.Role.RolePermissions.filter(
        (rp) => rp.allowed && rp.Feature
      ).map((rp) => rp.Feature.code),
      // Include impersonation info if present
      impersonatedBy: decoded.impersonatedBy || null,
      originalRoleCode: decoded.originalRoleCode || null,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token." });
  }
};

// Checks if user has a specific permission via RolePermission
const hasPermission = (requiredPermission) => async (req, res, next) => {
  try {
    // Check if user has the required permission
    if (!req.user.allowedFeatures.includes(requiredPermission)) {
      return res.status(403).json({
        message: "Access denied. Insufficient permissions.",
        required: requiredPermission,
        allowed: req.user.allowedFeatures,
      });
    }

    next();
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Middleware to check if the user is an admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.roleCode !== "ADMIN") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Middleware to check if the user is a super admin
const isSuperAdmin = async (req, res, next) => {
  try {
    if (req.user.roleCode !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Access denied. Super Admins only." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { authenticate, isAdmin, hasPermission, isSuperAdmin };
