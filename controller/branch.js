const BranchModel = require("../models/branch");
const {validateCompany} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");

// Manual field validator
const validateBranchInput = (body, isUpdate = false) => {
    const requiredFields = ["name", "contact", "email", "address", "date"];
    for (const field of requiredFields) {
        if (!isUpdate && !body[field]) return `${field} is required.`;
    }
    return null;
};

// CREATE BRANCH
const createBranch = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            name,
            contact,
            email,
            address,
            date,
            isActive = true,
            createdBy
        } = req.body;

        const validationError = validateBranchInput(req.body);
        if (validationError) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: validationError
            });
        }

        const existing = await BranchModel.findOne({email, company: companyId, deletedAt: null});
        if (existing) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "Branch with this email already exists."
            });
        }

        let branchImage = null;
        if (req.file) {
            branchImage = await uploadFile(req.file.buffer);
        }

        const branch = await BranchModel.create({
            name,
            contact,
            email,
            address,
            date,
            isActive,
            company: companyId,
            branchImage,
            createdBy
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Branch created successfully",
            data: branch
        });
    } catch (err) {
        console.error("Error creating branch:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to create branch."
        });
    }
};

// GET ALL BRANCHES
const getAllBranches = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const branches = await BranchModel.find({company: companyId, deletedAt: null})
            .populate("createdBy", "firstName lastName");

        return res.status(200).json({
            status: 200,
            success: true,
            data: branches
        });
    } catch (err) {
        console.error("Error getting branches:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to fetch branches."
        });
    }
};

// GET SINGLE BRANCH
const getSingleBranch = async (req, res) => {
    try {
        const {companyId, branchId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const branch = await BranchModel.findOne({_id: branchId, company: companyId, deletedAt: null})
            .populate("createdBy", "firstName lastName");

        if (!branch) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Branch not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: branch
        });
    } catch (err) {
        console.error("Error getting branch:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to get branch."
        });
    }
};

// UPDATE BRANCH
const updateBranch = async (req, res) => {
    try {
        const {companyId, branchId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const updateData = {...req.body};

        if (req.file) {
            updateData.branchImage = await uploadFile(req.file.buffer);
        }

        if (updateData.email) {
            const exists = await BranchModel.findOne({
                _id: {$ne: branchId},
                email: updateData.email,
                company: companyId,
                deletedAt: null
            });
            if (exists) {
                return res.status(409).json({
                    status: 409,
                    success: false,
                    message: "Another branch with this email already exists."
                });
            }
        }

        const updated = await BranchModel.findOneAndUpdate(
            {_id: branchId, company: companyId, deletedAt: null},
            updateData,
            {new: true}
        );

        if (!updated) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Branch not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Branch updated successfully",
            data: updated
        });
    } catch (err) {
        console.error("Error updating branch:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to update branch."
        });
    }
};

// DELETE BRANCH (SOFT DELETE)
const deleteBranch = async (req, res) => {
    try {
        const {companyId, branchId} = req.params;
        const {deletedBy} = req.body;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await BranchModel.findOneAndUpdate(
            {_id: branchId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Branch not found or already deleted"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Branch deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting branch:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to delete branch."
        });
    }
};

module.exports = {
    createBranch,
    getAllBranches,
    getSingleBranch,
    updateBranch,
    deleteBranch
};
