const express = require("express");
const router = express.Router();
const {
    createUser,
    getAllUsers,
    getSingleUser,
    updateUser,
    deleteUser
} = require("../../controller/user");

const upload = require("../../middlewares/upload");

router.post("/:companyId/user", upload.single("userImage"), createUser);
router.get("/:companyId/user", getAllUsers);
router.get("/:companyId/user/:userId", getSingleUser);
router.put("/:companyId/user/:userId", upload.single("userImage"), updateUser);
router.delete("/:companyId/user/:userId", deleteUser);

module.exports = router;
