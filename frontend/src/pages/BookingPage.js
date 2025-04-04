import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // for selectable
import listPlugin from '@fullcalendar/list'; // Optional: for list view
import axiosInstance from '../api/axiosInstance'; // Use your configured axios
import { useAuth } from '../contexts/AuthContext'; // To check if logged in

// --- Basic Modal Component (Replace with a proper library like Material UI, Chakra UI, or React Modal if preferred) ---
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h2>{title}</h2>
                <button onClick={onClose} style={styles.closeButton}>×</button>
                {children}
            </div>
        </div>
    );
};
// --- End Basic Modal ---

function BookingPage() {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null); // Store { start, end } of selected slot
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [bookingStatus, setBookingStatus] = useState({ message: '', type: '' }); // For success/error after booking attempt
    const { isAuthenticated } = useAuth(); // Ensure user is logged in
    const calendarRef = useRef(null); // Ref to access calendar API

    // Fetch available slots when the component mounts or visible dates change
    const fetchAvailableSlots = async (fetchInfo) => {
        setLoading(true);
        setError('');
        setBookingStatus({ message: '', type: '' }); // Clear previous booking status

        // Format dates for API query (use start/end from FullCalendar's view)
        const startDate = fetchInfo.startStr.substring(0, 10); // Get YYYY-MM-DD
        const endDate = fetchInfo.endStr.substring(0, 10); // Get YYYY-MM-DD (might need adjustment for end date inclusivity depending on backend)

        // Adjust end date for query if needed (e.g., backend expects end date exclusive)
        // const queryEndDate = new Date(fetchInfo.end);
        // queryEndDate.setDate(queryEndDate.getDate() - 1); // Example: subtract one day
        // const endDate = queryEndDate.toISOString().substring(0, 10);


        console.log(`Fetching slots for: ${startDate} to ${endDate}`);

        try {
            const response = await axiosInstance.get('/appointments/available', {
                params: { startDate, endDate }
            });
            // Convert ISO strings back to Date objects or keep as strings for FullCalendar events
            setAvailableSlots(response.data); // Assuming backend returns an array of ISO strings
            console.log("Fetched slots:", response.data.length);
        } catch (err) {
            console.error("Error fetching slots:", err);
            setError('Failed to load available slots. Please try again later.');
            setAvailableSlots([]); // Clear slots on error
        } finally {
            setLoading(false);
        }
    };

    // Function to handle clicking on a background event (available slot)
    const handleSlotClick = (clickInfo) => {
        // clickInfo.event is the clicked event object
        console.log("Slot clicked:", clickInfo.event);
        setSelectedSlot({
            start: clickInfo.event.start, // Date object
            end: clickInfo.event.end,     // Date object
            startStr: clickInfo.event.startStr // ISO String
        });
        setIsModalOpen(true); // Open confirmation modal
        setBookingStatus({ message: '', type: '' }); // Clear previous status
    };

    // Function to confirm and book the selected slot
    const handleBookingConfirm = async () => {
        if (!selectedSlot || !selectedSlot.startStr) {
            setBookingStatus({ message: 'No slot selected.', type: 'error' });
            return;
        }
        setLoading(true);
        setBookingStatus({ message: 'Booking...', type: 'info' });

        try {
            const response = await axiosInstance.post('/appointments/book', {
                startTime: selectedSlot.startStr // Send the ISO string
            });
            console.log("Booking successful:", response.data);
            setBookingStatus({ message: 'Appointment booked successfully!', type: 'success' });
            setIsModalOpen(false);
            setSelectedSlot(null);
            // Refresh calendar events/slots after successful booking
            if (calendarRef.current) {
                calendarRef.current.getApi().refetchEvents(); // Refetches events (our available slots)
            }
            // TODO: Optionally add the newly booked appointment to the calendar visually
        } catch (err) {
            console.error("Booking failed:", err);
            const message = err.response?.data?.message || 'Failed to book appointment. The slot might have been taken.';
            setBookingStatus({ message, type: 'error' });
            // Keep modal open on error to show message
        } finally {
            setLoading(false);
        }
    };

    // Convert available ISO strings to FullCalendar Event Objects
    const calendarEvents = availableSlots.map(slotISO => ({
        start: slotISO,
        // end: calculateEndTime(new Date(slotISO), 30).toISOString(), // Calculate end if needed, requires duration
        display: 'background', // Display as background event
        color: '#8fdf82', // Light green background for available slots
        // You can add more properties if needed
    }));


    if (!isAuthenticated) {
        return <p>Please log in to book an appointment.</p>;
    }

    return (
        <div>
            <h2>Book Appointment</h2>
            <p>Select an available time slot on the calendar below.</p>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {loading && <p>Loading available slots...</p>}

             <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView="timeGridWeek" // Show week view with time slots
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                }}
                slotMinTime="08:00:00" // Optional: Set earliest time shown
                slotMaxTime="19:00:00" // Optional: Set latest time shown
                slotDuration="00:30:00" // Optional: Visual slot duration lines (adjust if dynamic)
                // slotLabelInterval={{ minutes: 30 }} // Optional: Label frequency
                selectable={false} // We are using background events for selection
                selectMirror={true}
                nowIndicator={true} // Show current time indicator
                // --- Fetching data ---
                events={calendarEvents} // Display available slots as background events
                datesSet={fetchAvailableSlots} // Called when view/date range changes
                // --- Clicking on available slots ---
                eventClick={handleSlotClick} // Use eventClick for background events
                eventBackgroundColor="#8fdf82"
                eventBorderColor="#8fdf82"
             />

            {/* --- Booking Confirmation Modal --- */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Booking">
                {selectedSlot ? (
                    <div>
                        <p>Book appointment for:</p>
                        <p><strong>{selectedSlot.start.toLocaleString()}</strong></p>
                        {bookingStatus.message && (
                            <p style={{ color: bookingStatus.type === 'error' ? 'red' : 'green' }}>
                                {bookingStatus.message}
                            </p>
                        )}
                        <button onClick={handleBookingConfirm} disabled={loading || bookingStatus.type === 'success'}>
                            {loading ? 'Booking...' : 'Confirm Booking'}
                        </button>
                        <button onClick={() => setIsModalOpen(false)} disabled={loading} style={{ marginLeft: '10px' }}>
                            Cancel
                        </button>
                    </div>
                ) : (
                    <p>No slot selected.</p>
                )}
            </Modal>
        </div>
    );
}

// Basic Styles for Modal (add to your CSS or use a library)
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '5px',
        position: 'relative',
        minWidth: '300px',
        maxWidth: '500px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
    },
    closeButton: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        fontSize: '1.5rem',
        cursor: 'pointer',
    },
};


export default BookingPage;
