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
