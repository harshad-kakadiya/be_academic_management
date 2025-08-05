const FeesModel = require("../models/fees");
const StudentModel = require("../models/student"); // Import Student model
const {validateCompany, validateBranch} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// Helper to parse amount to number safely
const toNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
};

// CREATE FEE
const createFee = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            student,
            branch,
            feeType,
            amount,
            paymentDate,
            paymentMode,
            receiptNumber,
            description,
            status,
            createdBy
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

        const numericAmount = toNumber(amount);

        const newFee = await FeesModel.create({
            student,
            company: companyId,
            branch,
            feeType,
            amount: numericAmount,
            paymentDate,
            paymentMode,
            receiptNumber,
            description,
            status,
            attachment: attachmentUrl,
            createdBy
        });

        if (student && numericAmount !== 0) {
            await StudentModel.findByIdAndUpdate(
                student,
                {$inc: {amountPaid: numericAmount}},
                {new: true}
            );
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Fee record created successfully and student's amountPaid updated.",
            data: newFee
        });
    } catch (err) {
        console.error("Error creating fee:", err);
        return sendError(res, 500, "Internal server error. Failed to create fee.");
    }
};

// GET ALL FEES (unchanged)
const getAllFees = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {branch} = req.query;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const query = {
            company: companyId,
            deletedAt: null
        };

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
            query.branch = branch;
        }

        const fees = await FeesModel.find(query)
            .populate("student", "firstName lastName contact")
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

// GET SINGLE FEE (unchanged except ensure amount present)
const getSingleFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const fee = await FeesModel.findOne({
            _id: feeId,
            company: companyId,
            deletedAt: null
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

// UPDATE FEE (adjust student's amountPaid accordingly)
const updateFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const fee = await FeesModel.findOne({
            _id: feeId,
            company: companyId,
            deletedAt: null
        });

        if (!fee) {
            return sendError(res, 404, "Fee record not found.");
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

        const oldAmount = toNumber(fee.amount);
        const newAmount = updateData.amount !== undefined ? toNumber(updateData.amount) : oldAmount;

        const oldStudentId = fee.student ? String(fee.student) : null;
        const newStudentId = updateData.student !== undefined ? String(updateData.student) : oldStudentId;

        if (oldStudentId && newStudentId && oldStudentId !== newStudentId) {
            if (oldAmount !== 0) {
                await StudentModel.findByIdAndUpdate(
                    oldStudentId,
                    {$inc: {amountPaid: -oldAmount}},
                    {new: true}
                );
            }
            if (newAmount !== 0) {
                await StudentModel.findByIdAndUpdate(
                    newStudentId,
                    {$inc: {amountPaid: newAmount}},
                    {new: true}
                );
            }
        } else {
            const diff = newAmount - oldAmount;
            if (newStudentId && diff !== 0) {
                await StudentModel.findByIdAndUpdate(
                    newStudentId,
                    {$inc: {amountPaid: diff}},
                    {new: true}
                );
            }
        }

        if (updateData.amount !== undefined) updateData.amount = newAmount;

        const updatedFee = await FeesModel.findByIdAndUpdate(feeId, updateData, {new: true});

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fee record updated successfully and student's amountPaid adjusted.",
            data: updatedFee
        });
    } catch (err) {
        console.error("Error updating fee:", err);
        return sendError(res, 500, "Internal server error. Failed to update fee.");
    }
};

// DELETE FEE (Soft Delete) - reverse student's amountPaid
const deleteFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;
        const deletedBy = req.body?.deletedBy;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const fee = await FeesModel.findOne({
            _id: feeId,
            company: companyId,
            deletedAt: null
        });

        if (!fee) {
            return sendError(res, 404, "Fee record not found or already deleted.");
        }

        const feeAmount = toNumber(fee.amount);
        const studentId = fee.student ? String(fee.student) : null;

        const deleted = await FeesModel.findOneAndUpdate(
            {_id: feeId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Fee record not found or already deleted.");
        }

        if (studentId && feeAmount !== 0) {
            await StudentModel.findByIdAndUpdate(
                studentId,
                {$inc: {amountPaid: -feeAmount}},
                {new: true}
            );
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fee record deleted successfully and student's amountPaid reversed."
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
    deleteFee
};
