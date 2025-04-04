const { Op } = require('sequelize'); // Import Sequelize operators
const db = require('../models');
const Appointment = db.Appointment;
const AvailabilityRule = db.AvailabilityRule;
const BlockOutTime = db.BlockOutTime;
const User = db.User; // Needed for association checks if required

// Helper function to calculate slot end time (could be moved to a service)
const calculateEndTime = (startTime, durationMinutes) => {
    const endTime = new Date(startTime.getTime());
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    return endTime;
};

// Helper function to get a default slot duration (replace with dynamic logic if needed)
const getDefaultSlotDuration = async () => {
    // For simplicity, find the first active rule and use its duration.
    // A more robust system might have a global setting or require it per request.
    const rule = await AvailabilityRule.findOne({ where: { is_active: true }});
    // Ensure rule exists and has a valid duration before returning
    return (rule && rule.slot_duration_minutes) ? rule.slot_duration_minutes : 30; // Default to 30 if no rules/duration found
}

// GET /api/appointments/available?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
exports.getAvailableSlots = async (req, res, next) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'startDate and endDate query parameters are required.' });
    }

    try {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0); // Use UTC to avoid timezone shifts when comparing date part only
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999); // Use UTC

        console.log(`Requested Range (UTC): Start=${start.toISOString()}, End=${end.toISOString()}`); // Log requested range

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
             return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD.' });
        }

        // 1. Get all relevant availability rules
        const rules = await AvailabilityRule.findAll({ where: { is_active: true } });
        if (rules.length === 0) {
             console.log("No active availability rules found."); // Log if no rules
             return res.json([]); // No availability rules defined
        }

        // A more robust way to get duration - maybe use the rule applicable to the specific day later
        // For now, stick to the simple approach but log it clearly
        const firstRuleDuration = rules[0]?.slot_duration_minutes; // Use optional chaining
        const slotDurationMinutes = firstRuleDuration > 0 ? firstRuleDuration : 30; // Ensure positive duration
        console.log("Using Slot Duration (minutes):", slotDurationMinutes); // Log used duration


        // 2. Get existing appointments in the range
        const existingAppointments = await Appointment.findAll({
            where: {
                start_time: { // Assuming start_time is stored in UTC or comparable timezone
                    [Op.between]: [start, end]
                },
                status: { // Only consider active appointments as blocking slots
                   [Op.notIn]: ['cancelled_by_customer', 'cancelled_by_admin']
                }
            },
            attributes: ['start_time', 'end_time'] // Only need times
        });

        // 3. Get block-out times in the range
        const blockOuts = await BlockOutTime.findAll({
            where: {
                 // Find blocks that *overlap* with the requested range (UTC comparison)
                 [Op.or]: [
                    { // Block starts within the range
                        start_time: { [Op.between]: [start, end] }
                    },
                    { // Block ends within the range
                        end_time: { [Op.between]: [start, end] }
                    },
                    { // Block surrounds the range
                       [Op.and]: [
                           { start_time: { [Op.lte]: start } },
                           { end_time: { [Op.gte]: end } }
                       ]
                    }
                 ]
            },
             attributes: ['start_time', 'end_time']
        });

        // --- Logging fetched data ---
        console.log("Fetched Rules:", rules.length);
        console.log("Fetched Appointments:", existingAppointments.length, existingAppointments.map(a => new Date(a.start_time).toISOString())); // Log times too
        console.log("Fetched Blocks:", blockOuts.length, blockOuts.map(b => ({s: new Date(b.start_time).toISOString(), e: new Date(b.end_time).toISOString()}))); // Log block times

        // Convert existing bookings and blocks into a quick lookup set/map for performance
        const bookedSlots = new Set();
        existingAppointments.forEach(appt => {
            // Store start times as ISO strings for easy comparison (Ensure consistent timezone, ideally UTC)
            bookedSlots.add(new Date(appt.start_time).toISOString());
        });
        console.log("Booked Slots Set (ISO):", bookedSlots); // Log the set

        const blockedIntervals = blockOuts.map(block => ({
            start: new Date(block.start_time), // Keep as Date objects for comparison
            end: new Date(block.end_time)
        }));


        // 4. Generate potential slots based on rules and filter them
        const availableSlots = [];
        let currentDate = new Date(start); // Start with the UTC start date

        while (currentDate <= end) {
            // Get day of week based on UTC date to match rules consistently
            const dayOfWeek = currentDate.getUTCDay(); // 0 = Sunday, 6 = Saturday (UTC)
            console.log(`\nProcessing Day: ${currentDate.toISOString().substring(0, 10)}, DayOfWeek (UTC): ${dayOfWeek}`);

            const rulesForDay = rules.filter(rule => rule.day_of_week === dayOfWeek);
            console.log(` > Rules for this day: ${rulesForDay.length}`);

            for (const rule of rulesForDay) {
                // Use the duration from the specific rule for this day if available
                const currentRuleDuration = rule.slot_duration_minutes > 0 ? rule.slot_duration_minutes : slotDurationMinutes; // Fallback if rule duration invalid

                console.log(`  >> Applying Rule: Start=${rule.start_time}, End=${rule.end_time}, Duration=${currentRuleDuration}`);
                const [startHour, startMinute] = rule.start_time.split(':').map(Number);
                const [endHour, endMinute] = rule.end_time.split(':').map(Number);

                // Construct slot times based on the UTC date part but local time parts from rule
                // This requires careful handling. Let's try setting UTC hours/minutes.
                let slotTime = new Date(currentDate.toISOString()); // Clone current UTC date
                slotTime.setUTCHours(startHour, startMinute, 0, 0);

                let endTimeLimit = new Date(currentDate.toISOString()); // Clone current UTC date
                endTimeLimit.setUTCHours(endHour, endMinute, 0, 0);

                console.log(`     Rule Time Range (UTC): SlotStartBase=${slotTime.toISOString()}, EndLimit=${endTimeLimit.toISOString()}`);

                // Iterate through potential slots for this rule's time range
                while (slotTime < endTimeLimit) {
                    const potentialSlotEnd = calculateEndTime(slotTime, currentRuleDuration); // Use rule-specific duration
                    const slotISO = slotTime.toISOString(); // Get ISO string (UTC by default from Date)

                    // Ensure the potential slot doesn't *end* after the rule's end time limit
                    if (potentialSlotEnd > endTimeLimit) {
                        console.log(`      --- Slot End ${potentialSlotEnd.toISOString()} exceeds limit ${endTimeLimit.toISOString()}. Breaking inner loop.`);
                        break; // This slot goes beyond the allowed time
                    }

                    let isBooked = bookedSlots.has(slotISO);
                    let isBlocked = false; // Reset for each slot

                    // Check against block-out times (compare Date objects)
                     for (const block of blockedIntervals) {
                         // Overlap condition: (SlotStart < BlockEnd) and (SlotEnd > BlockStart)
                         if (slotTime < block.end && potentialSlotEnd > block.start) {
                             isBlocked = true;
                             break; // Found an overlapping block
                         }
                     }

                    // Check if slot is in the past (allow a small buffer like 5 mins)
                    // Compare against current time in UTC for consistency
                    const now = new Date(); // Current time
                    const bufferMinutes = 5;
                    const slotStartTimeWithBuffer = new Date(now.getTime() + bufferMinutes * 60000);
                    const isInPast = slotTime < slotStartTimeWithBuffer;

                    // --- Detailed Slot Check Logging ---
                    console.log(`      --- Checking Slot: ${slotISO} (End: ${potentialSlotEnd.toISOString()}) ---`);
                    console.log(`          Is Booked? ${isBooked}`);
                    console.log(`          Is Blocked? ${isBlocked}`);
                    console.log(`          Is In Past? ${isInPast} (Slot: ${slotTime.toISOString()}, BufferTime: ${slotStartTimeWithBuffer.toISOString()})`);
                    console.log(`          Ends within Limit? ${potentialSlotEnd <= endTimeLimit}`);


                    if (!isInPast && !isBooked && !isBlocked) { // potentialSlotEnd <= endTimeLimit check moved above
                         // Only add if not booked, not blocked out, and not in the past
                        console.log(`          >>>> Adding Slot: ${slotISO}`); // Log when adding
                        availableSlots.push(slotISO); // Add start time as ISO string
                    } else {
                        // Log reason for skipping
                        let reason = [];
                        if (isInPast) reason.push("In Past");
                        if (isBooked) reason.push("Booked");
                        if (isBlocked) reason.push("Blocked");
                        console.log(`          <<<< Skipping Slot: ${slotISO}. Reason(s): ${reason.join(', ')}`);
                    }

                    // Move to the next potential slot start time
                    slotTime = potentialSlotEnd;
                } // End while(slotTime < endTimeLimit)
            } // End for(rule of rulesForDay)

            // Move to the next day (UTC)
            currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        } // End while(currentDate <= end)

        console.log("\nFinal Available Slots Generated:", availableSlots); // Log final result before sending
        res.status(200).json(availableSlots); // Return array of available ISO date strings

    } catch (error) {
        console.error("Error fetching available slots:", error);
        next(error);
    }
};


