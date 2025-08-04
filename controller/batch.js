const BatchModel = require("../models/batch");
const StudentModel = require("../models/student");
const {validateCompany, validateBranch} = require("../helpers/validators");

// Unified error response helper
const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE BATCH
const createBatch = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            name,
            description,
            batchTime,
            students = [],
            branch,
            standard,
            createdBy,
        } = req.body;

        if (!name || !batchTime) {
            return sendError(res, 400, "Batch name and batchTime are required.");
        }

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const newBatch = await BatchModel.create({
            name,
            description,
            batchTime,
            students,
            company: companyId,
            branch,
            standard,
            createdBy,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Batch created successfully",
            data: newBatch,
        });
    } catch (err) {
        console.error("Error creating batch:", err);
        return sendError(res, 500, "Internal server error. Failed to create batch.");
    }
};

// GET ALL BATCHES
const getAllBatches = async (req, res) => {
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

        const batches = await BatchModel.find(query)
            .populate("branch", "name")
            .populate("students", "firstName lastName userName");

        return res.status(200).json({
            status: 200,
            success: true,
            data: batches,
        });
    } catch (err) {
        console.error("Error fetching batches:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch batches.");
    }
};

// GET SINGLE BATCH
const getSingleBatch = async (req, res) => {
    try {
        const {companyId, batchId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const batch = await BatchModel.findOne({
            _id: batchId,
            company: companyId,
            deletedAt: null,
        })
            .populate("branch", "name")
            .populate("students", "firstName lastName userName");

        if (!batch) {
            return sendError(res, 404, "Batch not found");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: batch,
        });
    } catch (err) {
        console.error("Error fetching batch:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch batch.");
    }
};

// UPDATE BATCH
const updateBatch = async (req, res) => {
    try {
        const {companyId, batchId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const batch = await BatchModel.findOne({
            _id: batchId,
            company: companyId,
            deletedAt: null,
        });

        if (!batch) {
            return sendError(res, 404, "Batch not found");
        }

        const updateData = {...req.body};

        if (updateData.branch) {
            const isValidBranch = await validateBranch(updateData.branch, companyId, res);
            if (!isValidBranch) return;
        }

        const updatedBatch = await BatchModel.findByIdAndUpdate(batchId, updateData, {new: true});

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Batch updated successfully",
            data: updatedBatch,
        });
    } catch (err) {
        console.error("Error updating batch:", err);
        return sendError(res, 500, "Internal server error. Failed to update batch.");
    }
};

// DELETE BATCH (soft delete)
const deleteBatch = async (req, res) => {
    try {
        const {companyId, batchId} = req.params;
        const deletedBy = req.body.deletedBy;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await BatchModel.findOneAndUpdate(
            {_id: batchId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Batch not found or already deleted");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Batch deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting batch:", err);
        return sendError(res, 500, "Internal server error. Failed to delete batch.");
    }
};

// ADD STUDENT TO BATCH
const addStudentToBatch = async (req, res) => {
    try {
        const {companyId, batchId} = req.params;
        const {studentId} = req.body;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const batch = await BatchModel.findOne({
            _id: batchId,
            company: companyId,
            deletedAt: null,
        });

        if (!batch) {
            return sendError(res, 404, "Batch not found");
        }

        const student = await StudentModel.findOne({
            _id: studentId,
            company: companyId,
            deletedAt: null,
        });

        if (!student) {
            return sendError(res, 404, "Student not found");
        }

        if (!batch.students.includes(studentId)) {
            batch.students.push(studentId);
            await batch.save();
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Student added to batch successfully",
            data: batch,
        });
    } catch (err) {
        console.error("Error adding student to batch:", err);
        return sendError(res, 500, "Internal server error. Failed to add student to batch.");
    }
};

module.exports = {
    createBatch,
    getAllBatches,
    getSingleBatch,
    updateBatch,
    deleteBatch,
    addStudentToBatch
};
