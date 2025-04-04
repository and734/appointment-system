import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService'; // Service file
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboardPage.css'; // Stylesheet

// Helper maps and initial states (keep existing)
const dayOfWeekMap = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
};

const initialRuleFormState = {
    id: null, // To track if editing
    day_of_week: '1', // Default to Monday
    start_time: '09:00', // Default start time HH:MM
    end_time: '17:00', // Default end time HH:MM
    slot_duration_minutes: '30', // Default duration
    is_active: true,
};

// --- Initial state for the block-out form ---
const initialBlockFormState = {
    id: null, // Track editing
    start_time: '', // YYYY-MM-DDTHH:MM format for datetime-local input
    end_time: '',   // YYYY-MM-DDTHH:MM format
    reason: '',
};

// Helper to format Date object to YYYY-MM-DDTHH:MM for datetime-local input
const formatDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    // Adjust for local timezone offset before formatting
    const offset = d.getTimezoneOffset() * 60000; // Offset in milliseconds
    const localDate = new Date(d.getTime() - offset);
    return localDate.toISOString().slice(0, 16); // Get YYYY-MM-DDTHH:MM
};

// Helper to convert local datetime-local string back to Date object (assumes input is local)
const parseDateTimeLocal = (localString) => {
    if (!localString) return null;
    // The input value is already local time, just create Date object
    // Be aware this might have timezone implications when sent to backend if backend expects UTC
    return new Date(localString);
};


