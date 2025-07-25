const StudentModel = require('../models/student');
const BranchModel = require('../models/branch');

const generateEnrollmentNumber = async (companyId, branchId) => {
    const yearSuffix = new Date().getFullYear().toString().slice(-2);

    const branch = await BranchModel.findOne({_id: branchId, company: companyId});
    if (!branch || !branch.branchCode) {
        throw new Error("Branch code not found");
    }

    const branchCode = branch.branchCode.toUpperCase();

    const count = await StudentModel.countDocuments({
        company: companyId,
        branch: branchId,
    });

    const serial = (count + 1).toString().padStart(4, '0');

    return `${yearSuffix}-${branchCode}-${serial}`;
};

module.exports = generateEnrollmentNumber;
