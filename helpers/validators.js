const mongoose = require('mongoose');
const CompanyModel = require('../models/company');
const BranchModel = require("../models/branch");

const validateCompany = async (companyId, res) => {
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
        res.status(400).json({
            status: 400,
            success: false,
            message: "Invalid or missing company ID",
        });
        return null;
    }

    const company = await CompanyModel.findById(companyId);
    if (!company) {
        res.status(404).json({
            status: 404,
            success: false,
            message: "Company not found",
        });
        return null;
    }
    return company;
};

const validateBranch = async (branchId, companyId, res) => {
    const branch = await BranchModel.findOne({_id: branchId, company: companyId});
    if (!branch) {
        res.status(404).json({
            status: 404,
            success: false,
            message: "Invalid or non-existent branch for this company.",
        });
        return null;
    }
    return branch;
};

module.exports = {validateCompany, validateBranch};
