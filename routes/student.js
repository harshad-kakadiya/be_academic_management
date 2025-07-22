const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    deleteStudent,
} = require("../controller/student");

const upload = require("../middlewares/upload");

router.post("/:companyId/student", upload.single("studentImage"), createStudent);
router.get("/:companyId/student", getAllStudents);
router.get("/:companyId/student/:studentId", getSingleStudent);
router.put("/:companyId/student/:studentId", upload.single("studentImage"), updateStudent);
router.delete("/:companyId/student/:studentId", deleteStudent);

module.exports = router;
