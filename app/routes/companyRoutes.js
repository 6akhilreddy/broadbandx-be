const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const {
  authenticate,
  hasPermission,
  isSuperAdmin,
} = require("../middlewares/authMiddleware");

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     description: Create a new company record.
 *     tags: [Companies]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Acme Corp"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Company created
 *       400:
 *         description: Bad request
 */
/**
 * @swagger
 * security:
 *   - bearerAuth: []
 */
router.post("/", authenticate, isSuperAdmin, companyController.createCompany);

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve all companies.
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: List of companies
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, isSuperAdmin, companyController.getAllCompanies);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: Retrieve a company by its ID.
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Company found
 *       404:
 *         description: Company not found
 */
router.get(
  "/:id",
  authenticate,
  isSuperAdmin,
  companyController.getCompanyById
);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update company
 *     description: Update a company's details.
 *     tags: [Companies]
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
 *                 example: "Acme Corp Updated"
 *               address:
 *                 type: string
 *                 example: "456 New St, City"
 *               isActive:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Company updated
 *       400:
 *         description: Bad request
 *       404:
 *         description: Company not found
 */
router.put("/:id", authenticate, isSuperAdmin, companyController.updateCompany);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete company
 *     description: Delete a company by its ID.
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Company deleted
 *       404:
 *         description: Company not found
 */
router.delete(
  "/:id",
  authenticate,
  isSuperAdmin,
  companyController.deleteCompany
);

module.exports = router;
