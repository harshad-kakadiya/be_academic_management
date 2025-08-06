const express = require("express");
const router = express.Router();
const {
    createCompany,
    getAllCompanies,
    getSingleCompany,
    updateCompany,
    deleteCompany,
} = require("../../controller/company");

const upload = require("../../middlewares/upload");

router.post("/", upload.single("companyLogo"), createCompany);
router.get("/", getAllCompanies);
router.get("/:companyId", getSingleCompany);
router.put("/:companyId", upload.single("companyLogo"), updateCompany);
router.delete("/:companyId", deleteCompany);

module.exports = router;