// POST /api/appointments/book
exports.bookAppointment = async (req, res, next) => {
    const { startTime } = req.body; // Expecting ISO string like "2023-10-27T10:00:00.000Z"
    const customerId = req.user.id; // Assumes isAuthenticated middleware attached user

    if (!startTime) {
        return res.status(400).json({ message: 'startTime is required.' });
    }

    const requestedStartTime = new Date(startTime);
     if (isNaN(requestedStartTime.getTime())) {
         return res.status(400).json({ message: 'Invalid startTime format.' });
     }

    // Prevent booking in the past (compare with current time)
     const now = new Date();
     if (requestedStartTime < now) {
        console.log(`Booking attempt in past: Req=${requestedStartTime.toISOString()}, Now=${now.toISOString()}`);
        return res.status(400).json({ message: 'Cannot book appointments in the past.' });
     }

    try {
        // **Crucial: Re-verify availability at the time of booking**

        // Get duration dynamically based on rules for that specific time/day if possible
        // Simple approach: use default/first rule duration again
        const slotDurationMinutes = await getDefaultSlotDuration(); // Re-fetch or reuse logic
        const requestedEndTime = calculateEndTime(requestedStartTime, slotDurationMinutes);
        console.log(`Booking Request: User=${customerId}, Start=${requestedStartTime.toISOString()}, End=${requestedEndTime.toISOString()}, Duration=${slotDurationMinutes}`);

        // 1. Check for existing appointment at this exact time
        // Ensure timezone consistency in query (assume DB stores in UTC or comparable)
        const existingAppointment = await Appointment.findOne({
            where: {
                start_time: requestedStartTime,
                 status: { [Op.notIn]: ['cancelled_by_customer', 'cancelled_by_admin'] }
            }
        });

        if (existingAppointment) {
             console.log(`Booking Conflict: Existing appointment found for ${requestedStartTime.toISOString()}`);
            return res.status(409).json({ message: 'This time slot is no longer available.' }); // 409 Conflict
        }

        // 2. Check for overlapping block-out times
        const overlappingBlock = await BlockOutTime.findOne({
             where: {
                 // Check if the requested slot (start_time to end_time) overlaps any block
                 // Overlap: (BlockStart < ReqEnd) and (BlockEnd > ReqStart)
                 start_time: { [Op.lt]: requestedEndTime },
                 end_time: { [Op.gt]: requestedStartTime }
             }
         });

         if (overlappingBlock) {
             console.log(`Booking Conflict: Overlapping block-out time found for ${requestedStartTime.toISOString()}`);
             return res.status(409).json({ message: 'This time slot is blocked and no longer available.' });
         }

        // 3. Optional: Verify against availability rules again (more robust)
        //    (Skipping this complex check for brevity)

        // Create the appointment
        const newAppointment = await Appointment.create({
            customer_id: customerId,
            start_time: requestedStartTime, // Store as Date object, Sequelize handles DB format
            end_time: requestedEndTime,
            status: 'scheduled', // Initial status
            // notes: req.body.notes || null // Optional: Allow notes during booking
        });

        console.log(`Appointment successfully created: ID=${newAppointment.id}, Time=${newAppointment.start_time.toISOString()}`);
        // Respond with the created appointment details
        res.status(201).json(newAppointment);

    } catch (error) {
        console.error("Error booking appointment:", error);
        // Add more specific error handling if needed
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: "Validation Error", errors: error.errors.map(e => e.message) });
        }
        next(error); // Pass to generic error handler
    }
};


