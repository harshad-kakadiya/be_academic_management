const mongoose = require('mongoose');

const configSchema = new mongoose.Schema(
    {
        company: {
            type: String,
            ref: 'Company',
            required: true,
        },
        expenseType: {
            type: Array,
            default: [],
        },
        incomeType: {
            type: Array,
            default: [],
        },
        permissions: {type: Object, default: {}},
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Config', configSchema);
