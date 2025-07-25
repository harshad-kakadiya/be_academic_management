const StudentModel = require("../models/student");
const UserModel = require("../models/user");
const {validateCompany, validateBranch} = require("../helpers/validators");
const generateUniqueUsername = require("../helpers/generateUsername");
const {createHash} = require("../helpers/hash");
const {uploadFile} = require("../services/uploadfile");
const {ROLES} = require("../constant");

// Unified error response helper
const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE STUDENT (with user)
const createStudent = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            firstName,
            lastName,
            email,
            contact,
            dob,
            schoolName,
            std,
            medium,
            lastExamPercentage,
            joinDate,
            guardianInfo,
            address,
            reference,
            totalFee,
            discount,
            branch,
            createdBy,
        } = req.body;

        if (!contact || contact.length < 6) {
            return sendError(res, 400, "Contact number must be at least 6 digits long to use as password.");
        }

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const enrollmentNumber = await generateEnrollmentNumber(companyId, branch);
        const userName = await generateUniqueUsername(company.name, firstName, lastName);
        const hashedPassword = await createHash(contact);

        const newUser = await UserModel.create({
            firstName,
            lastName,
            userName,
            email,
            contact,
            password: hashedPassword,
            role: ROLES.STUDENT,
            company: companyId,
            branch,
        });

        let studentImage = null;
        if (req.file) {
            const buffer = req.file.buffer;
            studentImage = await uploadFile(buffer);
        }

        const newStudent = await StudentModel.create({
            enrollmentNumber,
            firstName,
            lastName,
            userName: newUser.userName,
            email,
            contact,
            dob,
            schoolName,
            std,
            medium,
            lastExamPercentage,
            joinDate,
            guardianInfo,
            address,
            reference,
            studentImage,
            totalFee,
            discount,
            company: companyId,
            branch,
            createdBy,
        });

        if (studentImage) {
            await UserModel.findByIdAndUpdate(newUser._id, {
                profileImage: studentImage,
            });
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Student and user created successfully",
            data: {
                user: newUser,
                student: newStudent,
            },
        });
    } catch (err) {
        console.error("Error creating student:", err);
        return sendError(res, 500, "Internal server error. Failed to create student.");
    }
};

// GET ALL STUDENTS
const getAllStudents = async (req, res) => {
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

        const students = await StudentModel.find(query).populate("branch", "name");

        return res.status(200).json({
            status: 200,
            success: true,
            data: students,
        });
    } catch (err) {
        console.error("Error fetching students:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch students.");
    }
};

// GET SINGLE STUDENT
const getSingleStudent = async (req, res) => {
    try {
        const {companyId, studentId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const student = await StudentModel.findOne({
            _id: studentId,
            company: companyId,
            deletedAt: null,
        }).populate("branch", "name");

        if (!student) {
            return sendError(res, 404, "Student not found");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: student,
        });
    } catch (err) {
        console.error("Error fetching student:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch student.");
    }
};

// UPDATE STUDENT
const updateStudent = async (req, res) => {
    try {
        const {companyId, studentId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const student = await StudentModel.findOne({
            _id: studentId,
            company: companyId,
            deletedAt: null,
        });

        if (!student) {
            return sendError(res, 404, "Student not found");
        }

        const updateData = {...req.body};

        if ("enrollmentNumber" in updateData) {
            delete updateData.enrollmentNumber;
        }

        if (updateData.branch) {
            const isValidBranch = await validateBranch(updateData.branch, companyId, res);
            if (!isValidBranch) return;
        }

        let uploadedImage = null;
        if (req.file) {
            const buffer = req.file.buffer;
            uploadedImage = await uploadFile(buffer);
            updateData.studentImage = uploadedImage;
        }

        const updatedStudent = await StudentModel.findByIdAndUpdate(studentId, updateData, {
            new: true,
        });

        const user = await UserModel.findOne({
            userName: student.userName,
            role: ROLES.STUDENT,
            company: companyId,
        });

        if (user) {
            const userUpdate = {};
            if (updateData.firstName) userUpdate.firstName = updateData.firstName;
            if (updateData.lastName) userUpdate.lastName = updateData.lastName;
            if (updateData.email) userUpdate.email = updateData.email;
            if (updateData.contact) userUpdate.contact = updateData.contact;
            if (updateData.branch) userUpdate.branch = updateData.branch;
            if (uploadedImage) userUpdate.userImage = uploadedImage;

            await UserModel.findByIdAndUpdate(user._id, userUpdate, {new: true});
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Student and linked user updated successfully",
            data: updatedStudent,
        });
    } catch (err) {
        console.error("Error updating student:", err);
        return sendError(res, 500, "Internal server error. Failed to update student.");
    }
};

// DELETE (SOFT DELETE) STUDENT
const deleteStudent = async (req, res) => {
    try {
        const {companyId, studentId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await StudentModel.findOneAndUpdate(
            {_id: studentId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Student not found or already deleted");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Student deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting student:", err);
        return sendError(res, 500, "Internal server error. Failed to delete student.");
    }
};

module.exports = {
    createStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    deleteStudent,
};
