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
            required: true,
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
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
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

module.exports = mongoose.model('Complain', complainSchema);
