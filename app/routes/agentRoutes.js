const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agentController");

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent management (company-scoped via authenticated user)
 */

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new agent (scoped to the authenticated user's company)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               password:
 *                 type: string
 *                 description: Plain password; will be hashed by the model hook
 *               companyId:
 *                 type: number
 *                 description: The ID of the company the agent belongs to
 *           example:
 *             name: "John Smith"
 *             email: "john.smith@example.com"
 *             phone: "9876543210"
 *             isActive: true
 *             password: "StrongPass#123"
 *             companyId: 1
 *     responses:
 *       201:
 *         description: Agent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                 companyId:
 *                   type: integer
 *             example:
 *               id: 1
 *               name: "John Smith"
 *               email: "john.smith@example.com"
 *               phone: "9876543210"
 *               isActive: true
 *               role: "AGENT"
 *               companyId: 42
 *       400:
 *         description: Bad request (e.g., missing password or uniqueness validation error)
 *       401:
 *         description: Unauthorized
 */
router.post("/", agentController.createAgent);

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Get all agents for the authenticated user's company
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of agents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   role:
 *                     type: string
 *                   companyId:
 *                     type: integer
 *             example:
 *               - id: 1
 *                 name: "John Smith"
 *                 email: "john.smith@example.com"
 *                 phone: "9876543210"
 *                 isActive: true
 *                 role: "AGENT"
 *                 companyId: 42
 *               - id: 2
 *                 name: "Jane Doe"
 *                 email: "jane.doe@example.com"
 *                 phone: "9876543211"
 *                 isActive: true
 *                 role: "AGENT"
 *                 companyId: 42
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: User is not associated with a company
 */
router.get("/", agentController.getAllAgents);

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get agent by ID (must belong to the authenticated user's company)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                 companyId:
 *                   type: integer
 *             example:
 *               id: 1
 *               name: "John Smith"
 *               email: "john.smith@example.com"
 *               phone: "9876543210"
 *               isActive: true
 *               role: "AGENT"
 *               companyId: 42
 *       404:
 *         description: Agent not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: User is not associated with a company
 */
router.get("/:id", agentController.getAgentById);

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     summary: Update agent by ID (must belong to the authenticated user's company)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Agent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *           example:
 *             name: "John Smith Updated"
 *             email: "john.smith.updated@example.com"
 *             phone: "9876543210"
 *             isActive: true
 *     responses:
 *       200:
 *         description: Agent updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *                 role:
 *                   type: string
 *                 companyId:
 *                   type: integer
 *             example:
 *               id: 1
 *               name: "John Smith Updated"
 *               email: "john.smith.updated@example.com"
 *               phone: "9876543210"
 *               isActive: true
 *               role: "AGENT"
 *               companyId: 42
 *       404:
 *         description: Agent not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Validation error or user not associated with a company
 */
router.put("/:id", agentController.updateAgent);

/**
 * @swagger
 * /agents/{id}:
 *   delete:
 *     summary: Delete agent by ID (must belong to the authenticated user's company)
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Agent ID
 *     responses:
 *       200:
 *         description: Agent deleted
 *       404:
 *         description: Agent not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: User is not associated with a company
 */
router.delete("/:id", agentController.deleteAgent);

module.exports = router;
