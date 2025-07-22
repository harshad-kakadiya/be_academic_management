const mongoose = require('mongoose');
const {PAYMENT_STATUS, PAYMENT_MODE, FEETYPE} = require("../constant");

const feesSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
        },
        feeType: {
            type: String,
            enum: Object.values(FEETYPE),
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        paymentDate: {
            type: Date,
            required: true,
        },
        paymentMode: {
            type: String,
            enum: Object.values(PAYMENT_MODE),
            default: PAYMENT_MODE.CASH,
        },
        receiptNumber: {
            type: String,
            unique: true,
        },
        description: {
            type: String,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.PAID,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Fees', feesSchema);
