const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createAssignment,
    updateAssignment,
    deleteAssignment,
    getAssignments,
    getAssignmentById,
} = require("../../controller/assignment");

const upload = require("../../middlewares/upload");

router.post("/:companyId/assignment", upload.any(), createAssignment);
router.get("/:companyId/assignment", getAssignments);
router.get("/:companyId/assignment/:assignmentId", getAssignmentById);
router.put("/:companyId/assignment/:assignmentId", upload.any(), updateAssignment);
router.delete("/:companyId/assignment/:assignmentId", deleteAssignment);

module.exports = router;
