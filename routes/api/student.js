const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    deleteStudent,
    addStudentRemark,
    bulkUploadStudents,
    getStudentFees,
    getStudentAttendance,
    getStudentAssignments,
    getStudentExams,
    getStudentEvents
} = require("../../controller/student");

const upload = require("../../middlewares/upload");

router.post("/:companyId/student", upload.single("studentImage"), createStudent);
router.get("/:companyId/student", getAllStudents);
router.get("/:companyId/student/:studentId", getSingleStudent);
router.put("/:companyId/student/:studentId", upload.single("studentImage"), updateStudent);
router.delete("/:companyId/student/:studentId", deleteStudent);
router.post('/:companyId/students/:studentId/remark', addStudentRemark);
router.post('/:companyId/students/bulk-upload', upload.single("file"), bulkUploadStudents);
router.get('/:companyId/student/:studentId/fees', getStudentFees);
router.get('/:companyId/student/:studentId/attendance', getStudentAttendance);
router.get('/:companyId/student/:studentId/assignments', getStudentAssignments);
router.get('/:companyId/student/:studentId/exams', getStudentExams);
router.get('/:companyId/student/:studentId/events', getStudentEvents);

module.exports = router;
