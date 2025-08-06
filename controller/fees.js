const FeesModel = require("../models/fees");
const StudentModel = require("../models/student");
const CompanyModel = require("../models/company");
const BranchModel = require("../models/branch");
const {validateCompany, validateBranch} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");
const {FEETYPE, PAYMENT_STATUS} = require("../constant");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// Helper to parse amount to number safely
const toNumber = (val) => {
    const n = Number(val);
    return Number.isFinite(n) ? n : 0;
};

// compute GST amount & total
const computeGst = (amount, isGst, gstRate) => {
    const a = toNumber(amount);
    const rate = isGst ? toNumber(gstRate) : 0;
    const gstAmount = Number(((a * rate) / 100).toFixed(2));
    const totalWithGst = Number((a + gstAmount).toFixed(2));
    return {gstAmount, totalWithGst, gstRate: rate};
};

// Helper: Generate Unique Receipt Number with Names
const generateReceiptNumber = async (companyId, branchId) => {
    const company = await CompanyModel.findById(companyId).select("name");
    const branch = branchId ? await BranchModel.findById(branchId).select("name") : null;

    const lastFee = await FeesModel.findOne({
        company: companyId,
        branch: branchId || null,
    })
        .sort({createdAt: -1})
        .select("receiptNumber");

    let nextNumber = 1;
    if (lastFee?.receiptNumber) {
        const parts = lastFee.receiptNumber.split("-");
        const lastSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSeq)) nextNumber = lastSeq + 1;
    }

    const companyCode = company?.name ? company.name.replace(/\s+/g, "").toUpperCase() : "COMP";
    const branchCode = branch?.name ? branch.name.replace(/\s+/g, "").toUpperCase() : "MAIN";
    const paddedSeq = String(nextNumber).padStart(4, "0");

    return `${companyCode}-${branchCode}-${paddedSeq}`;
};

// helper to check tuition
const isTuitionType = (type) => String(type).toUpperCase() === FEETYPE.TUITIONFEES;

// helper to check extra types (ADMISSION or OTHER)
const isExtraType = (type) => {
    const t = String(type).toUpperCase();
    return t === FEETYPE.ADMISSION || t === FEETYPE.OTHER;
};

// Helper: check if student already fully paid (true if fully paid)
const studentIsFullyPaid = async (studentId) => {
    const stud = await StudentModel.findById(studentId).select("totalFee amountPaid");
    if (!stud) return {exists: false, fullyPaid: false, message: "Student not found."};

    const alreadyPaid = toNumber(stud.amountPaid);
    const totalFee = toNumber(stud.totalFee);

    return {
        exists: true,
        fullyPaid: alreadyPaid >= totalFee,
        alreadyPaid,
        totalFee,
    };
};

const incStudentCounter = async (studentId, type, amt, gstAmt) => {
    if (!studentId) return;
    const updateObj = {};
    amt = toNumber(amt);
    gstAmt = toNumber(gstAmt);

    if (amt !== 0) {
        if (isTuitionType(type)) updateObj.amountPaid = amt;
        else if (isExtraType(type)) updateObj.extraPaid = amt;
        else updateObj.amountPaid = amt; // fallback to amountPaid
    }

    if (gstAmt !== 0) {
        updateObj.gstPaid = gstAmt;
    }

    if (Object.keys(updateObj).length > 0) {
        await StudentModel.findByIdAndUpdate(studentId, {$inc: updateObj}, {new: true});
    }
};

