const mongoose = require("mongoose");
const UserModel = require("../models/user");
const CompanyModel = require("../models/company");
const ConfigModel = require("../models/config");

const {signLoginToken, signRefreshToken} = require("../helpers/jwt");
const {createHash, verifyHash} = require("../helpers/hash");
const generateUniqueUsername = require("../helpers/generateUsername");

// Set JWT tokens and store in user
const setTokens = async (userId) => {
    const tokens = {
        jwt: signLoginToken(userId),
        jwtRefresh: signRefreshToken(userId),
    };
    await UserModel.findByIdAndUpdate(userId, {otherInfo: tokens});
    return tokens;
};

// Register Controller
const register = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            firstName,
            lastName,
            email,
            contact,
            password,
            companyName,
            role,
        } = req.body;

        if (
            !firstName ||
            !lastName ||
            !contact ||
            !password ||
            !companyName ||
            !role
        ) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be provided.",
            });
        }

        const existingCompany = await CompanyModel.findOne({
            name: companyName,
            deletedAt: null,
        });

        if (existingCompany) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({
                success: false,
                message: "Company already exists.",
            });
        }

        const finalUsername = await generateUniqueUsername(
            companyName,
            firstName,
            lastName
        );

        const company = await CompanyModel.create([{name: companyName}], {
            session,
        });

        const hashedPassword = await createHash(password);

        const user = await UserModel.create(
            [
                {
                    firstName,
                    lastName,
                    email,
                    contact,
                    password: hashedPassword,
                    role,
                    userName: finalUsername,
                    company: company[0]._id,
                    otherInfo: {},
                },
            ],
            {session}
        );

        await ConfigModel.create(
            [
                {
                    company: company[0]._id,
                    incomeType: ["FEES"],
                    expenseType: ["RENT"],
                },
            ],
            {session}
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json({
            success: true,
            message: "Registration successful.",
            data: {
                userId: user[0]._id,
                userName: finalUsername,
                companyId: company[0]._id,
            },
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Register error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during registration.",
        });
    }
};

// Login Controller
const login = async (req, res) => {
    try {
        const {userName, password} = req.body;

        if (!userName || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required.",
            });
        }

        const user = await UserModel.findOne({userName});
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const isValidPassword = await verifyHash(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password.",
            });
        }

        const tokens = await setTokens(user._id);
        const userData = await UserModel.findById(user._id)
            .select("-password")
            .lean();

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            data: {
                ...userData,
                tokens,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during login.",
        });
    }
};

// Reset Password Controller
const resetPassword = async (req, res) => {
    try {
        const {userName, oldPassword, newPassword} = req.body;

        if (!userName || !oldPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            });
        }

        const user = await UserModel.findOne({userName});
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const isMatch = await verifyHash(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Old password is incorrect.",
            });
        }

        user.password = await createHash(newPassword);
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during password reset.",
        });
    }
};

// Get Logged-in User (Me)
const getUser = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access.",
            });
        }

        const user = await UserModel.findById(userId)
            .select("-password")
            .populate("branch")
            .populate("company");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User data retrieved successfully.",
            data: user,
        });
    } catch (error) {
        console.error("Get user error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

module.exports = {
    register,
    login,
    resetPassword,
    getUser,
};
