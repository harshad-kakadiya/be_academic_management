const AttendanceModel = require("../models/attendance");
const StudentModel = require("../models/student");
const {validateCompany, validateBranch} = require("../helpers/validators");

// Unified error response helper
const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE ATTENDANCE
const createAttendance = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            student,
            date,
            status,
            branch,
            createdBy,
        } = req.body;

        if (!student || !date) {
            return sendError(res, 400, "Student and date are required.");
        }

        const studentDoc = await StudentModel.findOne({_id: student, company: companyId, deletedAt: null});
        if (!studentDoc) {
            return sendError(res, 404, "Student not found in this company.");
        }

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const existing = await AttendanceModel.findOne({
            student,
            date: new Date(date),
            deletedAt: null,
        });

        if (existing) {
            return sendError(res, 409, "Attendance already marked for this student on this date.");
        }

        const attendance = await AttendanceModel.create({
            student,
            date,
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

// GET ALL ATTENDANCE
const getAllAttendance = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {branch, date} = req.query;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const query = {
            company: companyId,
            deletedAt: null,
        };

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
            query.branch = branch;
        }

        if (date) {
            query.date = new Date(date);
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
            const validStudent = await StudentModel.findOne({_id: student, company: companyId, deletedAt: null});
            if (!validStudent) {
                return sendError(res, 404, "Invalid student for this company.");
            }
        }

        const updated = await AttendanceModel.findByIdAndUpdate(attendanceId, req.body, {
            new: true,
        });

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
        const deletedBy = req.user?._id;

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
    getAllAttendance,
    getSingleAttendance,
    updateAttendance,
    deleteAttendance,
};
