const ConfigModel = require("../models/config");
const {validateCompany} = require("../helpers/validators");

// GET configs by company ID
async function getConfigs(req, res) {
    try {
        const {companyId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const configs = await ConfigModel.find({company: companyId}).populate("company");

        if (!configs.length) {
            return res.status(404).json({
                status: 404,
                success: false,
                message: "No configurations found for this company",
            });
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: configs,
        });
    } catch (err) {
        console.error("Error fetching configs:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error",
        });
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
            return res.status(404).json({
                status: 404,
                success: false,
                message: "Configuration not found for this company",
            });
        }

        const updatedConfig = await ConfigModel.findByIdAndUpdate(
            id,
            updates,
            {new: true}
        ).populate("company");

        return res.status(200).json({
            status: 200,
            success: true,
            data: updatedConfig,
            message: "Config updated successfully",
        });
    } catch (err) {
        console.error("Error updating config:", err);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal server error",
        });
    }
}

module.exports = {
    getConfigs,
    updateConfig,
};
