const express = require("express");
const router = express.Router({mergeParams: true});
const {
    createEmployee,
    getAllEmployees,
    getSingleEmployee,
    updateEmployee,
    deleteEmployee,
} = require("../../controller/employee");

const upload = require("../../middlewares/upload");

router.post("/:companyId/employee", upload.single("employeeImage"), createEmployee);
router.get("/:companyId/employee", getAllEmployees);
router.get("/:companyId/employee/:employeeId", getSingleEmployee);
router.put("/:companyId/employee/:employeeId", upload.single("employeeImage"), updateEmployee);
router.delete("/:companyId/employee/:employeeId", deleteEmployee);

module.exports = router;
