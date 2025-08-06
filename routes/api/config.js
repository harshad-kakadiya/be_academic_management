const express = require("express");
const router = express.Router();

const {
    updateConfig,
    getConfigs
} = require("../../controller/config");

router.get("/:companyId/config", getConfigs);
router.put("/:companyId/config/:id", updateConfig);

module.exports = router;
