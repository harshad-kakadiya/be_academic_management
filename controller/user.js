const UserModel = require("../models/user");
const {validateCompany} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");
const {createHash} = require("../helpers/hash");

// Manual field validation function
const validateUserInput = (body, isUpdate = false) => {
    const requiredFields = [
        "firstName",
        "lastName",
        "userName",
        "email",
        "contact",
        "password",
        "role",
    ];
    for (const field of requiredFields) {
        if (!isUpdate && !body[field]) {
            return `${field} is required`;
        }
    }
    return null;
};

// CREATE USER
const createUser = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            firstName,
            lastName,
            userName,
            email,
            contact,
            password,
            role,
            subRole,
            branch,
            otherInfo
        } = req.body;

        const validationError = validateUserInput(req.body);
        if (validationError) {
            return res.status(400).json({
                status: 400,
                success: false,
                message: validationError
            });
        }

        const existingUser = await UserModel.findOne({
            $or: [{userName}, {email}],
            company: companyId
        });

        if (existingUser) {
            return res.status(409).json({
                status: 409,
                success: false,
                message: "Username or Email already exists"
            });
        }

        let userImage = null;
        if (req.file) {
            userImage = await uploadFile(req.file.buffer);
        }

        const hashedPassword = await createHash(password);

        const newUser = await UserModel.create({
            firstName,
            lastName,
            userName,
            email,
            contact,
            password: hashedPassword,
            role,
            subRole,
            company: companyId,
            branch,
            userImage,
            otherInfo
        });

        const responseUser = newUser.toObject();
        delete responseUser.password;

        return res.status(201).json({
            status: 201,
            success: true,
            message: "User created successfully",
            data: responseUser
        });
    } catch (err) {
        console.error("Error creating user:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to create user."
        });
    }
};

// GET ALL USERS
const getAllUsers = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const users = await UserModel.find({company: companyId, deletedAt: null})
            .populate("branch", "name")
            .select("-password");

        return res.status(200).json({
            status: 200,
            success: true,
            data: users
        });
    } catch (err) {
        console.error("Error getting users:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to get users."
        });
    }
};

// GET SINGLE USER
const getSingleUser = async (req, res) => {
    try {
        const {companyId, userId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const user = await UserModel.findOne({_id: userId, company: companyId, deletedAt: null})
            .populate("branch", "name")
            .select("-password");

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: user
        });
    } catch (err) {
        console.error("Error getting user:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to get user."
        });
    }
};

// UPDATE USER
const updateUser = async (req, res) => {
    try {
        const {companyId, userId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const updateData = {...req.body};

        if (req.file) {
            updateData.userImage = await uploadFile(req.file.buffer);
        }

        if (updateData.password) {
            updateData.password = await createHash(updateData.password);
        }

        const updatedUser = await UserModel.findOneAndUpdate(
            {_id: userId, company: companyId, deletedAt: null},
            updateData,
            {new: true}
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (err) {
        console.error("Error updating user:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to update user."
        });
    }
};

// DELETE USER (Soft Delete)
const deleteUser = async (req, res) => {
    try {
        const {companyId, userId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const user = await UserModel.findOneAndUpdate(
            {_id: userId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!user) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "User not found or already deleted"
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "User deleted successfully"
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to delete user."
        });
    }
};

module.exports = {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser
};
