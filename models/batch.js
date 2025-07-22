const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        batchTime: {
            type: String,
            required: true,
        },
        students: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
        }],
        isActive: {
            type: Boolean,
            default: true,
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
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Batch', batchSchema);
