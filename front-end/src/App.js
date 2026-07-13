import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login.js";
import Register from "./components/Register.js";
import Dashboard from "./components/Dashboard.js";
import ChequeUpload from "./components/ChequeUpload.js";
import Wallet from "./components/Wallet.js";
import History from "./components/History.js";
import Navbar from "./components/Navbar.js";
import { AuthProvider, useAuth } from "./context/AuthContext.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import Home from "./components/Home.js";
import Forgotten from "./components/ForgottenPassword.js"
import Reset from "./components/ResetPassword.js";
import ScheduleDemo from "./components/Schedule_Demo_Page.js";
import "./App.css";

// Layout component for routes that need Navbar
function LayoutWithNavbar({ children }) {
  return (
    <div className="App">
      <Navbar />
      {children}
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            {/* Redirect root to /home */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            {/* Public routes without navbar */}
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgotten" element={<Forgotten />} />
            <Route path="/forgot-password" element={<Forgotten />} />
            <Route path="/reset-password" element={<Reset />} />
            <Route path="/schedule_demo" element={<ScheduleDemo />} />
            {/* Protected routes with navbar */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LayoutWithNavbar>
                    <Dashboard />
                  </LayoutWithNavbar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <LayoutWithNavbar>
                    <ChequeUpload />
                  </LayoutWithNavbar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <LayoutWithNavbar>
                    <Wallet />
                  </LayoutWithNavbar>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <LayoutWithNavbar>
                    <History />
                  </LayoutWithNavbar>
                </ProtectedRoute>
              }
            />
            {/* Catch-all route for 404 - removed duplicate */}
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