const decStudentCounter = async (studentId, type, amt, gstAmt) => {
    if (!studentId) return;
    const updateObj = {};
    amt = toNumber(amt);
    gstAmt = toNumber(gstAmt);

    if (amt !== 0) {
        if (isTuitionType(type)) updateObj.amountPaid = -amt;
        else if (isExtraType(type)) updateObj.extraPaid = -amt;
        else updateObj.amountPaid = -amt;
    }

    if (gstAmt !== 0) {
        updateObj.gstPaid = -gstAmt;
    }

    if (Object.keys(updateObj).length > 0) {
        await StudentModel.findByIdAndUpdate(studentId, {$inc: updateObj}, {new: true});
    }
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
            description,
            status,
            createdBy,
            isGst,
            gstRate,
            gstNumber,
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
        const statusNormalized = String(status || "").toUpperCase();

        if (student && isTuitionType(feeType)) {
            const check = await studentIsFullyPaid(student);
            if (!check.exists) {
                return sendError(res, 400, "Student not found.");
            }
            if (statusNormalized === PAYMENT_STATUS.PAID) {
                if (check.fullyPaid) {
                    return sendError(res, 400, "Student has already fully paid tuition — cannot add TUITIONFEES.");
                }
                const remaining = check.totalFee - check.alreadyPaid;
                if (numericAmount > remaining) {
                    return sendError(res, 400, `Payment exceeds remaining tuition balance. Remaining: ${remaining}`);
                }
            }
        }

        const {gstAmount, totalWithGst, gstRate: gstRateNormalized} = computeGst(numericAmount, !!isGst, gstRate);

        const receiptNumber = await generateReceiptNumber(companyId, branch);

        const newFee = await FeesModel.create({
            student,
            company: companyId,
            branch,
            feeType,
            amount: numericAmount,
            isGst: !!isGst,
            gstRate: gstRateNormalized,
            gstNumber: gstNumber || "",
            gstAmount,
            totalWithGst,
            paymentDate,
            paymentMode,
            receiptNumber,
            description,
            status: statusNormalized,
            attachment: attachmentUrl,
            createdBy,
        });

        if (student && (numericAmount !== 0 || gstAmount !== 0) && statusNormalized === PAYMENT_STATUS.PAID) {
            await incStudentCounter(student, feeType, numericAmount, gstAmount);
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Fee record created successfully with unique receipt number.",
            data: newFee,
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
            .populate("student", "firstName lastName contact")
            .populate("createdBy", "userName email")
            .populate("branch", "name");

        return res.status(200).json({
            status: 200,
            success: true,
            data: fees,
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
            data: fee,
        });
    } catch (err) {
        console.error("Error fetching fee:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch fee.");
    }
};

