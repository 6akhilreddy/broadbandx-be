const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  superAdminOnly,
  superAdminWithCompany,
  requirePermission,
} = require("../middlewares");

/**
 * @swagger
 * /admins:
 *   post:
 *     summary: Create Admin for a specific company
 *     description: |
 *       Create a new admin user with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can create admins for any company
 *       - **ADMIN**: Cannot create other admins
 *
 *       **Required Features:**
 *       - `agent.manage` feature permission required
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, phone, password, companyId]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: "adminpass123"
 *               companyId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Admin created
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  ...requirePermission("agent.manage"),
  ...superAdminWithCompany,
  adminController.createAdmin
);

/**
 * @swagger
 * /admins/company/{companyId}:
 *   get:
 *     summary: Get all Admins for a company
 *     description: |
 *       Retrieve all admin users with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view admins from any company
 *       - **ADMIN**: Can only view admins from their own company
 *
 *       **Required Features:**
 *       - `agents.view` feature permission required
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: List of admins
 *       500:
 *         description: Server error
 */
router.get(
  "/company/:companyId",
  ...requirePermission("agents.view"),
  ...superAdminWithCompany,
  adminController.getAdminsByCompany
);

/**
 * @swagger
 * /admins/{id}:
 *   get:
 *     summary: Get Admin by ID
 *     description: |
 *       Retrieve an admin user by their ID with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view any admin across all companies
 *       - **ADMIN**: Can only view admins from their own company
 *
 *       **Required Features:**
 *       - `agents.view` feature permission required
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Admin found
 *       404:
 *         description: Admin not found
 */
router.get(
  "/:id",
  ...requirePermission("agents.view"),
  ...superAdminWithCompany,
  adminController.getAdminById
);

/**
 * @swagger
 * /admins/{id}:
 *   put:
 *     summary: Update Admin
 *     description: |
 *       Update an admin user's details with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can update any admin across all companies
 *       - **ADMIN**: Can only update admins from their own company
 *
 *       **Required Features:**
 *       - `agent.manage` feature permission required
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 example: jane@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: "newpass123"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Admin updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Admin not found
 */
router.put(
  "/:id",
  ...requirePermission("agent.manage"),
  ...superAdminWithCompany,
  adminController.updateAdmin
);

module.exports = router;
