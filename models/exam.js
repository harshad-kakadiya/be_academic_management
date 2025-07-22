const mongoose = require('mongoose');
const {EXAM_TYPE} = require("../constant");

const studentResultSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    obtainedMarks: {
        type: Number,
        default: null,
    },
});

const examSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        examType: {
            type: String,
            enum: Object.values(EXAM_TYPE),
            default: EXAM_TYPE.OTHER,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        totalMarks: {
            type: Number,
            required: true,
        },
        students: [studentResultSchema],
        conductedBy: {
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

module.exports = mongoose.model('Exam', examSchema);
