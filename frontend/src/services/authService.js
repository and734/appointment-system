import axiosInstance from '../api/axiosInstance';

// ... (login, register, logout functions remain the same) ...
const login = async (email, password) => {
    const response = await axiosInstance.post('/auth/login', { email, password });
    // Store token in login function within AuthContext now
    return response.data; // Contains token and user info
};

const register = async (name, email, password) => {
    const response = await axiosInstance.post('/auth/register', { name, email, password });
    // Store token in register function within AuthContext now
    return response.data; // Contains token and user info
};

const logout = () => {
    // Primarily handled client-side by clearing token in context
    // No need to remove token from localStorage here, context does it.
    console.log("authService logout called (client-side primarily)");
    // Optionally call backend if needed:
    // return axiosInstance.post('/auth/logout');
};

const getCurrentUserFromServer = async () => {
    // This makes the API call to /api/auth/me
    // The token should already be set in axiosInstance headers by AuthContext
    const response = await axiosInstance.get('/auth/me');
    return response.data; // Backend should return { id, name, email, role }
};



const authService = { // Assign the object to a named constant
  login,
  register,
  logout,
  getCurrentUserFromServer,
};

export default authService; // Export the named constant as default
