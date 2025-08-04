const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            ref: 'Company',
            required: true,
        },
        employeeRoles: {
            type: Array,
            default: [],
        },
        permission: {
            type: Array,
            default: [],
        },
        area: {
            type: Array,
            default: [],
        },
        standard: {
            type: Array,
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Config', configSchema);
