const mongoose = require('mongoose');
const {ASSIGNMENT_STATUS} = require("../constant");

const studentAssignmentSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(ASSIGNMENT_STATUS),
        default: ASSIGNMENT_STATUS.NOT_COMPLETED,
    },
    submissionDate: {
        type: Date,
        default: null,
    },
    remarks: {
        type: String,
        default: '',
    },
    attachment: {
        type: String,
        default: null,
    },
});

const assignmentSchema = new mongoose.Schema(
    {
        dueDate: {
            type: Date,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        students: [studentAssignmentSchema],
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
            required: true,
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
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
        otherInfo: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
