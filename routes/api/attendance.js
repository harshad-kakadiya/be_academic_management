const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createAttendance,
    getAllAttendance,
    getSingleAttendance,
    updateAttendance,
    deleteAttendance,
    bulkCreateAttendance,
} = require("../../controller/attendance");

router.post("/:companyId/attendance", createAttendance);
router.get("/:companyId/attendance", getAllAttendance);
router.get("/:companyId/attendance/:attendanceId", getSingleAttendance);
router.put("/:companyId/attendance/:attendanceId", updateAttendance);
router.delete("/:companyId/attendance/:attendanceId", deleteAttendance);
router.post("/:companyId/attendance/bulk", bulkCreateAttendance);

module.exports = router;
