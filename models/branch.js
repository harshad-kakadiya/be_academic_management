const mongoose = require('mongoose');
const {addressSchema} = require("./common/address");

const branchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        branchCode: {
            type: String,
            required: true,
            unique: true,
        },
        contact: {
            type: String,
        },
        email: {
            type: String,
        },
        address: addressSchema,
        date: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        branchImage: {
            type: String,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
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

module.exports = mongoose.model('Branch', branchSchema);
