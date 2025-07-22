const _ = require("lodash");
const {TokenExpiredError} = require("jsonwebtoken");
const appJwt = require("../helpers/jwt");
const handleException = require("../decorators/error");
const UserModel = require("../models/user");

const auth = handleException(async function authenticate(req, res, next) {
    const {auth_jwt: accessToken, auth_jwt_refresh: refreshToken} = _.pick(req.headers, [
        "auth_jwt",
        "auth_jwt_refresh",
    ]);

    if (!accessToken || !refreshToken) {
        return res.status(401).json({
            message: "Unauthorized. Access and refresh tokens are required.",
            status: 401,
        });
    }

    try {
        const decoded = await appJwt.verifyToken(accessToken);
        const user = await UserModel.findById(decoded.id).lean();

        if (!user) {
            return res.status(404).json({message: "User not found", status: 404});
        }

        const storedToken = user.otherInfo?.jwt;
        if (!storedToken || storedToken !== accessToken) {
            return res.status(401).json({
                message: "Invalid auth token provided.",
                status: 401,
            });
        }

        req.user = {
            id: user._id,
            role: user.role,
            company: user.company,
            branch: user.branch,
        };

        next();
    } catch (err) {
        if (err instanceof TokenExpiredError) {
            return res.status(401).json({
                message: "Auth token expired, please refresh your token.",
                status: 401,
            });
        }

        console.error("Auth Middleware Error:", err);
        return res.status(500).json({
            message: "Something went wrong during authentication.",
            status: 500,
        });
    }
});

module.exports = auth;