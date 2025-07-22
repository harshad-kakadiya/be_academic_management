const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createEvent,
    getAllEvents,
    getSingleEvent,
    updateEvent,
    deleteEvent,
} = require("../controller/calendar");

router.post("/:companyId/event", createEvent);
router.get("/:companyId/event", getAllEvents);
router.get("/:companyId/event/:eventId", getSingleEvent);
router.put("/:companyId/event/:eventId", updateEvent);
router.delete("/:companyId/event/:eventId", deleteEvent);

module.exports = router;
