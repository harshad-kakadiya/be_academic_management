const mongoose = require("mongoose");
const {LEAVE_STATUS, EVENT_TYPES} = require("../constant");

const eventSchema = new mongoose.Schema(
    {
        event: {
            type: String,
            required: true,
        },
        event_type: {
            type: String,
            enum: Object.values(EVENT_TYPES),
        },
        from: {
            type: Date,
            required: true,
        },
        to: {
            type: Date,
            required: true,
        },
        description: {
            type: String,
        },
        reason: {
            type: String,
            default: null,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            default: null,
        },
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            default: null,
        },
        leave_status: {
            type: String,
            enum: Object.values(LEAVE_STATUS),
        },
        company: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Company",
            required: true,
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        deletedAt: {
            type: Date,
            default: null,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Event", eventSchema);
