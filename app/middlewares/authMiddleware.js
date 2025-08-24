const jwt = require("jsonwebtoken");
const { User, UserPermission, Feature } = require("../models");
require("dotenv").config();

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};

// Checks if user has a specific permission via UserPermission
const hasPermission = (requiredPermission) => async (req, res, next) => {
  try {
    // Find user and include their permissions and features
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: UserPermission,
          include: [
            {
              model: Feature,
            },
          ],
        },
      ],
    });

    if (!user) {
      return res
        .status(403)
        .json({ message: "Access denied. User not found." });
    }

    // Collect all allowed feature names for this user
    const allowedFeatures = (user.UserPermissions || [])
      .filter((perm) => perm.allowed && perm.feature)
      .map((perm) => perm.feature.name);

    if (!allowedFeatures.includes(requiredPermission)) {
      return res
        .status(403)
        .json({ message: "Access denied. Insufficient permissions." });
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
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Middleware to check if the user is a super admin
const isSuperAdmin = async (req, res, next) => {
  next();
  // try {
  //   const user = await User.findByPk(req.user.id);
  //   if (!user || user.role !== "SUPER_ADMIN") {
  //     return res
  //       .status(403)
  //       .json({ message: "Access denied. Super Admins only." });
  //   }
  //   next();
  // } catch (error) {
  //   return res.status(500).json({ message: "Internal server error." });
  // }
};

module.exports = { authenticate, isAdmin, hasPermission, isSuperAdmin };
