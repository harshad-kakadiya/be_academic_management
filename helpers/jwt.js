const jwt = require("jsonwebtoken");

function sign(payload, secret, expiresIn) {
    return jwt.sign(payload, secret, {expiresIn});
}

function verify(token, secret) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) return reject(err);
            resolve(decoded);
        });
    });
}

const signLoginToken = (userId) =>
    sign({id: userId}, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);

const signRefreshToken = (userId) =>
    sign({id: userId}, process.env.JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN);

const verifyToken = (token) =>
    verify(token, process.env.JWT_SECRET);

const verifyRefreshToken = (token) =>
    verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
    signLoginToken,
    signRefreshToken,
    verifyToken,
    verifyRefreshToken,
};
