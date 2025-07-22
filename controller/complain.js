const ComplainModel = require("../models/complain");
const {validateCompany, validateBranch} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE COMPLAIN
const createComplain = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            title, description, complainType,
            branch, createdBy
        } = req.body;

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        let attachmentUrl = null;
        if (req.file) {
            const buffer = req.file.buffer;
            attachmentUrl = await uploadFile(buffer);
        }

        const newComplain = await ComplainModel.create({
            title,
            description,
            complainType,
            attachment: attachmentUrl,
            company: companyId,
            branch,
            createdBy,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Complain created successfully.",
            data: newComplain,
        });
    } catch (err) {
        console.error("Error creating complain:", err);
        return sendError(res, 500, "Internal server error. Failed to create complain.");
    }
};

// GET ALL COMPLAINS
const getAllComplains = async (req, res) => {
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

        const complains = await ComplainModel.find(query)
            .populate("createdBy", "userName email")
            .populate("branch", "name");

        return res.status(200).json({
            status: 200,
            success: true,
            data: complains,
        });
    } catch (err) {
        console.error("Error fetching complains:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch complains.");
    }
};

// GET SINGLE COMPLAIN
const getSingleComplain = async (req, res) => {
    try {
        const {companyId, complainId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const complain = await ComplainModel.findOne({
            _id: complainId,
            company: companyId,
            deletedAt: null,
        })
            .populate("createdBy", "userName email")
            .populate("branch", "name");

        if (!complain) {
            return sendError(res, 404, "Complain not found.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: complain,
        });
    } catch (err) {
        console.error("Error fetching complain:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch complain.");
    }
};

// UPDATE COMPLAIN
const updateComplain = async (req, res) => {
    try {
        const {companyId, complainId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const complain = await ComplainModel.findOne({
            _id: complainId,
            company: companyId,
            deletedAt: null,
        });

        if (!complain) {
            return sendError(res, 404, "Complain not found.");
        }

        const updateData = {...req.body};

        if (updateData.branch) {
            const isValidBranch = await validateBranch(updateData.branch, companyId, res);
            if (!isValidBranch) return;
        }

        if (req.file) {
            const buffer = req.file.buffer;
            updateData.attachment = await uploadFile(buffer);
        }

        const updatedComplain = await ComplainModel.findByIdAndUpdate(
            complainId,
            updateData,
            {new: true}
        );

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Complain updated successfully.",
            data: updatedComplain,
        });
    } catch (err) {
        console.error("Error updating complain:", err);
        return sendError(res, 500, "Internal server error. Failed to update complain.");
    }
};

// DELETE COMPLAIN (soft delete)
const deleteComplain = async (req, res) => {
    try {
        const {companyId, complainId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await ComplainModel.findOneAndUpdate(
            {_id: complainId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Complain not found or already deleted.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Complain deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting complain:", err);
        return sendError(res, 500, "Internal server error. Failed to delete complain.");
    }
};

module.exports = {
    createComplain,
    getAllComplains,
    getSingleComplain,
    updateComplain,
    deleteComplain,
};
