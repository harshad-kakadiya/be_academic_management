const AssignmentModel = require("../models/assignment");
const {validateCompany, validateBranch} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");
const mongoose = require("mongoose");
const {ASSIGNMENT_STATUS} = require("../constant");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE ASSIGNMENT
const createAssignment = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            dueDate,
            title,
            description,
            students = [],
            branch,
            assignedBy,
            createdBy,
            otherInfo,
        } = req.body;

        if (!dueDate || !title || !assignedBy) {
            return sendError(res, 400, "dueDate, title and assignedBy are required.");
        }

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const normalizedStudents = (Array.isArray(students) ? students : [])
            .map((s) => {
                if (typeof s === "string" || s instanceof mongoose.Types.ObjectId) {
                    return {student: s};
                }
                return s;
            });

        const newAssignment = await AssignmentModel.create({
            dueDate,
            title,
            description,
            students: normalizedStudents,
            assignedBy,
            company: companyId,
            branch,
            createdBy,
            otherInfo,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Assignment created successfully.",
            data: newAssignment,
        });
    } catch (err) {
        console.error("Error creating assignment:", err);
        return sendError(res, 500, "Internal server error. Failed to create assignment.");
    }
};

// GET ASSIGNMENTS (list) - supports filters and pagination
const getAssignments = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            branch,
            student,
            status,
            dueDateFrom,
            dueDateTo,
            page = 1,
            limit = 20,
            search,
        } = req.query;

        const query = {company: companyId, deletedAt: null};

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
            query.branch = branch;
        }

        if (search) {
            query.$or = [
                {title: {$regex: search, $options: "i"}},
                {description: {$regex: search, $options: "i"}},
            ];
        }

        if (dueDateFrom || dueDateTo) {
            query.dueDate = {};
            if (dueDateFrom) query.dueDate.$gte = new Date(dueDateFrom);
            if (dueDateTo) query.dueDate.$lte = new Date(dueDateTo);
        }

        const skip = (Math.max(Number(page), 1) - 1) * Number(limit);
        const total = await AssignmentModel.countDocuments(query);

        let assignments = await AssignmentModel.find(query)
            .populate("assignedBy", "firstName lastName _id")
            .populate("branch", "name _id")
            .populate("createdBy", "firstName lastName _id")
            .populate("students.student", "firstName lastName std contact _id")
            .sort({createdAt: -1})
            .skip(skip)
            .limit(Number(limit))
            .lean();

        if (student) {
            assignments = assignments.filter((a) =>
                Array.isArray(a.students) &&
                a.students.some((s) => String(s.student) === String(student))
            );
        }

        if (status) {
            const statusUpper = status.toString();
            assignments = assignments.filter((a) =>
                Array.isArray(a.students) &&
                a.students.some((s) => s.status === statusUpper)
            );
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Assignments fetched successfully.",
            meta: {total, page: Number(page), limit: Number(limit)},
            data: assignments,
        });
    } catch (err) {
        console.error("Error fetching assignments:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch assignments.");
    }
};

// GET ASSIGNMENT BY ID
const getAssignmentById = async (req, res) => {
    try {
        const {companyId, assignmentId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!assignmentId) return sendError(res, 400, "Assignment id is required.");

        const assignment = await AssignmentModel.findOne({_id: assignmentId, company: companyId, deletedAt: null})
            .populate("assignedBy", "firstName lastName _id")
            .populate("createdBy", "firstName lastName _id")
            .populate("branch", "name _id")
            .populate("students.student", "firstName lastName std contact _id")
            .lean();

        if (!assignment) return sendError(res, 404, "Assignment not found.");

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Assignment fetched successfully.",
            data: assignment,
        });
    } catch (err) {
        console.error("Error fetching assignment by id:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch assignment.");
    }
};

// UPDATE ASSIGNMENT
const updateAssignment = async (req, res) => {
    try {
        const {companyId, assignmentId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!assignmentId) return sendError(res, 400, "Assignment id is required.");

        const {
            dueDate,
            title,
            description,
            students,
            branch,
            assignedBy,
            otherInfo,
        } = req.body;

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const update = {};
        if (dueDate) update.dueDate = dueDate;
        if (title) update.title = title;
        if (description !== undefined) update.description = description;
        if (students !== undefined) {
            update.students = (Array.isArray(students) ? students : []).map((s) => {
                if (typeof s === "string" || s instanceof mongoose.Types.ObjectId) {
                    return {student: s};
                }
                return s;
            });
        }
        if (branch !== undefined) update.branch = branch;
        if (assignedBy !== undefined) update.assignedBy = assignedBy;
        if (otherInfo !== undefined) update.otherInfo = otherInfo;

        const updated = await AssignmentModel.findOneAndUpdate(
            {_id: assignmentId, company: companyId, deletedAt: null},
            {$set: update},
            {new: true}
        );

        if (!updated) return sendError(res, 404, "Assignment not found or already deleted.");

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Assignment updated successfully.",
            data: updated,
        });
    } catch (err) {
        console.error("Error updating assignment:", err);
        return sendError(res, 500, "Internal server error. Failed to update assignment.");
    }
};

