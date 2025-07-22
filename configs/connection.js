const mongoose = require("mongoose");
require('dotenv').config();

const connectionDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
        console.log(`Successfully connected to: ${mongoose.connection.host}`);
    } catch (err) {
        console.error(`Database connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = connectionDB;