const express = require('express');
const router = express.Router();

const authRouter = require("./api/auth")
const userRouter = require("./api/user")
const employeeRouter = require("./api/employee")
const companyRouter = require("./api/company")
const studentRouter = require("./api/student")
const examRouter = require("./api/exam")
const feesRouter = require("./api/fees")
const complainRouter = require("./api/complain")
const batchRouter = require("./api/batch")
const calendarRouter = require("./api/calendar")
const configRouter = require("./api/config")
const branchRouter = require("./api/branch")
const assignmentRouter = require("./api/assignment")
const attendanceRouter = require("./api/attendance")

const auth = require("../middlewares/auth");

router.use("/auth", authRouter);
router.use("/company", auth, userRouter);
router.use("/company", auth, employeeRouter);
router.use("/company", auth, configRouter);
router.use("/company", auth, companyRouter);
router.use("/company", auth, studentRouter);
router.use("/company", auth, examRouter);
router.use("/company", auth, feesRouter);
router.use("/company", auth, complainRouter);
router.use("/company", auth, batchRouter);
router.use("/company", auth, calendarRouter);
router.use("/company", auth, branchRouter);
router.use("/company", auth, assignmentRouter);
router.use("/company", auth, attendanceRouter);

module.exports = router;