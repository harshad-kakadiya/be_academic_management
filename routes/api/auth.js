const express = require("express");
const {
    register,
    login,
    resetPassword,
    getUser, sendResetOTP, verifyOTPAndSetPassword,
} = require("../../controller/auth");
const auth = require("../../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", auth, resetPassword);

router.get("/me", auth, getUser);
router.post("/send-reset-otp", sendResetOTP);
router.post("/verify-reset-otp", verifyOTPAndSetPassword);

module.exports = router;
