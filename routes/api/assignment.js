const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    updateStudentStatus,
    getAssignments,
    getAssignmentById,
} = require("../../controller/assignment");

const upload = require("../../middlewares/upload");

router.post("/:companyId/assignment", upload.single("attachment"), createAssignment);
router.get("/:companyId/assignment", getAssignments);
router.get("/:companyId/assignment/:assignmentId", getAssignmentById);
router.put("/:companyId/assignment/:assignmentId", upload.single("attachment"), updateAssignment);
router.delete("/:companyId/assignment/:assignmentId", deleteAssignment);
router.post(
    "/:companyId/assignment/:assignmentId/submit",
    upload.single("attachment"),
    submitAssignment
);
router.patch(
    "/:companyId/assignment/:assignmentId/student-status",
    updateStudentStatus
);

module.exports = router;
