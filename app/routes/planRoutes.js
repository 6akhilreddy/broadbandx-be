const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");
const {
  companyFilter,
  companyAccess,
  requirePermission,
  requirePermissionWithCompany,
} = require("../middlewares");

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management with role-based access control
 */

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Create a new plan
 *     description: |
 *       Create a new plan with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can create plans for any company (must specify companyId)
 *       - **ADMIN**: Can only create plans for their own company (companyId automatically assigned)
 *
 *       **Required Features:**
 *       - `plan.manage` feature permission required
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - companyId
 *               - name
 *             properties:
 *               companyId:
 *                 type: integer
 *                 description: The ID of the company the plan belongs to
 *               name:
 *                 type: string
 *                 description: Name of the plan
 *               monthlyPrice:
 *                 type: number
 *                 description: Monthly price of the plan
 *               gstRate:
 *                 type: integer
 *                 default: 18
 *                 description: GST rate percentage
 *               code:
 *                 type: string
 *                 description: Plan code/identifier
 *               benefits:
 *                 type: string
 *                 description: Plan benefits description
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *                 default: ACTIVE
 *                 description: Plan status
 *           example:
 *             companyId: 1
 *             name: "Basic Plan"
 *             monthlyPrice: 999.99
 *             gstRate: 18
 *             code: "BASIC100"
 *             benefits: "Unlimited data, 24x7 support"
 *             status: "ACTIVE"
 *     responses:
 *       201:
 *         description: Plan created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 companyId:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 monthlyPrice:
 *                   type: number
 *                 gstRate:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 benefits:
 *                   type: string
 *                 status:
 *                   type: string
 *             example:
 *               id: 1
 *               companyId: 1
 *               name: "Basic Plan"
 *               monthlyPrice: 999.99
 *               gstRate: 18
 *               code: "BASIC100"
 *               benefits: "Unlimited data, 24x7 support"
 *               status: "ACTIVE"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  ...requirePermissionWithCompany("plan.manage"),
  planController.createPlan
);

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all plans with pagination and filtering
 *     description: |
 *       Get plans with role-based access control and company-based filtering.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view all plans across all companies
 *       - **ADMIN/AGENT**: Can only view plans from their own company
 *
 *       **Required Features:**
 *       - `plans.view` feature permission required
 *
 *       **Note:** companyId parameter is automatically handled based on user's company
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the company to get plans for
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for plan name or code
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by plan status
 *     responses:
 *       200:
 *         description: List of plans with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plans:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       companyId:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       monthlyPrice:
 *                         type: number
 *                       gstRate:
 *                         type: integer
 *                       code:
 *                         type: string
 *                       benefits:
 *                         type: string
 *                       status:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrevious:
 *                       type: boolean
 *             example:
 *               plans:
 *                 - id: 1
 *                   companyId: 1
 *                   name: "Basic Plan"
 *                   monthlyPrice: 999.99
 *                   gstRate: 18
 *                   code: "BASIC100"
 *                   benefits: "Unlimited data, 24x7 support"
 *                   status: "ACTIVE"
 *                 - id: 2
 *                   companyId: 1
 *                   name: "Premium Plan"
 *                   monthlyPrice: 1499.99
 *                   gstRate: 18
 *                   code: "PREM300"
 *                   benefits: "Unlimited data, 24x7 priority support"
 *                   status: "ACTIVE"
 *               pagination:
 *                 currentPage: 1
 *                 totalPages: 1
 *                 totalItems: 2
 *                 hasNext: false
 *                 hasPrevious: false
 *       400:
 *         description: Company ID is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  ...requirePermission("plans.view"),
  ...companyFilter,
  planController.getAllPlans
);

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: Get plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 companyId:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 monthlyPrice:
 *                   type: number
 *                 gstRate:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 benefits:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *             example:
 *               id: 1
 *               companyId: 1
 *               name: "Basic Plan"
 *               monthlyPrice: 999.99
 *               gstRate: 18
 *               code: "BASIC100"
 *               benefits: "Unlimited data, 24x7 support"
 *               isActive: true
 *       404:
 *         description: Plan not found
 */
router.get(
  "/:id",
  ...requirePermission("plans.view"),
  ...companyFilter,
  planController.getPlanById
);

/**
 * @swagger
 * /plans/{id}:
 *   put:
 *     summary: Update plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: integer
 *               name:
 *                 type: string
 *               monthlyPrice:
 *                 type: number
 *               gstRate:
 *                 type: integer
 *               code:
 *                 type: string
 *               benefits:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *           example:
 *             companyId: 1
 *             name: "Basic Plan Updated"
 *             monthlyPrice: 1099.99
 *             gstRate: 18
 *             code: "BASIC150"
 *             benefits: "Unlimited data, 24x7 support, Free router"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Plan updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 companyId:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 monthlyPrice:
 *                   type: number
 *                 gstRate:
 *                   type: integer
 *                 code:
 *                   type: string
 *                 benefits:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *             example:
 *               id: 1
 *               companyId: 1
 *               name: "Basic Plan Updated"
 *               monthlyPrice: 1099.99
 *               gstRate: 18
 *               code: "BASIC150"
 *               benefits: "Unlimited data, 24x7 support, Free router"
 *               isActive: true
 *       404:
 *         description: Plan not found
 */
router.put(
  "/:id",
  ...requirePermissionWithCompany("plan.manage"),
  planController.updatePlan
);

/**
 * @swagger
 * /plans/{id}:
 *   delete:
 *     summary: Delete plan by ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deleted
 *       404:
 *         description: Plan not found
 */
router.delete(
  "/:id",
  ...requirePermissionWithCompany("plan.manage"),
  planController.deletePlan
);

module.exports = router;
