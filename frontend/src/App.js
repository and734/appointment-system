import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import './App.css';

// Import Auth Context Hook
import { useAuth } from './contexts/AuthContext';

// Import Page components
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

// Import Protected Route Component
import ProtectedRoute from './components/ProtectedRoute';

// --- Placeholder Pages (Create these files in src/pages) ---
// const PlaceholderComponent = ({ title }) => <div><h2>{title}</h2><p>Content coming soon...</p></div>;
// const HomePage = () => <PlaceholderComponent title="Home Page" />;
// const BookingPage = () => <PlaceholderComponent title="Book Appointment" />;
// const MyAppointmentsPage = () => <PlaceholderComponent title="My Appointments" />;
// const AdminDashboardPage = () => <PlaceholderComponent title="Admin Dashboard" />;
// const NotFoundPage = () => <PlaceholderComponent title="404 Not Found" />;
// --- End Placeholder Pages ---

// Navigation component to use hooks
function Navigation() {
    const { isAuthenticated, user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/'); // Redirect to home after logout
    };

    if (isLoading) {
      return <nav>Loading...</nav>; // Don't show nav until auth state is known
    }

    return (
        <nav>
            <ul>
                <li><Link to="/">Home</Link></li>
                {!isAuthenticated ? (
                    <>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/register">Register</Link></li>
                    </>
                ) : (
                    <>
                        <li><Link to="/book">Book Appointment</Link></li>
                        <li><Link to="/my-appointments">My Appointments</Link></li>
                        {user?.role === 'admin' && <li><Link to="/admin">Admin Dashboard</Link></li>}
                        <li>
                            <span>Welcome, {user?.name}! </span>
                            <button onClick={handleLogout}>Logout</button>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}


function App() {
  return (
    <Router>
      <div className="App">
        <Navigation /> {/* Use the Navigation component */}

        <main>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Customer Routes */}
            <Route
              path="/book"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-appointments"
              element={
                <ProtectedRoute>
                  <MyAppointmentsPage />
                </ProtectedRoute>
              }
            />

             {/* Protected Admin Routes */}
             <Route
               path="/admin"
               element={
                 <ProtectedRoute adminOnly={true}> {/* Add adminOnly prop */}
                   <AdminDashboardPage />
                 </ProtectedRoute>
               }
             />

            {/* Catch-all 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
