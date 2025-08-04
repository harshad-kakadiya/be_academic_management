const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createBatch,
    getAllBatches,
    getSingleBatch,
    updateBatch,
    deleteBatch,
    addStudentToBatch,
} = require("../controller/batch");


router.post("/:companyId/batch", createBatch);
router.get("/:companyId/batch", getAllBatches);
router.get("/:companyId/batch/:batchId", getSingleBatch);
router.put("/:companyId/batch/:batchId", updateBatch);
router.delete("/:companyId/batch/:batchId", deleteBatch);
router.put("/:companyId/batch/:batchId/add-student", addStudentToBatch);

module.exports = router;
