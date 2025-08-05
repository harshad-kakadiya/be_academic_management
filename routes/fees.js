const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createFee,
    getAllFees,
    getSingleFee,
    updateFee,
    deleteFee,
} = require("../controller/fees");

const upload = require("../middlewares/upload");

router.post("/:companyId/fee", upload.single("attachment"), createFee);
router.get("/:companyId/fee", getAllFees);
router.get("/:companyId/fee/:feeId", getSingleFee);
router.put("/:companyId/fee/:feeId", upload.single("attachment"), updateFee);
router.delete("/:companyId/fee/:feeId", deleteFee);

module.exports = router;
