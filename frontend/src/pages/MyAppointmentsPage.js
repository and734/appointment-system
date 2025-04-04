import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance'; // Use your configured axios
import { useAuth } from '../contexts/AuthContext'; // To ensure user is logged in

function MyAppointmentsPage() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelStatus, setCancelStatus] = useState({}); // To show status per appointment: { [apptId]: { message, type } }
    const { isAuthenticated } = useAuth();

    // Fetch user's appointments when the component mounts
    const fetchAppointments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axiosInstance.get('/appointments/my');
            // Sort appointments by start_time just in case backend didn't
            const sortedAppointments = response.data.sort((a, b) =>
                new Date(a.start_time) - new Date(b.start_time)
            );
            setAppointments(sortedAppointments);
            console.log("Fetched my appointments:", sortedAppointments);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(`Failed to load appointments: ${err.response?.data?.message || err.message}`);
            setAppointments([]); // Clear on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated) { // Only fetch if logged in
            fetchAppointments();
        } else {
            setLoading(false); // Not logged in, stop loading
            setAppointments([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]); // Re-fetch if auth status changes

    // Function to handle appointment cancellation
    const handleCancel = async (appointmentId) => {
        setCancelStatus(prev => ({
            ...prev,
            [appointmentId]: { message: 'Cancelling...', type: 'info' }
        }));

        // Optional: Add a confirmation dialog
        // if (!window.confirm("Are you sure you want to cancel this appointment?")) {
        //     setCancelStatus(prev => ({ ...prev, [appointmentId]: null })); // Clear status if user cancels confirmation
        //     return;
        // }

        try {
            const response = await axiosInstance.put(`/appointments/${appointmentId}/cancel`);
            console.log(`Cancellation successful for ${appointmentId}:`, response.data);
            setCancelStatus(prev => ({
                ...prev,
                [appointmentId]: { message: 'Cancelled!', type: 'success' }
            }));
            // Refresh the list of appointments to reflect the change in status
            fetchAppointments(); // Re-fetch all appointments to get updated list/status
        } catch (err) {
            console.error(`Error cancelling appointment ${appointmentId}:`, err);
            const message = err.response?.data?.message || 'Cancellation failed.';
            setCancelStatus(prev => ({
                ...prev,
                [appointmentId]: { message, type: 'error' }
            }));
        }
    };

    // Helper to check if an appointment can be cancelled by the customer
    const canCancel = (appointment) => {
        if (!appointment || !appointment.start_time || !appointment.status) {
            return false;
        }
        // Only allow cancellation for 'scheduled' or 'confirmed' appointments
        if (!['scheduled', 'confirmed'].includes(appointment.status)) {
            return false;
        }
        // Optional: Prevent cancellation if too close (e.g., within 24 hours)
        // const now = new Date();
        // const appointmentTime = new Date(appointment.start_time);
        // const hoursBefore = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        // const minCancellationHours = 24;
        // if (hoursBefore < minCancellationHours) {
        //     return false;
        // }
        return true; // Can cancel
    };


    if (loading) {
        return <div>Loading your appointments...</div>;
    }

    if (!isAuthenticated) {
         return <div>Please log in to view your appointments.</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div>
            <h2>My Appointments</h2>
            {appointments.length === 0 ? (
                <p>You have no appointments scheduled.</p>
            ) : (
                <ul style={styles.appointmentList}>
                    {appointments.map((appt) => (
                        <li key={appt.id} style={styles.appointmentItem(appt.status)}>
                            <div style={styles.appointmentDetails}>
                                <p><strong>Date:</strong> {new Date(appt.start_time).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {new Date(appt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p><strong>Status:</strong> <span style={styles.statusText(appt.status)}>{appt.status}</span></p>
                                {appt.notes && <p><strong>Notes:</strong> {appt.notes}</p>}
                            </div>
                            <div style={styles.appointmentActions}>
                                {canCancel(appt) && (
                                    <button
                                        onClick={() => handleCancel(appt.id)}
                                        disabled={!!cancelStatus[appt.id] && cancelStatus[appt.id]?.type !== 'error'} // Disable if cancelling or success
                                        style={styles.cancelButton}
                                    >
                                        {cancelStatus[appt.id]?.type === 'info' ? 'Cancelling...' : 'Cancel Appointment'}
                                    </button>
                                )}
                                {cancelStatus[appt.id] && (
                                     <p style={{ color: cancelStatus[appt.id].type === 'error' ? 'red' : 'green', fontSize: '0.9em', marginTop: '5px' }}>
                                         {cancelStatus[appt.id].message}
                                     </p>
                                 )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// Basic Styles (add to CSS or use a proper UI library)
const styles = {
    appointmentList: {
        listStyle: 'none',
        padding: 0,
    },
    appointmentItem: (status) => ({
        border: '1px solid #ccc',
        borderRadius: '5px',
        marginBottom: '15px',
        padding: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        opacity: status.includes('cancelled') || status === 'completed' ? 0.6 : 1, // Dim past/cancelled appointments
        backgroundColor: status.includes('cancelled') ? '#fdd' : '#fff', // Light red for cancelled
    }),
    appointmentDetails: {
        flexGrow: 1,
    },
    appointmentActions: {
        marginLeft: '20px',
        textAlign: 'right',
        minWidth: '150px', // Ensure space for button and message
    },
    cancelButton: {
        padding: '8px 12px',
        backgroundColor: '#dc3545',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
    },
    statusText: (status) => ({
        fontWeight: 'bold',
        textTransform: 'capitalize',
        color: status.includes('cancelled') ? '#dc3545' : (status === 'confirmed' || status === 'scheduled' ? 'green' : '#666'),
    }),
};


export default MyAppointmentsPage;
