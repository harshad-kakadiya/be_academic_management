const EventModel = require("../models/calendar");
const {validateCompany, validateBranch} = require("../helpers/validators");

// Unified error response helper
const sendError = (res, status, message) => {
    return res.status(status).json({status, success: false, message});
};

// CREATE EVENT
const createEvent = async (req, res) => {
    try {
        const {companyId} = req.params;
        const company = await validateCompany(companyId, res);
        if (!company) return;

        const {
            event,
            event_type,
            from,
            to,
            description,
            reason,
            student,
            employee,
            leave_status,
            branch,
            createdBy,
            leave,
        } = req.body;

        if (!event || !from || !to) {
            return sendError(res, 400, "Event name, from, and to dates are required.");
        }

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const newEvent = await EventModel.create({
            event,
            event_type,
            from,
            to,
            description,
            reason,
            student,
            employee,
            leave_status,
            leave,
            company: companyId,
            branch,
            createdBy,
        });

        return res.status(201).json({
            status: 201,
            success: true,
            message: "Event created successfully",
            data: newEvent,
        });
    } catch (err) {
        console.error("Error creating event:", err);
        return sendError(res, 500, "Internal server error. Failed to create event.");
    }
};

// GET ALL EVENTS
const getAllEvents = async (req, res) => {
    try {
        const {companyId} = req.params;
        const {branch, event_type, from, to} = req.query;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const query = {
            company: companyId,
            deletedAt: null,
        };

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
            query.branch = branch;
        }

        if (event_type) query.event_type = event_type;
        if (from && to) {
            query.from = {$gte: new Date(from)};
            query.to = {$lte: new Date(to)};
        }

        const events = await EventModel.find(query)
            .populate("branch", "name")
            .populate("student", "firstName lastName userName")
            .populate("employee", "firstName lastName userName");

        return res.status(200).json({
            status: 200,
            success: true,
            data: events,
        });
    } catch (err) {
        console.error("Error fetching events:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch events.");
    }
};

// GET SINGLE EVENT
const getSingleEvent = async (req, res) => {
    try {
        const {companyId, calendarId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const event = await EventModel.findOne({
            _id: calendarId,
            company: companyId,
            deletedAt: null,
        })
            .populate("branch", "name")
            .populate("student", "firstName lastName userName")
            .populate("employee", "firstName lastName userName");

        if (!event) {
            return sendError(res, 404, "Event not found");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: event,
        });
    } catch (err) {
        console.error("Error fetching event:", err);
        return sendError(res, 500, "Internal server error. Failed to fetch event.");
    }
};

// UPDATE EVENT
const updateEvent = async (req, res) => {
    try {
        const {companyId, calendarId} = req.params;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const existing = await EventModel.findOne({
            _id: calendarId,
            company: companyId,
            deletedAt: null,
        });

        if (!existing) {
            return sendError(res, 404, "Event not found");
        }

        const {branch} = req.body;

        if (branch) {
            const isValidBranch = await validateBranch(branch, companyId, res);
            if (!isValidBranch) return;
        }

        const updated = await EventModel.findByIdAndUpdate(calendarId, req.body, {new: true});

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Event updated successfully",
            data: updated,
        });
    } catch (err) {
        console.error("Error updating event:", err);
        return sendError(res, 500, "Internal server error. Failed to update event.");
    }
};

// DELETE EVENT (soft delete)
const deleteEvent = async (req, res) => {
    try {
        const {companyId, calendarId} = req.params;
        const deletedBy = req.user?._id;

        const company = await validateCompany(companyId, res);
        if (!company) return;

        const deleted = await EventModel.findOneAndUpdate(
            {_id: calendarId, company: companyId, deletedAt: null},
            {deletedAt: new Date(), deletedBy},
            {new: true}
        );

        if (!deleted) {
            return sendError(res, 404, "Event not found or already deleted");
        }

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Event deleted successfully",
        });
    } catch (err) {
        console.error("Error deleting event:", err);
        return sendError(res, 500, "Internal server error. Failed to delete event.");
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getSingleEvent,
    updateEvent,
    deleteEvent,
};
