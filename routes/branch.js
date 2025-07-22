const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createBranch,
    getAllBranches,
    getSingleBranch,
    updateBranch,
    deleteBranch
} = require("../controller/branch");

const upload = require("../middlewares/upload");

router.post("/:companyId/branch", upload.single("branchImage"), createBranch);
router.get("/:companyId/branch", getAllBranches);
router.get("/:companyId/branch/:branchId", getSingleBranch);
router.put("/:companyId/branch/:branchId", upload.single("branchImage"), updateBranch);
router.delete("/:companyId/branch/:branchId", deleteBranch);

module.exports = router;
