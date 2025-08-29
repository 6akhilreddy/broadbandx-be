const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { superAdminOnly, requirePermission } = require("../middlewares");

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create a new company
 *     description: |
 *       Create a new company with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can create companies
 *       - **ADMIN/AGENT**: Cannot create companies
 *
 *       **Required Features:**
 *       - `company.manage` feature permission required
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
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
router.post(
  "/",
  ...requirePermission("company.manage"),
  ...superAdminOnly,
  companyController.createCompany
);

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies
 *     description: |
 *       Retrieve all companies with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view all companies
 *       - **ADMIN/AGENT**: Cannot view companies
 *
 *       **Required Features:**
 *       - `company.manage` feature permission required
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of companies
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  ...requirePermission("company.manage"),
  ...superAdminOnly,
  companyController.getAllCompanies
);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     description: |
 *       Retrieve a company by its ID with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view any company
 *       - **ADMIN/AGENT**: Cannot view companies
 *
 *       **Required Features:**
 *       - `company.manage` feature permission required
 *     tags: [Companies]
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
 *         description: Company found
 *       404:
 *         description: Company not found
 */
router.get(
  "/:id",
  ...requirePermission("company.manage"),
  ...superAdminOnly,
  companyController.getCompanyById
);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update company
 *     description: |
 *       Update a company's details with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can update any company
 *       - **ADMIN/AGENT**: Cannot update companies
 *
 *       **Required Features:**
 *       - `company.manage` feature permission required
 *     tags: [Companies]
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
router.put(
  "/:id",
  ...requirePermission("company.manage"),
  ...superAdminOnly,
  companyController.updateCompany
);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete company
 *     description: |
 *       Delete a company by its ID with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can delete any company
 *       - **ADMIN/AGENT**: Cannot delete companies
 *
 *       **Required Features:**
 *       - `company.manage` feature permission required
 *     tags: [Companies]
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
 *         description: Company deleted
 *       404:
 *         description: Company not found
 */
router.delete(
  "/:id",
  ...requirePermission("company.manage"),
  ...superAdminOnly,
  companyController.deleteCompany
);

module.exports = router;
