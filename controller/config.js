const ConfigModel = require("../models/config");
const {validateCompany} = require("../helpers/validators");

// Standard response utility
const sendResponse = (res, status, success, message, data = null) => {
    return res.status(status).json({
        status,
        success,
        message,
        ...(data !== null && {data}),
    });
};

// GET configs by company ID
async function getConfigs(req, res) {
    try {
        const {companyId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const configs = await ConfigModel.find({company: companyId}).populate("company");

        if (!configs.length) {
            return sendResponse(res, 404, false, "No configurations found for this company");
        }

        return sendResponse(res, 200, true, "Configurations retrieved successfully", configs);
    } catch (err) {
        console.error("Error fetching configs:", err);
        return sendResponse(res, 500, false, "Internal server error");
    }
}

// UPDATE config by config ID (with company validation)
async function updateConfig(req, res) {
    try {
        const {companyId, id} = req.params;
        const updates = req.body;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const config = await ConfigModel.findOne({_id: id, company: companyId});
        if (!config) {
            return sendResponse(res, 404, false, "Configuration not found for this company");
        }

        const updatedConfig = await ConfigModel.findByIdAndUpdate(id, updates, {
            new: true,
        }).populate("company");

        return sendResponse(res, 200, true, "Configuration updated successfully", updatedConfig);
    } catch (err) {
        console.error("Error updating config:", err);
        return sendResponse(res, 500, false, "Internal server error");
    }
}

module.exports = {
    getConfigs,
    updateConfig,
};
