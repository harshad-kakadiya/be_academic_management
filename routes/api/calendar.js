const express = require("express");
const router = express.Router({mergeParams: true});

const {
    createEvent,
    getAllEvents,
    getSingleEvent,
    updateEvent,
    deleteEvent,
} = require("../../controller/calendar");

router.post("/:companyId/calendar", createEvent);
router.get("/:companyId/calendar", getAllEvents);
router.get("/:companyId/calendar/:calendarId", getSingleEvent);
router.put("/:companyId/calendar/:calendarId", updateEvent);
router.delete("/:companyId/calendar/:calendarId", deleteEvent);

module.exports = router;
