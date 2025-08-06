const CompanyModel = require("../models/company");
const {uploadFile} = require("../services/uploadfile");

// CREATE COMPANY
const createCompany = async (req, res) => {
    try {
        const {name, website, isSubscription, slogan, date} = req.body;

        let companyLogo = null;
        if (req.file) {
            const buffer = req.file.buffer;
            companyLogo = await uploadFile(buffer);
        }

        const company = await CompanyModel.create({
            name,
            website,
            isSubscription,
            date,
            slogan,
            companyLogo,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Company created successfully",
            data: company,
        });
    } catch (err) {
        console.error("Error creating company:", err.message);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to create company.",
        });
    }
};

// GET ALL COMPANIES
const getAllCompanies = async (req, res) => {
    try {
        const companies = await CompanyModel.find({deletedAt: null});

        return res.status(200).json({
            status: 200,
            success: true,
            data: companies,
        });
    } catch (err) {
        console.error("Error fetching companies:", err.message);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to fetch companies.",
        });
    }
};

// GET SINGLE COMPANY
const getSingleCompany = async (req, res) => {
    try {
        const {companyId} = req.params;

        const company = await CompanyModel.findOne({_id: companyId, deletedAt: null});
        if (!company) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Company not found",
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: company,
        });
    } catch (err) {
        console.error("Error fetching company:", err.message);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to fetch company.",
        });
    }
};

// UPDATE COMPANY
const updateCompany = async (req, res) => {
    try {
        const {companyId} = req.params;
        const updateData = {...req.body};

        if (req.file) {
            const buffer = req.file.buffer;
            updateData.companyLogo = await uploadFile(buffer);
        }

        const updated = await CompanyModel.findOneAndUpdate(
            {_id: companyId, deletedAt: null},
            updateData,
            {new: true}
        );

        if (!updated) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Company not found",
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Company updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error("Error updating company:", err.message);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to update company.",
        });
    }
};

// DELETE COMPANY (SOFT DELETE)
const deleteCompany = async (req, res) => {
    try {
        const {companyId} = req.params;

        const deleted = await CompanyModel.findOneAndUpdate(
            {_id: companyId, deletedAt: null},
            {deletedAt: new Date()},
            {new: true}
        );

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Company not found or already deleted",
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Company deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting company:", err.message);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error. Failed to delete company.",
        });
    }
};

module.exports = {
    createCompany,
    getAllCompanies,
    getSingleCompany,
    updateCompany,
    deleteCompany,
};
