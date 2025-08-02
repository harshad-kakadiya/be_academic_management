const mongoose = require('mongoose');
const {addressSchema} = require("./common/address");

const studentSchema = new mongoose.Schema(
    {
        enrollmentNumber: {
            type: String,
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
        contact: {
            type: String,
            required: true,
        },
        email: {
            type: String,
        },
        studentImage: {
            type: String,
        },
        guardianInfo: [
            {
                name: {type: String},
                contact: {type: String},
                relation: {type: String},
            }
        ],
        schoolName: {
            type: String,
        },
        std: {
            type: String,
        },
        medium: {
            type: String,
        },
        lastExamPercentage: {
            type: Number,
        },
        dob: {
            type: Date,
        },
        joinDate: {
            type: Date,
        },
        address: addressSchema,
        reference: {
            name: {type: String},
            contact: {type: String},
            relation: {type: String},
        },
        totalFee: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            default: 0,
        },
        amountPaid: {
            type: Number,
            default: 0,
        },
        remarks: [
            {
                comment: {type: String},
                date: {type: Date, default: Date.now},
                addedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                },
            }
        ],
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
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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

module.exports = mongoose.model('Student', studentSchema);
