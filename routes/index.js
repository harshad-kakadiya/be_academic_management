const express = require('express');
const router = express.Router();

const authRouter = require("../routes/auth")
const userRouter = require("../routes/user")
const employeeRouter = require("../routes/employee")
const companyRouter = require("../routes/company")
const studentRouter = require("../routes/student")
const examRouter = require("../routes/exam")
const feesRouter = require("../routes/fees")
const complainRouter = require("../routes/complain")
const batchRouter = require("../routes/batch")
const calendarRouter = require("../routes/calendar")

const auth = require("../middlewares/auth");

router.use("/auth", authRouter);
router.use("/company", auth, userRouter);
router.use("/company", auth, employeeRouter);
router.use("/company", auth, companyRouter);
router.use("/company", auth, studentRouter);
router.use("/company", auth, examRouter);
router.use("/company", auth, feesRouter);
router.use("/company", auth, complainRouter);
router.use("/company", auth, batchRouter);
router.use("/company", auth, calendarRouter);

module.exports = router;