const EmployeeModel = require("../models/employee");
const UserModel = require("../models/user");
const {validateCompany, validateBranch} = require("../helpers/validators");
const {uploadFile} = require("../services/uploadfile");
const {createHash} = require("../helpers/hash");
const generateUniqueUsername = require("../helpers/generateUsername");
const {ROLES} = require("../constant");

// Unified error response helper
const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE EMPLOYEE (with user)
const createEmployee = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            firstName, lastName, email, contact,
            education, salary, joinDate, subjects,
            timeAvailable, guardianInfo, address,
            branch, password, createdBy,
        } = req.body;

        if (!password || password.length < 6) {
            return sendError(res, 400, "Password must be at least 6 characters long.");
        }

        // Optional branch validation
        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const userName = await generateUniqueUsername(company.name, firstName, lastName);
        const hashedPassword = await createHash(password);

        const newUser = await UserModel.create({
            firstName,
            lastName,
            userName,
            email,
            contact,
            password: hashedPassword,
            role: ROLES.EMPLOYEE,
            company: companyId,
            branch,
        });

        let employeeImage = null;
        if (req.file) {
            const buffer = req.file.buffer;
            employeeImage = await uploadFile(buffer);
        }

        const newEmployee = await EmployeeModel.create({
            firstName,
            lastName,
            email,
            contact,
            education,
            salary,
            joinDate,
            subjects,
            timeAvailable,
            guardianInfo,
            address,
            employeeImage,
            user: newUser._id,
            company: companyId,
            branch,
            createdBy,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Employee and user created successfully.",
            data: {user: newUser, employee: newEmployee},
        });
    } catch (err) {
        console.error("Error creating employee:", err);
        return sendError(res, 500, "Internal server error. Failed to create employee.");
    }
};

// GET ALL EMPLOYEES
const getAllEmployees = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {branch} = req.query;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const query = {
            company: companyId,
            deletedAt: null,
        };

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
            query.branch = branch;
        }

        const employees = await EmployeeModel.find(query)
            .populate("user", "userName email")
            .populate("branch", "name");

        return res.status(200).json({
            status: 200,
            success: true,
            data: employees,
        });
    } catch (err) {
        console.error("Error fetching employees:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch employees.");
    }
};

// GET SINGLE EMPLOYEE
const getSingleEmployee = async (req, res) => {
    try {
        const {companyId, employeeId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const employee = await EmployeeModel.findOne({
            _id: employeeId,
            company: companyId,
            deletedAt: null,
        })
            .populate("user", "userName email")
            .populate("branch", "name");

        if (!employee) {
            return sendError(res, 404, "Employee not found.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: employee,
        });
    } catch (err) {
        console.error("Error fetching employee:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch employee.");
    }
};

// UPDATE EMPLOYEE
const updateEmployee = async (req, res) => {
    try {
        const {companyId, employeeId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const employee = await EmployeeModel.findOne({
            _id: employeeId,
            company: companyId,
            deletedAt: null,
        });
        if (!employee) {
            return sendError(res, 404, "Employee not found.");
        }

        const updateData = {...req.body};

        if (updateData.branch) {
            const isValidBranch = await validateBranch(updateData.branch, companyId, res);
            if (!isValidBranch) return;
        }

        let uploadedImageUrl = null;
        if (req.file) {
            const buffer = req.file.buffer;
            uploadedImageUrl = await uploadFile(buffer);
            updateData.employeeImage = uploadedImageUrl;
        }

        const updatedEmployee = await EmployeeModel.findByIdAndUpdate(employeeId, updateData, {
            new: true,
        });

        const userUpdateData = {};
        if (updateData.firstName) userUpdateData.firstName = updateData.firstName;
        if (updateData.lastName) userUpdateData.lastName = updateData.lastName;
        if (updateData.email) userUpdateData.email = updateData.email;
        if (updateData.contact) userUpdateData.contact = updateData.contact;
        if (updateData.branch) userUpdateData.branch = updateData.branch;
        if (uploadedImageUrl) userUpdateData.userImage = uploadedImageUrl;

        await UserModel.findByIdAndUpdate(employee.user, userUpdateData);

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Employee and user updated successfully.",
            data: updatedEmployee,
        });
    } catch (err) {
        console.error("Error updating employee:", err);
        return sendError(res, 500, "Internal server error. Failed to update employee.");
    }
};

// SOFT DELETE EMPLOYEE
const deleteEmployee = async (req, res) => {
    try {
        const {companyId, employeeId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await EmployeeModel.findOneAndUpdate(
            {_id: employeeId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Employee not found or already deleted.");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Employee deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting employee:", err);
        return sendError(res, 500, "Internal server error. Failed to delete employee.");
    }
};

module.exports = {
    createEmployee,
    getAllEmployees,
    getSingleEmployee,
    updateEmployee,
    deleteEmployee,
};
