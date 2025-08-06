const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createExam,
    getAllExams,
    getSingleExam,
    updateExam,
    deleteExam,
} = require("../../controller/exam");

router.post("/:companyId/exam", createExam);
router.get("/:companyId/exam", getAllExams);
router.get("/:companyId/exam/:examId", getSingleExam);
router.put("/:companyId/exam/:examId", updateExam);
router.delete("/:companyId/exam/:examId", deleteExam);

module.exports = router;
