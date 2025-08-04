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
        permissions: {type: Object},
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
