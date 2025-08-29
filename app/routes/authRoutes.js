const express = require("express");
const { login } = require("../controllers/authController");
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required: [phone, password]
 *       properties:
 *         phone:
 *           type: string
 *           description: User's phone number
 *           example: "0000000000"
 *         password:
 *           type: string
 *           description: User's password
 *           example: "supersecret123"
 *     LoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               description: User ID
 *             companyId:
 *               type: integer
 *               nullable: true
 *               description: Company ID (null for Super Admin)
 *             name:
 *               type: string
 *               description: User's full name
 *             email:
 *               type: string
 *               description: User's email
 *             phone:
 *               type: string
 *               description: User's phone number
 *             isActive:
 *               type: boolean
 *               description: User's active status
 *             role:
 *               type: string
 *               description: User's role name
 *               example: "Super Admin"
 *             roleCode:
 *               type: string
 *               description: User's role code
 *               enum: [SUPER_ADMIN, ADMIN, AGENT]
 *             allowedFeatures:
 *               type: array
 *               items:
 *                 type: string
 *               description: List of feature codes the user has access to
 *               example: ["admin.dashboard.view", "customer.add", "plan.manage"]
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 *
 * /auth/login:
 *   post:
 *     summary: User login
 *     description: |
 *       Authenticate user and return JWT token with role-based permissions.
 *
 *       **Role Types:**
 *       - **SUPER_ADMIN**: Full system access, can manage companies
 *       - **ADMIN**: Company-level administrative access
 *       - **AGENT**: Limited access for customer management and collections
 *
 *       **Company-Based Access:**
 *       - Super Admin can access all data across companies
 *       - Admin and Agent can only access data from their associated company
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *             example:
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               user:
 *                 id: 1
 *                 companyId: null
 *                 name: "Super Admin"
 *                 email: "super@admin.com"
 *                 phone: "0000000000"
 *                 isActive: true
 *                 role: "Super Admin"
 *                 roleCode: "SUPER_ADMIN"
 *                 allowedFeatures: ["superadmin.dashboard.view", "company.manage", "admin.dashboard.view", "customer.add"]
 *       400:
 *         description: Bad request - Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Phone and password are required"
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid phone or password."
 */
router.post("/login", login);

module.exports = router;
