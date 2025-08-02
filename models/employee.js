const mongoose = require('mongoose');
const {addressSchema} = require("./common/address");

const employeeSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        contact: {
            type: String,
            required: true,
        },
        education: {
            type: String,
        },
        salary: {
            type: Number,
        },
        joinDate: {
            type: Date,
        },
        subjects: {
            type: String,
        },
        timeAvailable: {
            type: String,
        },
        guardianInfo: [
            {
                name: {type: String, required: true},
                contact: {type: String, required: true},
                relation: {type: String},
            }
        ],
        address: addressSchema,
        employeeImage: {
            type: String,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subRole: {
            type: String,
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
        isActive: {
            type: Boolean,
            default: true,
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

module.exports = mongoose.model('Employee', employeeSchema);
