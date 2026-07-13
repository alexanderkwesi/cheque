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
import { AuthProvider, useAuth } from "././context/AuthConttext.js";
import ErrorBoundary from "./components/ErrorBoundary.js";
import Home from "./components/Home.js";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <AppContent />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={!user ? <Home /> : <Navigate to="/login" />} />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/register"
          element={!user ? <Register /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/upload"
          element={user ? <ChequeUpload /> : <Navigate to="/login" />}
        />
        <Route
          path="/wallet"
          element={user ? <Wallet /> : <Navigate to="/login" />}
        />
        <Route
          path="/history"
          element={user ? <History /> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/"} />} />
        {/* 404 Page */}
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-8">Page not found</p>
                <Navigate to="/" />
              </div>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
