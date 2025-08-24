const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const {
  authenticate,
  hasPermission,
} = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /admins:
 *   post:
 *     summary: Create Admin for a specific company
 *     description: Create a new admin user for a company.
 *     tags: [Admins]
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
/**
 * @swagger
 * security:
 *   - bearerAuth: []
 */
router.post("/", authenticate, adminController.createAdmin);

/**
 * @swagger
 * /admins/company/{companyId}:
 *   get:
 *     summary: Get all Admins for a company
 *     description: Retrieve all admin users for a specific company.
 *     tags: [Admins]
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
  authenticate,
  adminController.getAdminsByCompany
);

/**
 * @swagger
 * /admins/{id}:
 *   get:
 *     summary: Get Admin by ID
 *     description: Retrieve an admin user by their ID.
 *     tags: [Admins]
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
router.get("/:id", authenticate, adminController.getAdminById);

/**
 * @swagger
 * /admins/{id}:
 *   put:
 *     summary: Update Admin
 *     description: Update an admin user's details.
 *     tags: [Admins]
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
router.put("/:id", authenticate, adminController.updateAdmin);

module.exports = router;