function AdminDashboardPage() {
    // ... (keep existing state: appointments, availabilityRules, loading, error, user) ...
    const [ruleForm, setRuleForm] = useState(initialRuleFormState);
    const [isEditingRule, setIsEditingRule] = useState(false);
    const [formError, setFormError] = useState('');

    // --- State for Block-Out Times ---
    const [blockOutTimes, setBlockOutTimes] = useState([]);
    const [blockForm, setBlockForm] = useState(initialBlockFormState);
    const [isEditingBlock, setIsEditingBlock] = useState(false);
    const [blockFormError, setBlockFormError] = useState('');

    // --- Fetch Functions (keep existing fetchAppointments, fetchAvailabilityRules) ---
    const fetchAppointments = async () => { ... };
    const fetchAvailabilityRules = async () => { ... };

    // --- Fetch Block Out Times ---
    const fetchBlockOutTimes = async () => {
        setLoading(prev => ({ ...prev, blocks: true })); // Add loading state for blocks if needed
        setError(prev => ({ ...prev, blocks: '' })); // Add error state for blocks if needed
        try {
            const data = await adminService.getBlockOutTimes();
            setBlockOutTimes(data || []);
        } catch (err) {
            console.error("Error fetching block-out times for admin:", err);
            setError(prev => ({ ...prev, blocks: `Failed to load block-out times: ${err.response?.data?.message || err.message}` }));
            setBlockOutTimes([]);
        } finally {
            setLoading(prev => ({ ...prev, blocks: false }));
        }
    };

    // Initial data fetch
    useEffect(() => {
        fetchAppointments();
        fetchAvailabilityRules();
        fetchBlockOutTimes(); // Fetch block times too
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Handlers (keep existing handleStatusChange, handleDeleteRule, rule form handlers, etc.) ---
    const handleStatusChange = async (appointmentId, newStatus) => { ... };
    const handleDeleteRule = async (ruleId) => { ... };
    const handleRuleFormChange = (e) => { ... };
    const handleRuleSubmit = async (e) => { ... };
    const handleEditRuleClick = (rule) => { ... };
    const handleCancelEdit = () => { ... };

    // --- Block-Out Form Input Change ---
    const handleBlockFormChange = (e) => {
        const { name, value } = e.target;
        setBlockForm(prev => ({ ...prev, [name]: value }));
        if (blockFormError) setBlockFormError('');
    };

    // --- Handle Submit (Add or Update Block-Out) ---
    const handleBlockSubmit = async (e) => {
        e.preventDefault();
        setBlockFormError('');
        // Convert local input times to Date objects (or ISO strings if backend prefers)
        const dataToSend = {
            start_time: parseDateTimeLocal(blockForm.start_time),
            end_time: parseDateTimeLocal(blockForm.end_time),
            reason: blockForm.reason,
        };

         // Basic Frontend Validation
         if (!dataToSend.start_time || !dataToSend.end_time) {
             setBlockFormError("Start and End times are required.");
             return;
         }
         if (dataToSend.end_time <= dataToSend.start_time) {
             setBlockFormError("End time must be after start time.");
             return;
         }

        try {
            if (isEditingBlock && blockForm.id) {
                // Update Block
                console.log(`Submitting update for block ID: ${blockForm.id}`, dataToSend);
                await adminService.updateBlockOutTime(blockForm.id, dataToSend);
                alert('Block-out time updated successfully!');
            } else {
                // Add Block
                console.log("Submitting new block-out time:", dataToSend);
                await adminService.createBlockOutTime(dataToSend);
                alert('Block-out time added successfully!');
            }
            setBlockForm(initialBlockFormState); // Reset form
            setIsEditingBlock(false);
            fetchBlockOutTimes(); // Refresh list
        } catch (err) {
            console.error("Error submitting block-out form:", err);
            const message = err.response?.data?.message || (isEditingBlock ? 'Failed to update block-out time.' : 'Failed to add block-out time.');
            const validationErrors = err.response?.data?.errors?.join(', ');
            setBlockFormError(validationErrors ? `${message}: ${validationErrors}` : message);
        }
    };

    // --- Handle Edit Block Click ---
    const handleEditBlockClick = (block) => {
        console.log("Editing block:", block);
        setIsEditingBlock(true);
        setBlockFormError('');
        setBlockForm({
            id: block.id,
            // Format dates from backend (likely UTC ISO) to local format for input
            start_time: formatDateTimeLocal(block.start_time),
            end_time: formatDateTimeLocal(block.end_time),
            reason: block.reason || '',
        });
         document.getElementById('block-form-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    // --- Handle Cancel Block Edit ---
     const handleCancelBlockEdit = () => {
         setIsEditingBlock(false);
         setBlockForm(initialBlockFormState);
         setBlockFormError('');
     };

    // --- Handle Delete Block ---
    const handleDeleteBlock = async (blockId) => {
        if (!window.confirm(`Are you sure you want to delete block-out time ${blockId}? This cannot be undone.`)) {
            return;
        }
        console.log(`Attempting to delete block ${blockId}`);
        try {
            await adminService.deleteBlockOutTime(blockId);
            fetchBlockOutTimes(); // Refresh list
            alert(`Block-out time ${blockId} deleted successfully.`);
        } catch (err) {
            console.error(`Failed to delete block ${blockId}:`, err);
            alert(`Error deleting block-out time: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- Render Functions (keep existing renderAppointmentRow, renderRuleRow) ---
    const renderAppointmentRow = (appt) => { ... };
    const renderRuleRow = (rule) => { ... };

    // --- Render Block-Out Time Row ---
    const renderBlockRow = (block) => (
        <tr key={block.id}>
            <td>{new Date(block.start_time).toLocaleString()}</td>
            <td>{new Date(block.end_time).toLocaleString()}</td>
            <td>{block.reason || '-'}</td>
            <td>
                <button
                     onClick={() => handleEditBlockClick(block)}
                     className="button-edit"
                     style={{ marginRight: '5px' }}
                 >
                     Edit
                 </button>
                 <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="button-delete"
                >
                    Delete
                </button>
            </td>
        </tr>
    );


    // --- Main Return JSX ---
    return (
        <div className="admin-dashboard">
            <h2>Admin Dashboard</h2>
            <p>Welcome, {user?.name || 'Admin'}!</p>

            {/* Appointments Section */}
            <section className="dashboard-section">
                 {/* ... (existing appointments table code) ... */}
            </section>

            {/* Availability Rules Section */}
            <section className="dashboard-section" id="rule-form-section">
                 {/* ... (existing availability rules form and table code) ... */}
            </section>

             {/* --- Block Out Times Section --- */}
             <section className="dashboard-section" id="block-form-section">
                 <h3>Manage Block Out Times</h3>

                  {/* --- Add/Edit Block Form --- */}
                 <form onSubmit={handleBlockSubmit} className="rule-form"> {/* Reuse rule-form styles */}
                     <h4>{isEditingBlock ? 'Edit Block-Out' : 'Add New Block-Out'}</h4>
                     {blockFormError && <p className="error-message">{blockFormError}</p>}
                     <div className="form-row">
                         <div className="form-group">
                             <label htmlFor="block_start_time">Start Time:</label>
                             <input
                                 type="datetime-local" // Use datetime-local for date and time
                                 id="block_start_time"
                                 name="start_time"
                                 value={blockForm.start_time}
                                 onChange={handleBlockFormChange}
                                 required
                             />
                         </div>
                         <div className="form-group">
                             <label htmlFor="block_end_time">End Time:</label>
                             <input
                                 type="datetime-local"
                                 id="block_end_time"
                                 name="end_time"
                                 value={blockForm.end_time}
                                 onChange={handleBlockFormChange}
                                 required
                             />
                         </div>
                     </div>
                      <div className="form-row">
                          <div className="form-group" style={{flexBasis: '100%'}}> {/* Make reason take full width */}
                             <label htmlFor="reason">Reason (Optional):</label>
                             <input
                                 type="text"
                                 id="reason"
                                 name="reason"
                                 value={blockForm.reason}
                                 onChange={handleBlockFormChange}
                                 maxLength={255} // Example limit
                             />
                         </div>
                     </div>
                     <div className="form-actions">
                         <button type="submit" className="button-primary">
                             {isEditingBlock ? 'Update Block' : 'Add Block'}
                         </button>
                         {isEditingBlock && (
                             <button type="button" onClick={handleCancelBlockEdit} className="button-secondary">
                                 Cancel Edit
                             </button>
                         )}
                     </div>
                 </form>

                 <hr className="divider" />

                 {/* --- Current Blocks Table --- */}
                 <h4>Current Block-Out Times</h4>
                 {loading.blocks ? ( // Use loading state if added
                    <p>Loading block-out times...</p>
                 ) : (
                    <div className="table-container">
                        {blockOutTimes.length === 0 ? (
                             <p>No block-out times defined.</p>
                        ) : (
                             <table>
                                 <thead>
                                     <tr>
                                         <th>Start Time</th>
                                         <th>End Time</th>
                                         <th>Reason</th>
                                         <th>Actions</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {blockOutTimes.map(renderBlockRow)}
                                 </tbody>
                             </table>
                        )}
                    </div>
                 )}
             </section>
        </div>
    );
}

export default AdminDashboardPage;
