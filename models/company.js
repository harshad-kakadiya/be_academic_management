const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        companyLogo: {
            type: String,
        },
        website: {
            type: String,
        },
        isSubscription: {
            type: Boolean,
            default: false,
        },
        date: {
            type: Date,
        },
        slogan: {
            type: String,
        },
        address: {type: String},
        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Company', companySchema);