// GET /api/appointments/my
exports.getMyAppointments = async (req, res, next) => {
    const customerId = req.user.id;
     console.log(`Fetching appointments for customer ID: ${customerId}`); // Log request

    try {
        const appointments = await Appointment.findAll({
            where: { customer_id: customerId },
            order: [['start_time', 'ASC']], // Order by date, soonest first
            // include: [{ model: User, as: 'customer', attributes: ['name', 'email'] }] // Optional: include user details
        });
         console.log(`Found ${appointments.length} appointments for customer ID: ${customerId}`);
        res.status(200).json(appointments);
    } catch (error) {
        console.error(`Error fetching appointments for customer ${customerId}:`, error); // Log specific error
        next(error);
    }
};


// PUT /api/appointments/:id/cancel (Customer cancellation)
exports.cancelAppointment = async (req, res, next) => {
    const appointmentId = req.params.id;
    const customerId = req.user.id;
     console.log(`Attempting cancellation for appointment ID: ${appointmentId} by customer ID: ${customerId}`);

    try {
        const appointment = await Appointment.findByPk(appointmentId);

        if (!appointment) {
            console.log(`Cancellation failed: Appointment ${appointmentId} not found.`);
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Verify the logged-in user owns this appointment
        if (appointment.customer_id !== customerId) {
             console.log(`Cancellation forbidden: Customer ${customerId} does not own appointment ${appointmentId} (Owner: ${appointment.customer_id}).`);
            return res.status(403).json({ message: 'You are not authorized to cancel this appointment.' }); // Forbidden
        }

        // Optional: Prevent cancellation if appointment is too soon
        const now = new Date();
        const appointmentTime = new Date(appointment.start_time);
        const hoursBefore = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        const minCancellationHours = 24; // Example: Cannot cancel within 24 hours

        if (['completed', 'cancelled_by_admin', 'cancelled_by_customer'].includes(appointment.status)) {
              console.log(`Cancellation failed: Appointment ${appointmentId} status is '${appointment.status}'.`);
             return res.status(400).json({ message: 'This appointment cannot be cancelled.' });
        }

        // Uncomment to enable time limit check
        // if (hoursBefore < minCancellationHours) {
        //      console.log(`Cancellation failed: Appointment ${appointmentId} is within ${minCancellationHours} hours.`);
        //     return res.status(400).json({ message: `Appointments cannot be cancelled less than ${minCancellationHours} hours in advance.` });
        // }


        // Update the status
        appointment.status = 'cancelled_by_customer';
        await appointment.save();

         console.log(`Appointment ${appointmentId} cancelled successfully by customer ${customerId}.`);
        res.status(200).json({ message: 'Appointment successfully cancelled.', appointment });

    } catch (error) {
        console.error(`Error cancelling appointment ${appointmentId}:`, error);
        next(error);
    }
};
