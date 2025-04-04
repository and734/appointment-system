import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Wraps routes that require authentication
function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation(); // Get current location to redirect back after login

  if (isLoading) {
    // Show loading indicator while checking authentication status
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // User not logged in, redirect to login page
    // Pass the current location in state so we can redirect back after login
    console.log("ProtectedRoute: Not authenticated, redirecting to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin role if route is admin-only
  if (adminOnly && user?.role !== 'admin') {
      console.log("ProtectedRoute: Not authorized for admin route, redirecting.");
      // User is logged in but not an admin, redirect (e.g., to home or an unauthorized page)
      return <Navigate to="/" replace />; // Or to a specific 'unauthorized' page
  }

  // User is authenticated (and has required role if adminOnly), render the child component
  return children;
}

export default ProtectedRoute;
