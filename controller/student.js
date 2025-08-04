const mongoose = require('mongoose');
const StudentModel = require("../models/student");
const UserModel = require("../models/user");
const {validateCompany, validateBranch} = require("../helpers/validators");
const generateUniqueUsername = require("../helpers/generateUsername");
const {createHash} = require("../helpers/hash");
const {uploadFile} = require("../services/uploadfile");
const {ROLES} = require("../constant");
const generateEnrollmentNumber = require("../helpers/generateEnrollmentNumber");
const xlsx = require("xlsx");

const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE STUDENT
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
            amountPaid,
            branch,
            createdBy,
        } = req.body;

        const requiredFields = [
            {key: 'firstName', label: 'First name'},
            {key: 'lastName', label: 'Last name'},
            {key: 'contact', label: 'Contact'},
            {key: 'totalFee', label: 'Total fee'},
            {key: 'branch', label: 'Branch'},
            {key: 'createdBy', label: 'Created by'},
        ];

        for (const field of requiredFields) {
            if (!req.body[field.key]) {
                return sendError(res, 400, `${field.label} is required`);
            }
        }

        if (contact.length < 6) {
            return sendError(res, 400, "Contact number must be at least 6 digits long to use as password.");
        }

        const isValidBranch = await validateBranch(branch, companyId, res);
        if (!isValidBranch) return;

        const enrollmentNumber = await generateEnrollmentNumber(companyId, branch);
        const userName = await generateUniqueUsername(company.name, firstName, lastName);
        const hashedPassword = await createHash(contact);

        let studentImage = null;
        if (req.file) {
            const buffer = req.file.buffer;
            studentImage = await uploadFile(buffer);
        }

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
            userImage: studentImage,
            subRole: ROLES.STUDENT,
        });

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
            amountPaid,
            company: companyId,
            branch,
            createdBy,
            user: newUser._id,
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

// DELETE STUDENT (SOFT)
const deleteStudent = async (req, res) => {
    try {
        const {companyId, studentId} = req.params;
        const deletedBy = req.body.deletedBy;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!deletedBy) {
            return sendError(res, 400, 'deletedBy is required');
        }

        if (!mongoose.Types.ObjectId.isValid(deletedBy)) {
            return sendError(res, 400, 'deletedBy must be a valid user ID');
        }

        const deleted = await StudentModel.findOneAndUpdate(
            {_id: studentId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, 'Student not found or already deleted');
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: 'Student deleted successfully',
        });
    } catch (err) {
        console.error('Error deleting student:', err);
        return sendError(res, 500, 'Internal server error. Failed to delete student.');
    }
};

// BULK STUDENT UPLOAD
const bulkUploadStudents = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {createdBy, branch} = req.body;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!req.file) {
            return sendError(res, 400, "Excel file is required");
        }

        const workbook = xlsx.read(req.file.buffer, {type: "buffer"});
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        const successList = [];
        const errorList = [];

        for (const [index, row] of rows.entries()) {
            try {
                const {
                    firstName,
                    lastName,
                    contact,
                    email,
                    dob,
                    schoolName,
                    std,
                    medium,
                    lastExamPercentage,
                    joinDate,
                    guardianName,
                    guardianContact,
                    guardianRelation,
                    referenceName,
                    referenceContact,
                    referenceRelation,
                    totalFee,
                    discount,
                    amountPaid,
                    street,
                    landmark,
                    country,
                    state,
                    city,
                    zipcode,
                    area,
                } = row;

                const requiredFields = [
                    {key: 'firstName', label: 'First name'},
                    {key: 'lastName', label: 'Last name'},
                    {key: 'contact', label: 'Contact'},
                    {key: 'totalFee', label: 'Total fee'},
                ];

                const missingField = requiredFields.find(f => !row[f.key]);
                if (missingField) {
                    errorList.push({row: index + 2, error: `${missingField.label} is required`});
                    continue;
                }

                const userName = await generateUniqueUsername(company.name, firstName, lastName);
                const enrollmentNumber = await generateEnrollmentNumber(companyId, branch);
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

                const newStudent = await StudentModel.create({
                    enrollmentNumber,
                    firstName,
                    lastName,
                    userName: newUser.userName,
                    email,
                    contact,
                    dob: dob ? new Date(dob) : null,
                    schoolName,
                    std,
                    medium,
                    lastExamPercentage,
                    joinDate: joinDate ? new Date(joinDate) : null,
                    guardianInfo: guardianName
                        ? [{
                            name: guardianName,
                            contact: guardianContact,
                            relation: guardianRelation,
                        }]
                        : [],
                    reference: referenceName
                        ? {
                            name: referenceName,
                            contact: referenceContact,
                            relation: referenceRelation,
                        }
                        : {},
                    address: {
                        street: street || '',
                        landmark: landmark || '',
                        country: country || '',
                        state: state || '',
                        city: city || '',
                        zipcode: zipcode || '',
                        area: area || null,
                    },
                    totalFee,
                    discount: discount || 0,
                    amountPaid: amountPaid || 0,
                    company: companyId,
                    branch,
                    createdBy,
                    user: newUser._id,
                });

                successList.push({student: newStudent, user: newUser});

            } catch (err) {
                console.error(`Row ${index + 2} error:`, err);
                errorList.push({row: index + 2, error: err.message});
            }
        }

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Bulk upload completed",
            created: successList.length,
            failed: errorList.length,
            errors: errorList,
        });

    } catch (err) {
        console.error("Bulk upload error:", err);
        return sendError(res, 500, "Internal server error during bulk student upload");
    }
};

// ADD REMARK TO STUDENT
const addStudentRemark = async (req, res) => {
    try {
        const {companyId, studentId} = req.params;
        const {comment, addedBy} = req.body;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return sendError(res, 400, "Invalid student ID");
        }

        if (!comment || !addedBy) {
            return sendError(res, 400, "Both 'comment' and 'addedBy' are required");
        }

        if (!mongoose.Types.ObjectId.isValid(addedBy)) {
            return sendError(res, 400, "Invalid user ID in 'addedBy'");
        }

        const student = await StudentModel.findOneAndUpdate(
            {
                _id: studentId,
                company: companyId,
                deletedAt: null,
            },
            {
                $push: {
                    remarks: {
                        comment,
                        addedBy,
                        date: new Date(),
                    },
                },
            },
            {new: true}
        ).populate('remarks.addedBy', 'firstName lastName userName');

        if (!student) {
            return sendError(res, 404, "Student not found");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Remark added successfully",
            data: student,
        });
    } catch (err) {
        console.error("Error adding remark:", err);
        return sendError(res, 500, "Internal server error. Failed to add remark.");
    }
};

module.exports = {
    createStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    deleteStudent,
    bulkUploadStudents,
    addStudentRemark,
};
