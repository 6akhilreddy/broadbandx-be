const express = require("express");
const router = express.Router();
const {
  getAllAreas,
  getAreaById,
  createArea,
  updateArea,
  deleteArea,
} = require("../controllers/areaController");

const {
  companyFilter,
  companyAccess,
  requirePermission,
  requirePermissionWithCompany,
} = require("../middlewares");

/**
 * @swagger
 * components:
 *   schemas:
 *     Area:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Area ID
 *         areaName:
 *           type: string
 *           description: Name of the area
 *         companyId:
 *           type: integer
 *           description: Company ID this area belongs to
 *         createdBy:
 *           type: integer
 *           description: User ID who created the area
 *   tags:
 *     - name: Areas
 *       description: Area management with role-based access control
 */

/**
 * @swagger
 * /areas:
 *   get:
 *     summary: Get all areas for a company
 *     description: |
 *       Get all areas for a specific company with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view areas for any company (must specify companyId)
 *       - **ADMIN/AGENT**: Can only view areas for their own company (companyId automatically assigned)
 *
 *       **Required Features:**
 *       - `area.manage` feature permission required
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for area name
 *     responses:
 *       200:
 *         description: List of areas
 *       400:
 *         description: Bad request
 */
router.get("/", ...requirePermissionWithCompany("area.manage"), getAllAreas);

/**
 * @swagger
 * /areas/{id}:
 *   get:
 *     summary: Get area by ID
 *     description: |
 *       Get a specific area by ID with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can view any area (must specify companyId)
 *       - **ADMIN/AGENT**: Can only view areas from their own company
 *
 *       **Required Features:**
 *       - `area.manage` feature permission required
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Area ID
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Area details
 *       404:
 *         description: Area not found
 */
router.get("/:id", ...requirePermissionWithCompany("area.manage"), getAreaById);

/**
 * @swagger
 * /areas:
 *   post:
 *     summary: Create a new area
 *     description: |
 *       Create a new area with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can create areas for any company (must specify companyId)
 *       - **ADMIN**: Can only create areas for their own company (companyId automatically assigned)
 *       - **AGENT**: Cannot create areas
 *
 *       **Required Features:**
 *       - `area.manage` feature permission required
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: integer
 *               areaName:
 *                 type: string
 *               createdBy:
 *                 type: integer
 *           example:
 *             companyId: 1
 *             areaName: "New Zone"
 *             createdBy: 1
 *     responses:
 *       201:
 *         description: Area created
 *       400:
 *         description: Bad request
 */
router.post("/", ...requirePermissionWithCompany("area.manage"), createArea);

/**
 * @swagger
 * /areas/{id}:
 *   put:
 *     summary: Update an area
 *     description: |
 *       Update an existing area with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can update any area (must specify companyId)
 *       - **ADMIN**: Can only update areas from their own company
 *       - **AGENT**: Cannot update areas
 *
 *       **Required Features:**
 *       - `area.manage` feature permission required
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Area ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: integer
 *               areaName:
 *                 type: string
 *           example:
 *             companyId: 1
 *             areaName: "Updated Zone"
 *     responses:
 *       200:
 *         description: Area updated
 *       404:
 *         description: Area not found
 */
router.put("/:id", ...requirePermissionWithCompany("area.manage"), updateArea);

/**
 * @swagger
 * /areas/{id}:
 *   delete:
 *     summary: Delete an area
 *     description: |
 *       Delete an area with role-based access control.
 *
 *       **Access Control:**
 *       - **SUPER_ADMIN**: Can delete any area (must specify companyId)
 *       - **ADMIN**: Can only delete areas from their own company
 *       - **AGENT**: Cannot delete areas
 *
 *       **Required Features:**
 *       - `area.manage` feature permission required
 *     tags: [Areas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Area ID
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Area deleted
 *       404:
 *         description: Area not found
 */
router.delete(
  "/:id",
  ...requirePermissionWithCompany("area.manage"),
  deleteArea
);

module.exports = router;
