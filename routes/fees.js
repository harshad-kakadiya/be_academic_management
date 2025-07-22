const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createFee,
    getAllFees,
    getSingleFee,
    updateFee,
    deleteFee,
} = require("../controller/fees");

router.post("/:companyId/fee", createFee);
router.get("/:companyId/fee", getAllFees);
router.get("/:companyId/fee/:feeId", getSingleFee);
router.put("/:companyId/fee/:feeId", updateFee);
router.delete("/:companyId/fee/:feeId", deleteFee);

module.exports = router;
