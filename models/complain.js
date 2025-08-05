const mongoose = require('mongoose');
const {COMPLAIN_TYPES, COMPLAIN_STATUS} = require("../constant");

const complainSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        complainType: {
            type: String,
            enum: Object.values(COMPLAIN_TYPES),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(COMPLAIN_STATUS),
            default: COMPLAIN_STATUS.OPEN,
        },
        attachment: {
            type: String,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
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

module.exports = mongoose.model('Complain', complainSchema);