// SOFT DELETE ASSIGNMENT
const deleteAssignment = async (req, res) => {
    try {
        const {companyId, assignmentId} = req.params;
        const {deletedBy} = req.body; // user assignmentId doing deletion
        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!assignmentId) return sendError(res, 400, "Assignment id is required.");

        const assignment = await AssignmentModel.findOne({_id: assignmentId, company: companyId, deletedAt: null});
        if (!assignment) return sendError(res, 404, "Assignment not found or already deleted.");

        assignment.deletedAt = new Date();
        assignment.deletedBy = deletedBy || null;
        await assignment.save();

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Assignment deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting assignment:", err);
        return sendError(res, 500, "Internal server error. Failed to delete assignment.");
    }
};

// SUBMIT ASSIGNMENT (student submits) - supports file upload in req.file
const submitAssignment = async (req, res) => {
    try {
        const {companyId, assignmentId} = req.params;
        const {studentId, remarks} = req.body;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!assignmentId || !studentId) return sendError(res, 400, "Assignment id and studentId are required.");

        const assignment = await AssignmentModel.findOne({_id: assignmentId, company: companyId, deletedAt: null});
        if (!assignment) return sendError(res, 404, "Assignment not found.");

        const studentEntryIndex = assignment.students.findIndex(
            (s) => String(s.student) === String(studentId)
        );

        const attachmentUrl = req.file ? await uploadFile(req.file.buffer) : null;

        const now = new Date();

        if (studentEntryIndex === -1) {
            assignment.students.push({
                student: studentId,
                status: ASSIGNMENT_STATUS.COMPLETED,
                submissionDate: now,
                remarks: remarks || "",
                attachment: attachmentUrl,
            });
        } else {
            assignment.students[studentEntryIndex].status = ASSIGNMENT_STATUS.COMPLETED;
            assignment.students[studentEntryIndex].submissionDate = now;
            if (remarks !== undefined) assignment.students[studentEntryIndex].remarks = remarks;
            if (attachmentUrl) assignment.students[studentEntryIndex].attachment = attachmentUrl;
        }

        await assignment.save();

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Assignment submitted successfully.",
            data: assignment,
        });
    } catch (err) {
        console.error("Error submitting assignment:", err);
        return sendError(res, 500, "Internal server error. Failed to submit assignment.");
    }
};

// UPDATE STUDENT STATUS (e.g., mark not completed, or adjust remarks)
const updateStudentStatus = async (req, res) => {
    try {
        const {companyId, assignmentId} = req.params;
        const {studentId, status, remarks} = req.body;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!assignmentId || !studentId) return sendError(res, 400, "Assignment id and studentId are required.");
        if (!status) return sendError(res, 400, "status is required.");

        if (!Object.values(ASSIGNMENT_STATUS).includes(status)) {
            return sendError(res, 400, "Invalid status value.");
        }

        const assignment = await AssignmentModel.findOne({_id: assignmentId, company: companyId, deletedAt: null});
        if (!assignment) return sendError(res, 404, "Assignment not found.");

        const studentEntryIndex = assignment.students.findIndex(
            (s) => String(s.student) === String(studentId)
        );

        if (studentEntryIndex === -1) {
            const entry = {
                student: studentId,
                status,
                submissionDate: status === ASSIGNMENT_STATUS.COMPLETED ? new Date() : null,
                remarks: remarks || "",
            };
            assignment.students.push(entry);
        } else {
            assignment.students[studentEntryIndex].status = status;
            if (status === ASSIGNMENT_STATUS.COMPLETED && !assignment.students[studentEntryIndex].submissionDate) {
                assignment.students[studentEntryIndex].submissionDate = new Date();
            }
            if (remarks !== undefined) assignment.students[studentEntryIndex].remarks = remarks;
        }

        await assignment.save();

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Student assignment status updated successfully.",
            data: assignment,
        });
    } catch (err) {
        console.error("Error updating student status:", err);
        return sendError(res, 500, "Internal server error. Failed to update student status.");
    }
};

module.exports = {
    createAssignment,
    getAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    updateStudentStatus,
};
