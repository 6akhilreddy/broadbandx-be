const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Plan management
 */

/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Create a new plan
 *     tags: [Plans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: integer
 *                 required: true
 *               name:
 *                 type: string
 *                 required: true
 *               monthlyPrice:
 *                 type: number
 *               gstRate:
 *                 type: integer
 *                 default: 18
 *               code:
 *                 type: string
 *               benefits:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *                 default: true
 *           example:
 *             companyId: 1
 *             name: "Basic Plan"
 *             monthlyPrice: 999.99
 *             gstRate: 18
 *             code: "BASIC100"
 *             benefits: "Unlimited data, 24x7 support"
 *             isActive: true
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
 *       400:
 *         description: Bad request
 */
router.post("/", planController.createPlan);

/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Get all plans
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   companyId:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   monthlyPrice:
 *                     type: number
 *                   gstRate:
 *                     type: integer
 *                   code:
 *                     type: string
 *                   benefits:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *             example:
 *               - id: 1
 *                 companyId: 1
 *                 name: "Basic Plan"
 *                 monthlyPrice: 999.99
 *                 gstRate: 18
 *                 code: "BASIC100"
 *                 benefits: "Unlimited data, 24x7 support"
 *                 isActive: true
 *               - id: 2
 *                 companyId: 1
 *                 name: "Premium Plan"
 *                 monthlyPrice: 1499.99
 *                 gstRate: 18
 *                 code: "PREM300"
 *                 benefits: "Unlimited data, 24x7 priority support"
 *                 isActive: true
 */
router.get("/", planController.getAllPlans);

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
router.get("/:id", planController.getPlanById);

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
router.put("/:id", planController.updatePlan);

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
router.delete("/:id", planController.deletePlan);

module.exports = router;
