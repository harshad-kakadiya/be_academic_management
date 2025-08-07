const ExamModel = require("../models/exam");
const {validateCompany, validateBranch} = require("../helpers/validators");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE EXAM
const createExam = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            date,
            examType,
            title,
            description,
            totalMarks,
            students,
            conductedBy,
            branch,
            createdBy,
            otherInfo
        } = req.body;

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const newExam = await ExamModel.create({
            date,
            examType,
            title,
            description,
            totalMarks,
            students,
            conductedBy,
            company: companyId,
            branch,
            createdBy,
            otherInfo
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Exam created successfully.",
            data: newExam,
        });
    } catch (err) {
        console.error("Error creating exam:", err);
        return sendError(res, 500, "Internal server error. Failed to create exam.");
    }
};

// GET ALL EXAMS
const getAllExams = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {branch} = req.query;

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

        const exams = await ExamModel.find(query)
            .populate("conductedBy", "name")
            .populate("createdBy", "userName email")
            .populate("branch", "name")
            .populate("students.student", "firstName lastName std contact");

        return res.status(200).json({
            status: 200,
            success: true,
            data: exams,
        });
    } catch (err) {
        console.error("Error fetching exams:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch exams.");
    }
};

// GET SINGLE EXAM
const getSingleExam = async (req, res) => {
    try {
        const {companyId, examId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const exam = await ExamModel.findOne({
            _id: examId,
            company: companyId,
            deletedAt: null,
        })
            .populate("conductedBy", "firstName lastName")
            .populate("createdBy", "userName email")
            .populate("branch", "name")
            .populate("students.student", "firstName lastName std contact");

        if (!exam) {
            return sendError(res, 404, "Exam not found.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: exam,
        });
    } catch (err) {
        console.error("Error fetching exam:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch exam.");
    }
};

// UPDATE EXAM
const updateExam = async (req, res) => {
    try {
        const {companyId, examId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const exam = await ExamModel.findOne({
            _id: examId,
            company: companyId,
            deletedAt: null,
        });

        if (!exam) {
            return sendError(res, 404, "Exam not found.");
        }

        const updateData = {...req.body};

        if (updateData.branch) {
            const isValidBranch = await validateBranch(updateData.branch, companyId, res);
            if (!isValidBranch) return;
        }

        const updatedExam = await ExamModel.findByIdAndUpdate(
            examId,
            updateData,
            {new: true}
        );

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Exam updated successfully.",
            data: updatedExam,
        });
    } catch (err) {
        console.error("Error updating exam:", err);
        return sendError(res, 500, "Internal server error. Failed to update exam.");
    }
};

// DELETE EXAM (Soft Delete)
const deleteExam = async (req, res) => {
    try {
        const {companyId, examId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await ExamModel.findOneAndUpdate(
            {_id: examId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Exam not found or already deleted.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Exam deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting exam:", err);
        return sendError(res, 500, "Internal server error. Failed to delete exam.");
    }
};

module.exports = {
    createExam,
    getAllExams,
    getSingleExam,
    updateExam,
    deleteExam,
};
