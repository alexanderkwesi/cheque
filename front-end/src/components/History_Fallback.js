import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import storage from "./storage.js";

const History = () => {
  const [cheques, setCheques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [editingCheque, setEditingCheque] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [currency, setCurrency] = useState("GBP");
  const [successMessage, setSuccessMessage] = useState("");
  const [initialLoad, setInitialLoad] = useState(true);

  // FIX: Use AuthContext and storage like Dashboard
  const { user } = useAuth();

  // FIX: Properly handle userData from localStorage like Dashboard
  const userDataStr = localStorage.getItem("user");
  const userData = userDataStr ? JSON.parse(userDataStr) : null;

  // FIX: Initialize userid safely using AuthContext pattern from Dashboard
  const [userid, setUserid] = useState(
    user?.id || storage.getUserId() || userData?.id || 0
  );

  // FIX: Initialize token safely using storage pattern from Dashboard
  const [token, setToken] = useState(
    storage.getToken() || userData?.token || null
  );

  const URL = "http://localhost:5000" || "http://127.0.0.1:5000";

  // Currency configuration (consistent with Dashboard)
  const currencies = {
    GBP: { symbol: "£", name: "British Pound" },
    USD: { symbol: "$", name: "US Dollar" },
    EUR: { symbol: "€", name: "Euro" },
    CAD: { symbol: "C$", name: "Canadian Dollar" },
    AUD: { symbol: "A$", name: "Australian Dollar" },
    JPY: { symbol: "¥", name: "Japanese Yen" },
    INR: { symbol: "₹", name: "Indian Rupee" },
  };

  // Mock exchange rates (consistent with Dashboard)
  const exchangeRates = {
    GBP: 1.0,
    USD: 1.27,
    EUR: 1.17,
    CAD: 1.72,
    AUD: 1.94,
    JPY: 188.42,
    INR: 105.67,
  };

  // Status Badge Component (improved design)
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      processed: {
        class: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        label: "Processed",
      },
      approved: {
        class: "bg-green-100 text-green-800 border border-green-200",
        label: "Approved",
      },
      pending: {
        class: "bg-amber-100 text-amber-800 border border-amber-200",
        label: "Pending",
      },
      processing: {
        class: "bg-blue-100 text-blue-800 border border-blue-200",
        label: "Processing",
      },
      needs_review: {
        class: "bg-orange-100 text-orange-800 border border-orange-200",
        label: "Needs Review",
      },
      rejected: {
        class: "bg-red-100 text-red-800 border border-red-200",
        label: "Rejected",
      },
      failed: {
        class: "bg-rose-100 text-rose-800 border border-rose-200",
        label: "Failed",
      },
    };

    const config = statusConfig[status] || {
      class: "bg-gray-100 text-gray-800 border border-gray-200",
      label: status,
    };

    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-medium ${config.class}`}
      >
        {config.label}
      </span>
    );
  };

  // FIX: Helper function for status colors - MOVED INSIDE COMPONENT
  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "processed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "pending":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "processing":
      case "needs_review":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "rejected":
      case "failed":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // FIX: Improved load_userid using Dashboard pattern
  const load_userid = () => {
    const userId = user?.id || storage.getUserId() || userData?.id || 0;
    setUserid(userId);
  };

  // FIX: Improved fetch function with better error handling like Dashboard
  const fetchUserCheques = useCallback(async () => {
    console.log("🔑 Token check:", token);

    if (!token) {
      console.error("No authentication token found - redirecting to login");
      window.location.href = "/login";
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching cheques for user:", userid);

      const response = await axios.post(
        `${URL}/api/cheques/user`,
        {
          user_id: userid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // FIX: Handle different response structures like Dashboard
      const chequesData = response.data.cheques || response.data || [];

      // Convert to array if it's an object
      const chequesArray = Array.isArray(chequesData)
        ? chequesData
        : Object.values(chequesData);

      console.log("Cheques loaded successfully:", chequesArray.length);
      setCheques(chequesArray);
      setError("");
    } catch (error) {
      console.error("Error fetching user cheques:", error);

      // FIX: Better error handling like Dashboard
      if (error.response?.status === 401) {
        setError("Please log in to view your cheque history");
        window.location.href = "/login";
      } else if (error.response?.status === 403) {
        setError("You don't have permission to view cheque history");
      } else if (error.response?.status === 404) {
        // No cheques found is not an error
        setCheques([]);
        setError("");
      } else {
        setError("Failed to load your cheque history. Please try again.");
        // Set empty array instead of showing error for network issues
        setCheques([]);
      }
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [userid, token, URL]);

  // FIX: Load userid on component mount like Dashboard
  useEffect(() => {
    load_userid();
  }, []);

  // FIX: Fetch data only when authenticated like Dashboard
  useEffect(() => {
    if (!token) {
      console.log("Token not available, redirecting to login");
      window.location.href = "/login";
      return;
    } else if (userid) {
      console.log("Token and userid available, fetching cheques");
      // Use setTimeout to ensure component is mounted
      const timer = setTimeout(() => {
        fetchUserCheques();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fetchUserCheques, token, userid]);

  const filteredCheques = cheques.filter((cheque) => {
    if (filter === "all") return true;
    return cheque.status === filter;
  });

  // Convert amount to selected currency (consistent with Dashboard)
  const convertAmount = (amount, fromCurrency = "GBP") => {
    try {
      // Validate inputs
      const validAmount = Number(amount) || 0;
      const validFromCurrency = exchangeRates[fromCurrency]
        ? fromCurrency
        : "GBP";

      if (validFromCurrency === currency) return validAmount;

      // Convert to GBP first, then to target currency
      const amountInGBP = validAmount / exchangeRates[validFromCurrency];
      const result = amountInGBP * exchangeRates[currency];

      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error("Error converting currency:", error);
      return 0;
    }
  };

  // Format currency display (consistent with Dashboard)
  const formatCurrency = (amount, originalCurrency = "GBP") => {
    try {
      const validAmount = Number(amount) || 0;
      const convertedAmount = convertAmount(validAmount, originalCurrency);
      const symbol = currencies[currency]?.symbol || "$";

      return `${symbol}${convertedAmount.toFixed(2)}`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "$0.00";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not available";

    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const handleStatusChange = async (chequeId, newStatus) => {
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    // FIX: Store original cheques BEFORE making any changes
    const originalCheques = [...cheques];

    try {
      // Update locally first for immediate feedback
      setCheques((prev) =>
        prev.map((cheque) =>
          cheque.id === chequeId ? { ...cheque, status: newStatus } : cheque
        )
      );

      // API call to update status
      await axios.post(
        `${URL}/api/cheque/${chequeId}/status`,
        {
          status: newStatus,
          user_id: userid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccessMessage(`Cheque status updated to ${newStatus}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert on error - use the stored original cheques
      setCheques(originalCheques);
      setError("Failed to update status. Please try again.");
    }
  };

  const handleEdit = (cheque) => {
    setEditingCheque(cheque.id);
    setEditForm({
      amount: cheque.amount,
      payer_name: cheque.payer_name || "",
      payee_name: cheque.payee_name || "",
      bank_name: cheque.bank_name || "",
      cheque_number: cheque.cheque_number || "",
      currency: cheque.currency || "GBP",
      memo: cheque.memo || "",
    });
  };

  const handleSaveEdit = async (chequeId) => {
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    // FIX: Store original cheques BEFORE making any changes
    const originalCheques = [...cheques];

    try {
      // Validate form
      if (!editForm.amount || editForm.amount <= 0) {
        setError("Please enter a valid amount");
        return;
      }

      if (!editForm.payer_name?.trim()) {
        setError("Payer name is required");
        return;
      }

      // Update locally first
      setCheques((prev) =>
        prev.map((cheque) =>
          cheque.id === chequeId ? { ...cheque, ...editForm } : cheque
        )
      );

      // API call to update cheque
      await axios.post(
        `${URL}/api/cheque/${chequeId}`,
        {
          ...editForm,
          user_id: userid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setEditingCheque(null);
      setEditForm({});
      setSuccessMessage("Cheque updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating cheque:", error);
      // Revert on error - use the stored original cheques
      setCheques(originalCheques);
      setError("Failed to update cheque. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setEditingCheque(null);
    setEditForm({});
  };

  const handleDelete = async (chequeId) => {
    if (!token) {
      setError("Authentication required. Please log in again.");
      return;
    }

    // FIX: Store original cheques BEFORE making any changes
    const originalCheques = [...cheques];

    try {
      // Remove locally first
      setCheques((prev) => prev.filter((cheque) => cheque.id !== chequeId));

      // API call to delete cheque
      await axios.post(
        `${URL}/api/cheque/${chequeId}/delete`,
        {
          user_id: userid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setShowDeleteConfirm(null);
      setSuccessMessage("Cheque deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting cheque:", error);
      // Revert on error - use the stored original cheques
      setCheques(originalCheques);
      setError("Failed to delete cheque. Please try again.");
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending", color: "amber" },
    { value: "processing", label: "Processing", color: "blue" },
    { value: "needs_review", label: "Needs Review", color: "orange" },
    { value: "processed", label: "Processed", color: "emerald" },
    { value: "approved", label: "Approved", color: "green" },
    { value: "rejected", label: "Rejected", color: "red" },
    { value: "failed", label: "Failed", color: "rose" },
  ];

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
  };

  // FIX: Add refresh function like Dashboard
  const handleRefresh = () => {
    setLoading(true);
    fetchUserCheques();
  };

  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            Loading your cheque history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Cheque History
            </h1>
            <p className="text-gray-600 mt-2">
              Track and manage all your processed cheques
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Refresh</span>
            </button>

            <div className="flex items-center space-x-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
              <span className="text-sm font-medium text-gray-600">
                Currency:
              </span>
              <select
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="bg-transparent border-0 focus:ring-0 text-sm font-medium text-gray-800"
              >
                {Object.entries(currencies).map(([code, config]) => (
                  <option key={code} value={code}>
                    {config.name} ({config.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {cheques.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Total Cheques
                </h3>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-2 font-mono">
                {cheques.length}
              </p>
              <p className="text-gray-500 text-sm">All processed cheques</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Approved/Processed
                </h3>
                <div className="bg-emerald-50 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-600 mb-2 font-mono">
                {
                  cheques.filter(
                    (c) => c.status === "approved" || c.status === "processed"
                  ).length
                }
              </p>
              <p className="text-gray-500 text-sm">Successfully processed</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
                <div className="bg-amber-50 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-600 mb-2 font-mono">
                {
                  cheques.filter(
                    (c) => c.status === "pending" || c.status === "processing"
                  ).length
                }
              </p>
              <p className="text-gray-500 text-sm">Awaiting processing</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Rejected/Failed
                </h3>
                <div className="bg-red-50 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-red-600 mb-2 font-mono">
                {
                  cheques.filter(
                    (c) => c.status === "rejected" || c.status === "failed"
                  ).length
                }
              </p>
              <p className="text-gray-500 text-sm">Requires attention</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Filter Cheques
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                filter === "all"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Cheques
            </button>
            {statusOptions.map((status) => (
              <button
                key={status.value}
                onClick={() => setFilter(status.value)}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === status.value
                    ? `bg-${status.color}-600 text-white shadow-lg`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cheque List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {filter === "all"
                ? "All Cheques"
                : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Cheques`}
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                Displaying in {currencies[currency]?.name || "British Pound"}
              </span>
            </div>
          </div>

          {filteredCheques.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-300 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {filter === "all"
                  ? "No cheques uploaded yet"
                  : `No ${filter} cheques`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === "all"
                  ? "Start by uploading your first cheque!"
                  : `You don't have any ${filter} cheques at the moment.`}
              </p>
              {filter === "all" && (
                <Link
                  to="/upload"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  <span>Upload First Cheque</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Cheque Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payer/Payee
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date Submitted
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCheques.map((cheque) => (
                    <tr
                      key={cheque.id}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCheque === cheque.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.cheque_number || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  cheque_number: e.target.value,
                                }))
                              }
                              placeholder="Cheque Number"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={editForm.bank_name || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  bank_name: e.target.value,
                                }))
                              }
                              placeholder="Bank Name"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <input
                              type="text"
                              value={editForm.memo || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  memo: e.target.value,
                                }))
                              }
                              placeholder="Memo/Notes"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-sm font-medium text-gray-900">
                              Cheque #{cheque.cheque_number || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cheque.bank_name || "Bank details not available"}
                            </div>
                            {cheque.memo && (
                              <div className="text-xs text-gray-400 mt-1">
                                {cheque.memo}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCheque === cheque.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editForm.payer_name || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  payer_name: e.target.value,
                                }))
                              }
                              placeholder="Payer Name *"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                            <input
                              type="text"
                              value={editForm.payee_name || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  payee_name: e.target.value,
                                }))
                              }
                              placeholder="Payee Name"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-sm text-gray-900">
                              {cheque.payer_name || "Unknown Payer"}
                            </div>
                            {cheque.payee_name && (
                              <div className="text-xs text-gray-500">
                                To: {cheque.payee_name}
                              </div>
                            )}
                          </>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingCheque === cheque.id ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              value={editForm.amount || ""}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  amount: parseFloat(e.target.value),
                                }))
                              }
                              placeholder="Amount *"
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              step="0.01"
                              min="0.01"
                              required
                            />
                            <select
                              value={editForm.currency || "GBP"}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  currency: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {Object.keys(currencies).map((curr) => (
                                <option key={curr} value={curr}>
                                  {curr}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-gray-900 font-mono">
                            {formatCurrency(cheque.amount, cheque.currency)}
                            <div className="text-xs text-gray-500">
                              {cheque.currency}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={cheque.status}
                          onChange={(e) =>
                            handleStatusChange(cheque.id, e.target.value)
                          }
                          className={`text-xs font-medium rounded-full px-3 py-2 border-0 focus:ring-2 focus:ring-blue-500 transition-all duration-200 ${getStatusColor(
                            cheque.status
                          )}`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(cheque.created_at)}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingCheque === cheque.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveEdit(cheque.id)}
                              className="text-green-600 hover:text-green-900 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors duration-200"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleEdit(cheque)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                              title="Edit cheque"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(cheque.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
                              title="Delete cheque"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Currency Information */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Currency Information
          </h3>
          <p className="text-sm text-blue-700">
            All amounts are converted from their original currency to{" "}
            {currencies[currency]?.name || "British Pound"} using current
            exchange rates. Displayed amounts are for informational purposes
            only.
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 text-center mb-8">
              Are you sure you want to delete this cheque? This action cannot be
              undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition duration-200 font-semibold"
              >
                Delete Cheque
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
