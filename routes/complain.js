const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createComplain,
    getAllComplains,
    getSingleComplain,
    updateComplain,
    deleteComplain,
} = require("../controller/complain");

const upload = require("../middlewares/upload");

router.post("/:companyId/complain", upload.single("attachment"), createComplain);
router.get("/:companyId/complain", getAllComplains);
router.get("/:companyId/complain/:complainId", getSingleComplain);
router.put("/:companyId/complain/:complainId", upload.single("attachment"), updateComplain);
router.delete("/:companyId/complain/:complainId", deleteComplain);

module.exports = router;
