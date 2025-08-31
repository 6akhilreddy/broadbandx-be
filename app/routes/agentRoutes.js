const express = require("express");
const router = express.Router();
const agentController = require("../controllers/agentController");
const {
  companyFilter,
  companyAccess,
  requirePermission,
  requirePermissionWithCompany,
} = require("../middlewares");

/**
 * @swagger
 * tags:
 *   name: Agents
 *   description: Agent management with role-based access control and company-scoped data
 */

/**
 * @swagger
 * /agents:
 *   post:
 *     summary: Create a new agent (scoped to the authenticated user's company)
 *     description: |
 *       Create a new agent with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can create agents for any company (must specify companyId)
 *       - **ADMIN**: Can only create agents for their own company (companyId automatically assigned)
 *
 *       **Required Features:**
 *       - `agent.manage` feature permission required
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
router.post(
  "/",
  ...requirePermissionWithCompany("agent.manage"),
  agentController.createAgent
);

/**
 * @swagger
 * /agents:
 *   get:
 *     summary: Get all agents for a specific company with collection data
 *     description: |
 *       Get agents with role-based access control and company-based filtering.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view all agents across all companies
 *       - **ADMIN**: Can only view agents from their own company
 *
 *       **Required Features:**
 *       - `agents.view` feature permission required
 *
 *       **Note:** companyId parameter is automatically handled based on user's company
 *     tags: [Agents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the company to get agents for
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
 *         description: Search term for agent name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by agent status
 *     responses:
 *       200:
 *         description: List of agents with collection data and pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [ACTIVE, INACTIVE]
 *                       role:
 *                         type: string
 *                       companyId:
 *                         type: integer
 *                       collection:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: number
 *                             description: Total amount collected by the agent
 *                           lastMonth:
 *                             type: number
 *                             description: Amount collected last month
 *                           today:
 *                             type: number
 *                             description: Amount collected today
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
 *               agents:
 *                 - id: 1
 *                   name: "John Smith"
 *                   email: "john.smith@example.com"
 *                   phone: "9876543210"
 *                   status: "ACTIVE"
 *                   role: "AGENT"
 *                   companyId: 42
 *                   collection:
 *                     total: 50000
 *                     lastMonth: 15000
 *                     today: 2500
 *                 - id: 2
 *                   name: "Jane Doe"
 *                   email: "jane.doe@example.com"
 *                   phone: "9876543211"
 *                   status: "ACTIVE"
 *                   role: "AGENT"
 *                   companyId: 42
 *                   collection:
 *                     total: 35000
 *                     lastMonth: 12000
 *                     today: 1800
 *               pagination:
 *                 currentPage: 1
 *                 totalPages: 1
 *                 totalItems: 2
 *                 hasNext: false
 *                 hasPrevious: false
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Company ID is required as a query parameter
 */
router.get(
  "/",
  ...requirePermission("agents.view"),
  ...companyFilter,
  agentController.getAllAgents
);

/**
 * @swagger
 * /agents/{id}:
 *   get:
 *     summary: Get agent by ID (must belong to the specified company)
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
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the company the agent belongs to
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
 *         description: Company ID is required as a query parameter
 */
router.get(
  "/:id",
  ...requirePermission("agents.view"),
  ...companyFilter,
  agentController.getAgentById
);

/**
 * @swagger
 * /agents/{id}:
 *   put:
 *     summary: Update agent by ID (must belong to the specified company)
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
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the company the agent belongs to
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
 *         description: Validation error or company ID is required as a query parameter
 */
router.put(
  "/:id",
  ...requirePermissionWithCompany("agent.manage"),
  agentController.updateAgent
);

/**
 * @swagger
 * /agents/{id}:
 *   delete:
 *     summary: Delete agent by ID (must belong to the specified company)
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
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the company the agent belongs to
 *     responses:
 *       200:
 *         description: Agent deleted
 *       404:
 *         description: Agent not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Company ID is required as a query parameter
 */
router.delete(
  "/:id",
  ...requirePermissionWithCompany("agent.manage"),
  agentController.deleteAgent
);

/**
 * @swagger
 * /agents/{id}/payments:
 *   get:
 *     summary: Get payment history for a specific agent
 *     description: |
 *       Get all payments collected by a specific agent with pagination and filtering.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view payment history for any agent
 *       - **ADMIN**: Can only view payment history for agents in their company
 *
 *       **Required Features:**
 *       - `agents.view` feature permission required
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
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the company the agent belongs to
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter payments until this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Payment history with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       amount:
 *                         type: number
 *                       paymentMethod:
 *                         type: string
 *                       collectedAt:
 *                         type: string
 *                         format: date-time
 *                       status:
 *                         type: string
 *                       customer:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
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
 *       404:
 *         description: Agent not found
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Company ID is required as a query parameter
 */
router.get(
  "/:id/payments",
  ...requirePermission("agents.view"),
  ...companyFilter,
  agentController.getAgentPaymentHistory
);

module.exports = router;
