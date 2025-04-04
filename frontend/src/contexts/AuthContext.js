import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService'; // Service to interact with backend auth API
import axiosInstance from '../api/axiosInstance'; // To set/unset Authorization header

// Create Context
const AuthContext = createContext(null);

// Create Provider Component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: localStorage.getItem('authToken') || null,
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start in loading state until we verify token/user
  });

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        console.log("Token found, verifying user...");
        // Set token in axios headers for subsequent requests
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          // Fetch user details using the token
          const response = await authService.getCurrentUserFromServer(); // Needs implementation in authService
          console.log("User verified:", response);
          setAuthState({
            token: token,
            user: response, // Assuming response is the user object { id, name, email, role }
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error("Token verification failed:", error);
          // Token is invalid or expired, clear it
          localStorage.removeItem('authToken');
          delete axiosInstance.defaults.headers.common['Authorization'];
          setAuthState({
            token: null,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        console.log("No token found.");
        // No token, ensure loading is finished
        setAuthState({
          token: null,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    verifyUser();
  }, []); // Run only once on component mount

  const login = async (email, password) => {
    try {
      const { token, user } = await authService.login(email, password); // Assuming backend returns { token, user }
      localStorage.setItem('authToken', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAuthState({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      console.log("Login successful, state updated.");
    } catch (error) {
      console.error("Login failed in AuthContext:", error);
      // Clear any potentially stale state
      localStorage.removeItem('authToken');
       delete axiosInstance.defaults.headers.common['Authorization'];
      setAuthState({
        token: null,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error; // Re-throw error so the component can handle it (e.g., show message)
    }
  };

   const register = async (name, email, password) => {
       try {
           // Assuming register also logs the user in and returns token/user
           const { token, user } = await authService.register(name, email, password);
           localStorage.setItem('authToken', token);
           axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
           setAuthState({
               token,
               user,
               isAuthenticated: true,
               isLoading: false,
           });
           console.log("Registration successful, state updated.");
       } catch (error) {
           console.error("Registration failed in AuthContext:", error);
           // Clear state as registration failed
           localStorage.removeItem('authToken');
           delete axiosInstance.defaults.headers.common['Authorization'];
           setAuthState({
               token: null,
               user: null,
               isAuthenticated: false,
               isLoading: false,
           });
           throw error; // Re-throw for component handling
       }
   };

  const logout = () => {
    console.log("Logging out.");
    localStorage.removeItem('authToken');
    delete axiosInstance.defaults.headers.common['Authorization'];
    // Call backend logout if needed (optional for stateless JWT)
    // authService.logout();
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
     // Optionally redirect to home or login page using useNavigate hook if needed elsewhere
  };

  const value = {
    ...authState,
    login,
    register,
    logout,
  };

  // Don't render children until initial loading/verification is complete
  // Or show a loading spinner
  // if (authState.isLoading) {
  //   return <div>Loading authentication...</div>;
  // }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create Hook to use Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
