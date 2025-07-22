const FeesModel = require("../models/fees");
const {validateCompany, validateBranch} = require("../helpers/validators");
const {FEETYPE, PAYMENT_STATUS, PAYMENT_MODE} = require("../constant");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE FEE
const createFee = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            student, branch, feeType,
            amount, paymentDate, paymentMode,
            receiptNumber, description, status,
            createdBy
        } = req.body;

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const newFee = await FeesModel.create({
            student,
            company: companyId,
            branch,
            feeType,
            amount,
            paymentDate,
            paymentMode,
            receiptNumber,
            description,
            status,
            createdBy
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Fee record created successfully.",
            data: newFee
        });
    } catch (err) {
        console.error("Error creating fee:", err);
        return sendError(res, 500, "Internal server error. Failed to create fee.");
    }
};

// GET ALL FEES
const getAllFees = async (req, res) => {
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

        const fees = await FeesModel.find(query)
            .populate("student", "name contact")
            .populate("createdBy", "userName email")
            .populate("branch", "name");

        return res.status(200).json({
            status: 200,
            success: true,
            data: fees
        });
    } catch (err) {
        console.error("Error fetching fees:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch fees.");
    }
};

// GET SINGLE FEE
const getSingleFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const fee = await FeesModel.findOne({
            _id: feeId,
            company: companyId,
            deletedAt: null,
        })
            .populate("student", "name contact")
            .populate("createdBy", "userName email")
            .populate("branch", "name");

        if (!fee) {
            return sendError(res, 404, "Fee record not found.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: fee
        });
    } catch (err) {
        console.error("Error fetching fee:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch fee.");
    }
};

// UPDATE FEE
const updateFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const fee = await FeesModel.findOne({
            _id: feeId,
            company: companyId,
            deletedAt: null,
        });

        if (!fee) {
            return sendError(res, 404, "Fee record not found.");
        }

        const updateData = {...req.body};

        if (updateData.branch) {
            const isValidBranch = await validateBranch(updateData.branch, companyId, res);
            if (!isValidBranch) return;
        }

        const updatedFee = await FeesModel.findByIdAndUpdate(
            feeId,
            updateData,
            {new: true}
        );

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fee record updated successfully.",
            data: updatedFee
        });
    } catch (err) {
        console.error("Error updating fee:", err);
        return sendError(res, 500, "Internal server error. Failed to update fee.");
    }
};

// DELETE FEE (Soft Delete)
const deleteFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await FeesModel.findOneAndUpdate(
            {_id: feeId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Fee record not found or already deleted.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fee record deleted successfully."
        });
    } catch (err) {
        console.error("Error deleting fee:", err);
        return sendError(res, 500, "Internal server error. Failed to delete fee.");
    }
};

module.exports = {
    createFee,
    getAllFees,
    getSingleFee,
    updateFee,
    deleteFee,
};
