const express = require("express");
const router = express.Router();
const supervisorController = require("../controllers/supervisorController");
const {
  companyFilter,
  requirePermission,
  requirePermissionWithCompany,
} = require("../middlewares");

router.post(
  "/",
  ...requirePermissionWithCompany("supervisor.manage"),
  supervisorController.createSupervisor
);

router.get(
  "/",
  ...requirePermission("supervisors.view"),
  ...companyFilter,
  supervisorController.getAllSupervisors
);

router.get(
  "/:id",
  ...requirePermission("supervisors.view"),
  ...companyFilter,
  supervisorController.getSupervisorById
);

router.put(
  "/:id",
  ...requirePermissionWithCompany("supervisor.manage"),
  supervisorController.updateSupervisor
);

router.delete(
  "/:id",
  ...requirePermissionWithCompany("supervisor.manage"),
  supervisorController.deleteSupervisor
);

module.exports = router;
