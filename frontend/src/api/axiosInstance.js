import axios from 'axios';

// Get the backend URL from environment variables (set in .env file)
// REACT_APP_API_URL=http://localhost:5000/api (example for Create React App)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or get token from context/state
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor for handling common errors (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      console.error("Unauthorized access - redirecting to login.");
      localStorage.removeItem('authToken'); // Clear token
      // window.location.href = '/login'; // Consider using useNavigate hook instead
    }
    return Promise.reject(error);
  }
);


export default axiosInstance;
