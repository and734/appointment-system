// frontend/src/services/adminService.js
import axiosInstance from '../api/axiosInstance';

// ... (keep existing appointment and availability rule functions) ...

// --- Block Out Times ---
const getBlockOutTimes = async () => {
    console.log("adminService: Fetching block-out times");
    const response = await axiosInstance.get('/admin/block-out-times');
    return response.data; // Expects array of block-out objects
};

const createBlockOutTime = async (blockData) => {
    // blockData = { start_time, end_time, reason } (dates as ISO strings or Date objects)
    console.log("adminService: Creating block-out time", blockData);
    const response = await axiosInstance.post('/admin/block-out-times', blockData);
    return response.data; // Expects the created block object
};

const updateBlockOutTime = async (blockId, updateData) => {
    console.log(`adminService: Updating block-out time ${blockId}`, updateData);
    const response = await axiosInstance.put(`/admin/block-out-times/${blockId}`, updateData);
    return response.data; // Expects the updated block object
};

const deleteBlockOutTime = async (blockId) => {
    console.log(`adminService: Deleting block-out time ${blockId}`);
    const response = await axiosInstance.delete(`/admin/block-out-times/${blockId}`);
    return response.status; // Expects 204 status code
};


const adminService = {
    getAllAppointments,
    updateAppointmentStatus,
    getAvailabilityRules,
    createAvailabilityRule,
    updateAvailabilityRule,
    deleteAvailabilityRule,
    // Add block out time functions
    getBlockOutTimes,
    createBlockOutTime,
    updateBlockOutTime,
    deleteBlockOutTime,
};

export default adminService;
