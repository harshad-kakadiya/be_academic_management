const express = require("express");
const {
    register,
    login,
    resetPassword,
    getUser,
} = require("../controller/auth");
const auth = require("../middlewares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/reset-password", auth, resetPassword);

router.get("/me", auth, getUser);

module.exports = router;
