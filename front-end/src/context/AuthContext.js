import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import storage from "../components/storage.js";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);

    // ✅ FIXED: Remove the return statement or return a cleanup function
    // return () => { /* cleanup if needed */ };
  }, []); // ✅ FIXED: Remove userData from dependencies to avoid infinite loops

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email: email,
        password: password,
      });

      const { access_token, id, email: userEmail } = response.data;

      // Store token and user data
      localStorage.setItem("token", access_token);
      const userData = {
        id: id || response.data?.user_id,
        email: userEmail,
        token: access_token,
      };

      localStorage.setItem("user", JSON.stringify(userData));

      // Set storage if needed
      if (storage && storage.setUser) {
        storage.setUser(userData);
        storage.setToken(userData.token);
      }

      // Set default authorization header
      axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

      // Update state
      setUser(userData);

      return { success: true, userId: userData.id };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Login failed. Please try again.",
      };
    }
  };

  const window_storage = (user_val, email, access_token) => {
    if (storage && storage.setUser) {
      storage.setUser({
        email: email,
        user_id: parseInt(user_val[1]),
        token: access_token,
      });
      if (storage.isLoggedIn === true) {
        const result = [user_val[1], email, access_token];
        storage.setPageData(login, result);
        storage.setToken(access_token);
      }
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/register",
        userData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error:
          error.response?.data?.error ||
          "Registration failed. Please try again.",
      };
    }
  };

  const logout = () => {
    // Remove from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Remove authorization header
    delete axios.defaults.headers.common["Authorization"];

    // Clear storage if needed
    if (storage && storage.setUser) {
      storage.setUser(null);
      storage.setToken(null);
    }

    // Update state
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