// UPDATE FEE (adjust student's amountPaid / extraPaid / gstPaid accordingly)
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

        if (req.file) {
            const buffer = req.file.buffer;
            updateData.attachment = await uploadFile(buffer);
        }

        const oldAmount = toNumber(fee.amount);
        const oldGstAmount = toNumber(fee.gstAmount);
        const oldStudentId = fee.student ? String(fee.student) : null;
        const oldType = fee.feeType;
        const oldStatus = String(fee.status || "").toUpperCase();

        const newAmount = updateData.amount !== undefined ? toNumber(updateData.amount) : oldAmount;
        const newStudentId = updateData.student !== undefined ? String(updateData.student) : oldStudentId;
        const newType = updateData.feeType !== undefined ? updateData.feeType : oldType;
        const newStatus = updateData.status !== undefined ? String(updateData.status).toUpperCase() : oldStatus;

        const newIsGst = updateData.isGst !== undefined ? !!updateData.isGst : !!fee.isGst;
        const newGstRateRaw = updateData.gstRate !== undefined ? updateData.gstRate : fee.gstRate;
        const newGstNumber = updateData.gstNumber !== undefined ? updateData.gstNumber : fee.gstNumber;

        const {gstAmount: newGstAmount, totalWithGst: newTotalWithGst, gstRate: gstRateNormalized} =
            computeGst(newAmount, newIsGst, newGstRateRaw);

        if (newStudentId && isTuitionType(newType) && newStatus === PAYMENT_STATUS.PAID) {
            const check = await studentIsFullyPaid(newStudentId);
            if (!check.exists) {
                return sendError(res, 400, "Student not found.");
            }
            let hypotheticalPaid = check.alreadyPaid;

            if (oldStudentId === newStudentId && oldStatus === PAYMENT_STATUS.PAID && isTuitionType(oldType)) {
                hypotheticalPaid = hypotheticalPaid - oldAmount;
            }

            hypotheticalPaid = hypotheticalPaid + newAmount;

            if (hypotheticalPaid > check.totalFee) {
                return sendError(
                    res,
                    400,
                    `Update would exceed student's total tuition fee. Current paid (adjusted): ${hypotheticalPaid}, Total fee: ${check.totalFee}`
                );
            }
            if (check.fullyPaid && hypotheticalPaid > check.alreadyPaid) {
                return sendError(
                    res,
                    400,
                    "Student has already fully paid tuition — cannot convert/update to TUITIONFEES that add more payment."
                );
            }
        }

        const oldGst = oldGstAmount;
        const newGst = newGstAmount;

        if (oldStudentId && newStudentId && oldStudentId !== newStudentId) {
            if (oldStatus === PAYMENT_STATUS.PAID && oldAmount !== 0) {
                await decStudentCounter(oldStudentId, oldType, oldAmount, oldGst);
            }

            if (newStatus === PAYMENT_STATUS.PAID && newAmount !== 0) {
                await incStudentCounter(newStudentId, newType, newAmount, newGst);
            }
        } else {
            const studentToAdjust = newStudentId;

            if (studentToAdjust) {
                if (oldStatus !== PAYMENT_STATUS.PAID && newStatus === PAYMENT_STATUS.PAID) {
                    await incStudentCounter(studentToAdjust, newType, newAmount, newGst);
                } else if (oldStatus === PAYMENT_STATUS.PAID && newStatus !== PAYMENT_STATUS.PAID) {
                    await decStudentCounter(studentToAdjust, oldType, oldAmount, oldGst);
                } else if (oldStatus === PAYMENT_STATUS.PAID && newStatus === PAYMENT_STATUS.PAID) {
                    if (isTuitionType(oldType) && isTuitionType(newType)) {
                        const diff = newAmount - oldAmount;
                        const gstDiff = newGst - oldGst;
                        if (diff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {amountPaid: diff}}, {new: true});
                        }
                        if (gstDiff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {gstPaid: gstDiff}}, {new: true});
                        }
                    } else if (isExtraType(oldType) && isExtraType(newType)) {
                        const diff = newAmount - oldAmount;
                        const gstDiff = newGst - oldGst;
                        if (diff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {extraPaid: diff}}, {new: true});
                        }
                        if (gstDiff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {gstPaid: gstDiff}}, {new: true});
                        }
                    } else if (isTuitionType(oldType) && isExtraType(newType)) {
                        if (oldAmount !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {amountPaid: -oldAmount}}, {new: true});
                        }
                        if (newAmount !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {extraPaid: newAmount}}, {new: true});
                        }
                        const gstDiff = newGst - oldGst;
                        if (gstDiff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {gstPaid: gstDiff}}, {new: true});
                        }
                    } else if (isExtraType(oldType) && isTuitionType(newType)) {
                        if (oldAmount !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {extraPaid: -oldAmount}}, {new: true});
                        }
                        if (newAmount !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {amountPaid: newAmount}}, {new: true});
                        }
                        const gstDiff = newGst - oldGst;
                        if (gstDiff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {gstPaid: gstDiff}}, {new: true});
                        }
                    } else {
                        const diff = newAmount - oldAmount;
                        const gstDiff = newGst - oldGst;
                        if (diff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {amountPaid: diff}}, {new: true});
                        }
                        if (gstDiff !== 0) {
                            await StudentModel.findByIdAndUpdate(studentToAdjust, {$inc: {gstPaid: gstDiff}}, {new: true});
                        }
                    }
                }
            }
        }

        if (updateData.amount !== undefined) updateData.amount = newAmount;
        if (updateData.status !== undefined) updateData.status = newStatus;

        updateData.isGst = newIsGst;
        updateData.gstRate = gstRateNormalized;
        updateData.gstNumber = newGstNumber || "";
        updateData.gstAmount = newGstAmount;
        updateData.totalWithGst = newTotalWithGst;

        const updatedFee = await FeesModel.findByIdAndUpdate(feeId, updateData, {new: true});

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fee record updated successfully and student's counters adjusted.",
            data: updatedFee,
        });
    } catch (err) {
        console.error("Error updating fee:", err);
        return sendError(res, 500, "Internal server error. Failed to update fee.");
    }
};

// DELETE FEE (Soft Delete) - reverse student's counters only if the fee was PAID
const deleteFee = async (req, res) => {
    try {
        const {companyId, feeId} = req.params;
        const deletedBy = req.body?.deletedBy;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const fee = await FeesModel.findOne({
            _id: feeId,
            company: companyId,
            deletedAt: null,
        });

        if (!fee) {
            return sendError(res, 404, "Fee record not found or already deleted.");
        }

        const feeAmount = toNumber(fee.amount);
        const feeGstAmount = toNumber(fee.gstAmount);
        const studentId = fee.student ? String(fee.student) : null;
        const feeType = fee.feeType;
        const feeStatus = String(fee.status || "").toUpperCase();

        const deleted = await FeesModel.findOneAndUpdate(
            {_id: feeId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Fee record not found or already deleted.");
        }

        if (studentId && (feeAmount !== 0 || feeGstAmount !== 0) && feeStatus === PAYMENT_STATUS.PAID) {
            await decStudentCounter(studentId, feeType, feeAmount, feeGstAmount);
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Fee record deleted successfully and student's counters reversed if applicable.",
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
