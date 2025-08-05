require('dotenv').config();
const express = require('express');
const connectionDB = require('./configs/connection');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const appRouter = require('./routes/index');
const requestLogger = require("./middlewares/requestLogger");

const app = express();
const PORT = process.env.PORT || 8080;

connectionDB();

app.use(cors());

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(helmet());

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(requestLogger);

app.get("/", (req, res) => {
    res.send("✅ Server is running");
});
app.use('/api', appRouter);

app.use((req, res) => {
    res.status(404).json({
        status: 404,
        message: "❌ Route does not exist"
    });
});

app.use((err, req, res, next) => {
    console.error("❌ Global Error:", err.stack);
    res.status(err.status || 500).json({
        status: err.status || 500,
        message: err.message || 'Internal Server Error',
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
