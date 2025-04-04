const { Op } = require('sequelize');
const db = require('../models'); // Access models via index
const Appointment = db.Appointment;
const User = db.User;
const AvailabilityRule = db.AvailabilityRule;
const BlockOutTime = db.BlockOutTime; // Assuming you created this model

// --- Appointment Management ---

// GET /api/admin/appointments - Get all appointments with filters
exports.getAllAppointments = async (req, res, next) => {
    const { status, startDate, endDate, customerId } = req.query;
    let whereClause = {};

    // Build filter conditions
    if (status) {
        whereClause.status = status;
    }
    if (customerId) {
         whereClause.customer_id = customerId;
    }
    if (startDate && endDate) {
        try {
            const start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                whereClause.start_time = { [Op.between]: [start, end] };
            } else {
                 console.warn("Invalid date format received for appointment filtering.");
            }
        } catch (dateError) {
             console.warn("Error parsing date for appointment filtering:", dateError);
        }
    }

    console.log("Admin fetching appointments with filter:", whereClause);

    try {
        const appointments = await Appointment.findAll({
            where: whereClause,
            include: [{ // Include customer details
                model: User,
                as: 'customer', // Make sure this alias matches your association definition in model
                attributes: ['id', 'name', 'email'] // Select specific user fields
            }],
            order: [['start_time', 'DESC']] // Show most recent first, or ASC for chronological
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error("Admin error fetching appointments:", error);
        next(error);
    }
};

// PUT /api/admin/appointments/:id/status - Update appointment status
exports.updateAppointmentStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    // Basic validation for allowed statuses (customize as needed)
    const allowedStatuses = ['scheduled', 'confirmed', 'completed', 'paid', 'cancelled_by_admin', 'cancelled_by_customer']; // Add more if needed
    if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status provided. Allowed statuses: ${allowedStatuses.join(', ')}` });
    }

    console.log(`Admin updating appointment ${id} status to: ${status}`);

    try {
        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        appointment.status = status;
        await appointment.save();

        // Optionally include associated user data in the response
        const updatedAppointment = await Appointment.findByPk(id, {
             include: [{ model: User, as: 'customer', attributes: ['id', 'name', 'email'] }]
        });

        res.status(200).json(updatedAppointment);
    } catch (error) {
        console.error(`Admin error updating status for appointment ${id}:`, error);
        next(error);
    }
};

// --- Availability Rule Management ---

// GET /api/admin/availability-rules
exports.getAvailabilityRules = async (req, res, next) => {
     console.log("Admin fetching availability rules.");
    try {
        const rules = await AvailabilityRule.findAll({ order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]});
        res.status(200).json(rules);
    } catch (error) {
         console.error("Admin error fetching availability rules:", error);
        next(error);
    }
};

// POST /api/admin/availability-rules
exports.createAvailabilityRule = async (req, res, next) => {
    const { day_of_week, start_time, end_time, slot_duration_minutes, is_active = true } = req.body;

    // Basic validation (add more specific time/day validation if needed)
    if (day_of_week === undefined || !start_time || !end_time || !slot_duration_minutes) {
        return res.status(400).json({ message: 'Missing required fields: day_of_week, start_time, end_time, slot_duration_minutes' });
    }
     console.log("Admin creating availability rule:", req.body);

    try {
        const newRule = await AvailabilityRule.create({
            day_of_week,
            start_time,
            end_time,
            slot_duration_minutes,
            is_active
        });
        res.status(201).json(newRule);
    } catch (error) {
         console.error("Admin error creating availability rule:", error);
        // Handle potential validation errors (e.g., invalid time format)
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};

// PUT /api/admin/availability-rules/:id
exports.updateAvailabilityRule = async (req, res, next) => {
    const { id } = req.params;
    // Get only the fields allowed to be updated from the body
    const { day_of_week, start_time, end_time, slot_duration_minutes, is_active } = req.body;
    const updateData = { day_of_week, start_time, end_time, slot_duration_minutes, is_active };

    // Remove undefined fields so they don't overwrite existing values unintentionally
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (Object.keys(updateData).length === 0) {
         return res.status(400).json({ message: 'No update fields provided.' });
    }
    console.log(`Admin updating availability rule ${id} with:`, updateData);

    try {
        const rule = await AvailabilityRule.findByPk(id);
        if (!rule) {
            return res.status(404).json({ message: 'Availability rule not found.' });
        }

        const updatedRule = await rule.update(updateData);
        res.status(200).json(updatedRule);
    } catch (error) {
         console.error(`Admin error updating availability rule ${id}:`, error);
         if (error.name === 'SequelizeValidationError') {
             return res.status(400).json({ message: "Validation Error", errors: error.errors.map(e => e.message) });
         }
        next(error);
    }
};

// DELETE /api/admin/availability-rules/:id
exports.deleteAvailabilityRule = async (req, res, next) => {
    const { id } = req.params;
    console.log(`Admin deleting availability rule ${id}`);

    try {
        const rule = await AvailabilityRule.findByPk(id);
        if (!rule) {
            return res.status(404).json({ message: 'Availability rule not found.' });
        }

        await rule.destroy();
        res.status(204).send(); // 204 No Content on successful deletion

    } catch (error) {
         console.error(`Admin error deleting availability rule ${id}:`, error);
        next(error);
    }
};


// --- Block Out Time Management ---

// GET /api/admin/block-out-times
exports.getBlockOutTimes = async (req, res, next) => {
    console.log("Admin fetching block-out times.");
    // Optional: Add date range filters if needed via req.query
    try {
        const blocks = await BlockOutTime.findAll({ order: [['start_time', 'ASC']] });
        res.status(200).json(blocks);
    } catch (error) {
        console.error("Admin error fetching block-out times:", error);
        next(error);
    }
};
// POST /api/admin/block-out-times
exports.createBlockOutTime = async (req, res, next) => {
    const { start_time, end_time, reason } = req.body;

    // Basic validation
    if (!start_time || !end_time) {
        return res.status(400).json({ message: 'Missing required fields: start_time, end_time' });
    }
    const startTime = new Date(start_time);
    const endTime = new Date(end_time);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return res.status(400).json({ message: 'Invalid date format for start_time or end_time.' });
    }
    if (endTime <= startTime) {
        return res.status(400).json({ message: 'End time must be after start time.' });
    }

    console.log("Admin creating block-out time:", req.body);

    try {
        const newBlock = await BlockOutTime.create({
            start_time: startTime, // Store as Date object
            end_time: endTime,   // Store as Date object
            reason: reason || null // Optional reason
        });
        res.status(201).json(newBlock);
    } catch (error) {
        console.error("Admin error creating block-out time:", error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};

// PUT /api/admin/block-out-times/:id (Optional - often simpler to delete & re-add)
exports.updateBlockOutTime = async (req, res, next) => {
    const { id } = req.params;
    const { start_time, end_time, reason } = req.body;
    const updateData = { start_time, end_time, reason };

    // Basic validation
     if (!start_time && !end_time && !reason) {
         return res.status(400).json({ message: 'No update fields provided.' });
     }
     let startTime, endTime;
     if (start_time) {
        startTime = new Date(start_time);
        if(isNaN(startTime.getTime())) return res.status(400).json({ message: 'Invalid start_time format.' });
        updateData.start_time = startTime;
     }
      if (end_time) {
        endTime = new Date(end_time);
        if(isNaN(endTime.getTime())) return res.status(400).json({ message: 'Invalid end_time format.' });
        updateData.end_time = endTime;
     }
     // Validate end > start if both are provided
     const currentStartTime = startTime || (await BlockOutTime.findByPk(id))?.start_time;
     const currentEndTime = endTime || (await BlockOutTime.findByPk(id))?.end_time;
     if (currentStartTime && currentEndTime && currentEndTime <= currentStartTime) {
         return res.status(400).json({ message: 'End time must be after start time.' });
     }


    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    console.log(`Admin updating block-out time ${id} with:`, updateData);


    try {
        const block = await BlockOutTime.findByPk(id);
        if (!block) {
            return res.status(404).json({ message: 'Block-out time not found.' });
        }

        const updatedBlock = await block.update(updateData);
        res.status(200).json(updatedBlock);
    } catch (error) {
        console.error(`Admin error updating block-out time ${id}:`, error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        next(error);
    }
};


// DELETE /api/admin/block-out-times/:id
exports.deleteBlockOutTime = async (req, res, next) => {
    const { id } = req.params;
    console.log(`Admin deleting block-out time ${id}`);

    try {
        const block = await BlockOutTime.findByPk(id);
        if (!block) {
            return res.status(404).json({ message: 'Block-out time not found.' });
        }

        await block.destroy();
        res.status(204).send(); // Success, no content

    } catch (error) {
        console.error(`Admin error deleting block-out time ${id}:`, error);
        next(error);
    }
};
