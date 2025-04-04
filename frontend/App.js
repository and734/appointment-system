import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';

// Import Page components later
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import BookingPage from './pages/BookingPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  // Placeholder for auth state (use Context API or state management later)
  const isLoggedIn = false;
  const isAdmin = false;

  return (
    <Router>
      <div className="App">
        <nav>
          <ul>
            <li><Link to="/">Home</Link></li>
            {!isLoggedIn ? (
              <>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Register</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/book">Book Appointment</Link></li>
                <li><Link to="/my-appointments">My Appointments</Link></li>
                {isAdmin && <li><Link to="/admin">Admin Dashboard</Link></li>}
                <li><button onClick={() => {/* Handle Logout */}}>Logout</button></li>
              </>
            )}
          </ul>
        </nav>

        <main>
          <Routes>
            {/* Define routes here using placeholder components for now */}
            <Route path="/" element={<div>Home Page Content</div>} />
            <Route path="/login" element={<div>Login Page Content</div>} />
            <Route path="/register" element={<div>Register Page Content</div>} />
            <Route path="/book" element={<div>Booking Page Content (Requires Login)</div>} />
            <Route path="/my-appointments" element={<div>My Appointments Page Content (Requires Login)</div>} />
            <Route path="/admin" element={<div>Admin Dashboard Content (Requires Admin Login)</div>} />
            {/* Add a catch-all 404 route */}
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
