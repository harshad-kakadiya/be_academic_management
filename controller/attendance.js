const AttendanceModel = require("../models/attendance");
const StudentModel = require("../models/student");
const {validateCompany, validateBranch} = require("../helpers/validators");

// Unified error response helper
const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// Helper: Get start & end of a date
const getDayRange = (date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return {startOfDay, endOfDay};
};

// CREATE ATTENDANCE
const createAttendance = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {student, date, status, branch, createdBy} = req.body;

        if (!student || !date) {
            return sendError(res, 400, "Student and date are required.");
        }

        const studentDoc = await StudentModel.findOne({
            _id: student,
            company: companyId,
            deletedAt: null,
        });
        if (!studentDoc) {
            return sendError(res, 404, "Student not found in this company.");
        }

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const {startOfDay, endOfDay} = getDayRange(date);

        const existing = await AttendanceModel.findOne({
            student,
            date: {$gte: startOfDay, $lte: endOfDay},
            deletedAt: null,
        });

        if (existing) {
            return sendError(res, 409, "Attendance already marked for this student on this date.");
        }

        const attendance = await AttendanceModel.create({
            student,
            date: startOfDay,
            status,
            branch,
            company: companyId,
            createdBy,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Attendance marked successfully",
            data: attendance,
        });
    } catch (err) {
        console.error("Error creating attendance:", err);
        return sendError(res, 500, "Internal server error. Failed to mark attendance.");
    }
};

// BULK CREATE ATTENDANCE
const bulkCreateAttendance = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        let attendanceData = req.body;
        if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
            return sendError(res, 400, "Attendance data array is required.");
        }

        const createdRecords = [];
        const skippedRecords = [];

        const studentIds = [...new Set(attendanceData.map(r => r.student))];
        const validStudents = await StudentModel.find({
            _id: {$in: studentIds},
            company: companyId,
            deletedAt: null,
        }).select("_id");

        const validStudentIds = validStudents.map(s => s._id.toString());

        for (const record of attendanceData) {
            const {student, date, branch} = record;

            if (!student || !date) {
                skippedRecords.push({record, reason: "Missing student or date"});
                continue;
            }

            if (!validStudentIds.includes(student.toString())) {
                skippedRecords.push({record, reason: "Student not found in this company"});
                continue;
            }

            if (branch) {
                const isValidBranch = await validateBranch(branch, companyId, res);
                if (!isValidBranch) {
                    skippedRecords.push({record, reason: "Invalid branch for this company"});
                    continue;
                }
            }

            const {startOfDay, endOfDay} = getDayRange(date);

            const existing = await AttendanceModel.findOne({
                student,
                date: {$gte: startOfDay, $lte: endOfDay},
                deletedAt: null,
            });

            if (existing) {
                skippedRecords.push({record, reason: "Attendance already marked for this student on this date"});
                continue;
            }

            createdRecords.push({
                ...record,
                date: startOfDay,
                company: companyId,
            });
        }

        let inserted = [];
        if (createdRecords.length > 0) {
            inserted = await AttendanceModel.insertMany(createdRecords);
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Bulk attendance processed",
            createdCount: inserted.length,
            skippedCount: skippedRecords.length,
            createdRecords: inserted,
            skippedRecords,
        });
    } catch (err) {
        console.error("Error bulk creating attendance:", err);
        return sendError(res, 500, "Internal server error. Failed to process bulk attendance.");
    }
};

// GET ALL ATTENDANCE
const getAllAttendance = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {branch, date} = req.query;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const query = {company: companyId, deletedAt: null};

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
            query.branch = branch;
        }

        if (date) {
            const {startOfDay, endOfDay} = getDayRange(date);
            query.date = {$gte: startOfDay, $lte: endOfDay};
        }

        const attendanceList = await AttendanceModel.find(query)
            .populate("student", "firstName lastName userName")
            .populate("branch", "name");

        return res.status(200).json({
            status: 200,
            success: true,
            data: attendanceList,
        });
    } catch (err) {
        console.error("Error fetching attendance:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch attendance.");
    }
};

// GET SINGLE ATTENDANCE
const getSingleAttendance = async (req, res) => {
    try {
        const {companyId, attendanceId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const attendance = await AttendanceModel.findOne({
            _id: attendanceId,
            company: companyId,
            deletedAt: null,
        })
            .populate("student", "firstName lastName userName")
            .populate("branch", "name");

        if (!attendance) {
            return sendError(res, 404, "Attendance record not found.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: attendance,
        });
    } catch (err) {
        console.error("Error fetching attendance:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch attendance.");
    }
};

// UPDATE ATTENDANCE
const updateAttendance = async (req, res) => {
    try {
        const {companyId, attendanceId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const existing = await AttendanceModel.findOne({
            _id: attendanceId,
            company: companyId,
            deletedAt: null,
        });

        if (!existing) {
            return sendError(res, 404, "Attendance record not found.");
        }

        const {branch, student, date} = req.body;

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        if (student) {
            const validStudent = await StudentModel.findOne({
                _id: student,
                company: companyId,
                deletedAt: null,
            });
            if (!validStudent) {
                return sendError(res, 404, "Invalid student for this company.");
            }
        }

        if (student && date) {
            const {startOfDay, endOfDay} = getDayRange(date);
            const duplicate = await AttendanceModel.findOne({
                _id: {$ne: attendanceId},
                student,
                date: {$gte: startOfDay, $lte: endOfDay},
                deletedAt: null,
            });
            if (duplicate) {
                return sendError(res, 409, "Attendance already exists for this student on this date.");
            }
            req.body.date = startOfDay;
        }

        const updated = await AttendanceModel.findByIdAndUpdate(attendanceId, req.body, {new: true});

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Attendance updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error("Error updating attendance:", err);
        return sendError(res, 500, "Internal server error. Failed to update attendance.");
    }
};

// DELETE (SOFT DELETE) ATTENDANCE
const deleteAttendance = async (req, res) => {
    try {
        const {companyId, attendanceId} = req.params;
        const deletedBy = req.body?.deletedBy;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await AttendanceModel.findOneAndUpdate(
            {_id: attendanceId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Attendance record not found or already deleted");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Attendance deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting attendance:", err);
        return sendError(res, 500, "Internal server error. Failed to delete attendance.");
    }
};

module.exports = {
    createAttendance,
    bulkCreateAttendance,
    getAllAttendance,
    getSingleAttendance,
    updateAttendance,
    deleteAttendance,
};
