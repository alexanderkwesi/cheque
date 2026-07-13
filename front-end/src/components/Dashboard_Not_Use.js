import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Badge, Tooltip, Alert } from "@mui/material";

import { useAuth } from "../context/AuthContext.js";
import storage from "./storage.js";

const URL = "http://localhost:5000" || "http://127.0.0.1:5000";

const Dashboard = () => {
  const userDataStr = localStorage.getItem("user");
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const [getChequeId, setChequeId] = useState("");
  const [userid, setuserid] = useState(userData?.id || 0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState("0.00");
  const [getCheques, setCheques_Upload] = useState([]);
  const [recentCheques, setRecentCheques] = useState([]);
  const [getChequesCount, setChequesCount] = useState(0);
  const [getChequeStatus, setChequeSatus] = useState({
    pending: 0,
    processing: 0,
    needs_review: 0,
    approved: 0,
    processed: 0,
    rejected: 0,
    failed: 0,
    total: 0,
  });
  const [displayStats, setDisplayStats] = useState({
    pending: 0,
    processing: 0,
    needs_review: 0,
    approved: 0,
    processed: 0,
    rejected: 0,
    failed: 0,
    total: 0,
  });
  const [selectedValues, setSelectedValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  let chequesData = useState([]);
  const [currency, setCurrency] = useState("GBP");
  const { user } = useAuth();

  // Track previous balance to detect transactions
  const [previousBalance, setPreviousBalance] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Chart data states
  const [depositData, setDepositData] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [chartTimeRange, setChartTimeRange] = useState("7d"); // 7d, 30d, 90d

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

  // Enhanced animated counter for money with digit-by-digit animation
  const animateMoneyValue = (
    start,
    end,
    duration,
    setter,
    isCurrency = false
  ) => {
    // If start and end are the same, set directly and return
    if (Math.abs(start - end) < 0.01) {
      if (isCurrency) {
        setter(formatCurrencyValue(end));
      } else {
        setter(Math.round(end));
      }
      return () => {}; // Return empty cleanup function
    }

    const startValue =
      typeof start === "number" ? start : parseFloat(start) || 0;
    const endValue = typeof end === "number" ? end : parseFloat(end) || 0;

    const startTimestamp = performance.now();
    let animationFrameId;

    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      let currentValue = startValue + (endValue - startValue) * easeOutQuart;

      // Ensure we don't overshoot the target
      if (
        (endValue > startValue && currentValue > endValue) ||
        (endValue < startValue && currentValue < endValue)
      ) {
        currentValue = endValue;
      }

      if (isCurrency) {
        // For currency, format with 2 decimal places
        const formattedValue = currentValue.toFixed(2);
        setter(formattedValue);
      } else {
        // For counts, round to nearest integer
        setter(Math.round(currentValue));
      }

      // Stop animation when we reach the target or complete duration
      if (Math.abs(currentValue - endValue) < 0.01 || progress >= 1) {
        // Set final value exactly
        if (isCurrency) {
          setter(formatCurrencyValue(endValue));
        } else {
          setter(Math.round(endValue));
        }
        return;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    // Cleanup function to cancel animation if component unmounts
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  };

  // Generate mock chart data based on time range
  const generateChartData = (timeRange) => {
    const now = new Date();
    let dataPoints = 0;
    let timeUnit = "";

    switch (timeRange) {
      case "7d":
        dataPoints = 7;
        timeUnit = "day";
        break;
      case "30d":
        dataPoints = 30;
        timeUnit = "day";
        break;
      case "90d":
        dataPoints = 12;
        timeUnit = "week";
        break;
      default:
        dataPoints = 7;
        timeUnit = "day";
    }

    const deposits = [];
    const spending = [];

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date();
      if (timeUnit === "day") {
        date.setDate(now.getDate() - i);
      } else {
        date.setDate(now.getDate() - i * 7);
      }

      // Generate realistic-looking data with some randomness
      const baseDeposit = Math.random() * 1000 + 500; // £500-£1500 range
      const baseSpending = Math.random() * 800 + 200; // £200-£1000 range

      deposits.push({
        date: date.toISOString().split("T")[0],
        amount: Math.round(baseDeposit + (Math.random() * 300 - 150)), // Add some variation
        count: Math.floor(Math.random() * 5) + 1, // 1-5 transactions
      });

      spending.push({
        date: date.toISOString().split("T")[0],
        amount: Math.round(baseSpending + (Math.random() * 200 - 100)), // Add some variation
        count: Math.floor(Math.random() * 8) + 2, // 2-10 transactions
      });
    }

    return { deposits, spending };
  };

  // Load cached data on component mount
  useEffect(() => {
    loadCachedData();
  }, []);

  const loadCachedData = () => {
    const cachedDashboard = storage.getPageData("dashboard");
    if (cachedDashboard) {
      const { balance, cheques, stats } = cachedDashboard;
      setWalletBalance(balance || 0);
      setDisplayBalance(formatCurrencyValue(balance || 0));
      setPreviousBalance(balance || 0); // Set previous balance from cache
      setRecentCheques(cheques || []);
      setDisplayStats(stats || getChequeStatus);
      console.log("Loaded cached dashboard data");
    }
  };

  // Initialize chart data
  useEffect(() => {
    const { deposits, spending } = generateChartData(chartTimeRange);
    setDepositData(deposits);
    setSpendingData(spending);
  }, [chartTimeRange]);

  // Currency configuration
  const currencies = {
    GBP: { symbol: "£", name: "British Pound" },
    USD: { symbol: "$", name: "US Dollar" },
    EUR: { symbol: "€", name: "Euro" },
    CAD: { symbol: "C$", name: "Canadian Dollar" },
    AUD: { symbol: "A$", name: "Australian Dollar" },
    JPY: { symbol: "¥", name: "Japanese Yen" },
    INR: { symbol: "₹", name: "Indian Rupee" },
  };

  // Format currency value without symbol for animation
  const formatCurrencyValue = (amount) => {
    return typeof amount === "number" ? amount.toFixed(2) : "0.00";
  };

  // Status Badge Component
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

  // Mock exchange rates
  const exchangeRates = {
    GBP: 1.0,
    USD: 1.27,
    EUR: 1.17,
    CAD: 1.72,
    AUD: 1.94,
    JPY: 188.42,
    INR: 105.67,
  };

  // Separate function for fallback data
  const setFallbackData = () => {
    const fallbackBalance = 1250.75;
    const fallbackCheques = [
      {
        id: 1,
        amount: 500.0,
        currency: "GBP",
        payer_name: "ABC Corporation",
        status: "processed",
        created_at: new Date("2024-01-15").toISOString(),
      },
      {
        id: 2,
        amount: 250.5,
        currency: "USD",
        payer_name: "XYZ Ltd",
        status: "pending",
        created_at: new Date("2024-01-20").toISOString(),
      },
      {
        id: 3,
        amount: 750.0,
        currency: "GBP",
        payer_name: "John Smith",
        status: "approved",
        created_at: new Date("2024-01-10").toISOString(),
      },
    ];

    const fallbackStats = {
      pending: 1,
      processing: 0,
      needs_review: 0,
      approved: 1,
      processed: 1,
      rejected: 0,
      failed: 0,
      total: 3,
    };

    // Set all data at once
    setWalletBalance(fallbackBalance);
    setPreviousBalance(fallbackBalance);
    setRecentCheques(fallbackCheques);
    setChequeSatus(fallbackStats);
    setDisplayStats(fallbackStats);
    setDisplayBalance(formatCurrencyValue(fallbackBalance));

    // Cache fallback data
    storage.setPageData("dashboard", {
      balance: fallbackBalance,
      cheques: fallbackCheques,
      stats: fallbackStats,
      last_updated: new Date().toISOString(),
      source: "fallback",
    });
  };

  // Initialize token safely
  const [token, setToken] = useState(
    storage.getToken() || userData?.token || null
  );

  const load_userid = () => {
    const userId = user?.id || storage.getUserId() || userData?.id || 0;
    setuserid(userId);
  };

  // Check if there's been a transaction (deposit or withdrawal)
  const hasTransactionOccurred = (oldBalance, newBalance) => {
    const difference = Math.abs(newBalance - oldBalance);
    // Only consider it a transaction if there's a meaningful change (more than 0.01)
    return difference > 0.01;
  };


  useEffect(() => {
    const userElement = document.querySelector("#row_column");
    if (userElement) {
      const user = userElement.getAttribute("name");
      console.log(user);
      const userId = user.split("_");
      console.log(userId);
    }
  }, []);



  const fetchWalletData = async (token, userid) => {
    try {
      console.log("Testing wallet endpoint...");
      const response = await axios.post(
        `${URL}/api/wallet/balance`,
        { user_id: userid },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Wallet endpoint OK:", response.data);
        const newBalance = response.data.balance || 0;

        // Check if this is a transaction (deposit or withdrawal)
        const isTransaction = hasTransactionOccurred(
          previousBalance,
          newBalance
        );

        if (isTransaction && !initialLoad) {
          console.log("Transaction detected - animating balance change");
          setShouldAnimate(true);
          setWalletBalance(newBalance);
          // Animate from previous balance to new balance
          animateMoneyValue(
            previousBalance,
            newBalance,
            1500,
            setDisplayBalance,
            true
          );
        } else {
          // No transaction or initial load - set directly without animation
          console.log("No transaction detected - setting balance directly");
          setWalletBalance(newBalance);
          setDisplayBalance(formatCurrencyValue(newBalance));
          setShouldAnimate(false);
        }

        // Update previous balance for next comparison
        setPreviousBalance(newBalance);
        return true;
      }
    } catch (walletError) {
      console.error(
        "Wallet endpoint failed:",
        walletError.response?.status,
        walletError.response?.data
      );
      return false;
    }
  };



  const fetchChequesData = async (token, userid) => {
    try {
      console.log("Testing cheques endpoint...");
      const response = await axios.post(
        `${URL}/api/cheques/user`,
        { user_id: userid },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Cheques endpoint OK:", response.data);
        chequesData = response.data.cheques || [];
        const statusActions = response.data.status_actions || {};

        setChequeId();
        setRecentCheques(chequesData);
        setChequesCount(chequesData.length);

        // Set stats directly without animation
        setDisplayStats(statusActions);
        setChequeSatus(statusActions);

        return chequesData;
      }
    } catch (chequesError) {
      console.error(
        "Cheques endpoint failed:",
        chequesError.response?.status,
        chequesError.response?.data
      );
      return false;
    }
  };

  const fetchDashboardData = useCallback(async () => {
    console.log("🔑 Token check:", token);

    if (!token) {
      console.error("No authentication token found - redirecting to login");
      window.location.href = "/login";
      return;
    }

    console.log("Fetching dashboard data for user:", userid);
    setLoading(true);

    try {
      const [walletSuccess, chequesSuccess] = await Promise.allSettled([
        fetchWalletData(token, userid),
        fetchChequesData(token, userid),
      ]);

      const walletOk =
        walletSuccess.status === "fulfilled" && walletSuccess.value;
      const chequesOk =
        chequesSuccess.status === "fulfilled" && chequesSuccess.value;

      if (walletOk && chequesOk) {
        // Cache successful data
        storage.setPageData("dashboard", {
          balance: walletBalance,
          cheques: recentCheques,
          stats: getChequeStatus,
          last_updated: new Date().toISOString(),
          source: "api",
        });
        console.log("Dashboard data loaded and cached successfully");
      } else {
        console.warn("API calls failed, using fallback data");
        setFallbackData();
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setFallbackData();
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [
    userid,
    token,
    walletBalance,
    recentCheques,
    getChequeStatus,
    initialLoad,
    previousBalance,
  ]);

  // Sort cheques function
  const sortCheques = (cheques, key, direction) => {
    return [...cheques].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (key === "amount") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = String(aValue || "").toLowerCase();
        bValue = String(bValue || "").toLowerCase();
      }

      if (aValue < bValue) return direction === "asc" ? -1 : 1;
      if (aValue > bValue) return direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Handle sort click
  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Get sorted cheques
  const sortedCheques = sortCheques(
    recentCheques,
    sortConfig.key,
    sortConfig.direction
  );

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // Load userid on component mount
  useEffect(() => {
    load_userid();
  }, []);

  // Fetch data on mount - optimized to prevent multiple renders
  useEffect(() => {
    if (!token) {
      console.log("Token not available, cancel fetch");
      window.location.href = "/login";
      return;
    } else {
      console.log("Token is available, initialize fetch");
      // Use setTimeout to ensure the component is mounted before starting data fetch
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fetchDashboardData, token]);

  // Convert amount to selected currency
  const convertAmount = (amount, fromCurrency = "GBP") => {
    try {
      const validAmount = Number(amount) || 0;
      const validFromCurrency = exchangeRates[fromCurrency]
        ? fromCurrency
        : "GBP";
      if (validFromCurrency === currency) return validAmount;

      const amountInGBP = validAmount / exchangeRates[validFromCurrency];
      const result = amountInGBP * exchangeRates[currency];
      return isNaN(result) ? 0 : result;
    } catch (error) {
      console.error("Error converting currency:", error);
      return 0;
    }
  };

  // Format currency display with animated values
  const formatCurrency = (amount, originalCurrency = "GBP") => {
    try {
      const validAmount = Number(amount) || 0;
      const convertedAmount = convertAmount(validAmount, originalCurrency);
      const symbol = currencies[currency]?.symbol || "$";

      // For the main balance display, we use the animated value only during transactions
      if (
        amount === walletBalance &&
        originalCurrency === "GBP" &&
        shouldAnimate
      ) {
        return `${symbol}${displayBalance}`;
      }

      return `${symbol}${convertedAmount.toFixed(2)}`;
    } catch (error) {
      console.error("Error formatting currency:", error);
      return "$0.00";
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
  };

  // Status change handler
  const handleStatusChange = async (index, newStatus) => {
    if (index < 0 || index >= sortedCheques.length) {
      alert("Error: Invalid cheque selection");
      return;
    }

    const cheque = sortedCheques[index];
    if (!cheque) {
      alert("Error: Cheque not found in local data");
      return;
    }

    const validChequeId = cheque.id;
    const originalStatus = cheque.status;

    if (!validChequeId || validChequeId <= 0) {
      alert("Error: Invalid cheque ID");
      return;
    }

    // Optimistic update
    const updatedCheques = recentCheques.map((c) =>
      c.id === validChequeId ? { ...c, status: newStatus } : c
    );
    setRecentCheques(updatedCheques);

    // API call
    try {
      const response = await axios.put(
        `${URL}/api/cheques/update-status/${validChequeId}`,
        { new_status: newStatus, user_id: userid },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (response.status === 200) {
        console.log("✅ Status updated successfully");
        // Update cache
        storage.setPageData("dashboard", {
          balance: walletBalance,
          cheques: updatedCheques,
          stats: getChequeStatus,
          last_updated: new Date().toISOString(),
        });
      }
    } catch (error) {
      // Rollback on error
      const rolledBackCheques = recentCheques.map((c) =>
        c.id === validChequeId ? { ...c, status: originalStatus } : c
      );
      setRecentCheques(rolledBackCheques);
      alert(
        `Failed to update status: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Simple Balance Component (no animation for normal display)
  const BalanceDisplay = ({ value, isCurrency = false, className = "" }) => {
    return (
      <span className={className}>
        {isCurrency
          ? `${currencies[currency]?.symbol || "$"}${formatCurrencyValue(
              value
            )}`
          : value}
      </span>
    );
  };

  // Chart Component for Money Flow Analytics
  const MoneyFlowChart = () => {
    const maxAmount = Math.max(
      ...depositData.map((d) => d.amount),
      ...spendingData.map((d) => d.amount)
    );

    const formatDateLabel = (dateStr) => {
      const date = new Date(dateStr);
      if (chartTimeRange === "7d") {
        return date.toLocaleDateString("en-US", { weekday: "short" });
      } else if (chartTimeRange === "30d") {
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        });
      } else {
        return `Week ${Math.floor(
          (new Date().getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000)
        )}`;
      }
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Money Flow Analytics
          </h2>
          <div className="flex space-x-2">
            {["7d", "30d", "90d"].map((range) => (
              <button
                key={range}
                onClick={() => setChartTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  chartTimeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deposits Chart */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Money Received
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {currencies[currency]?.symbol || "$"}
                  {depositData
                    .reduce((sum, day) => sum + day.amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {depositData.reduce((sum, day) => sum + day.count, 0)}{" "}
                  deposits
                </p>
              </div>
            </div>

            <div className="h-48 relative">
              <div className="absolute inset-0 flex items-end justify-between space-x-1">
                {depositData.map((day, index) => {
                  const height = (day.amount / maxAmount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${formatDateLabel(day.date)}: ${
                          currencies[currency]?.symbol || "$"
                        }${day.amount}`}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">
                        {formatDateLabel(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Spending Chart */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-800 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Money Spent
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">
                  {currencies[currency]?.symbol || "$"}
                  {spendingData
                    .reduce((sum, day) => sum + day.amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  {spendingData.reduce((sum, day) => sum + day.count, 0)}{" "}
                  transactions
                </p>
              </div>
            </div>

            <div className="h-48 relative">
              <div className="absolute inset-0 flex items-end justify-between space-x-1">
                {spendingData.map((day, index) => {
                  const height = (day.amount / maxAmount) * 100;
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-600 hover:to-red-500"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${formatDateLabel(day.date)}: ${
                          currencies[currency]?.symbol || "$"
                        }${day.amount}`}
                      ></div>
                      <span className="text-xs text-gray-500 mt-2">
                        {formatDateLabel(day.date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {currencies[currency]?.symbol || "$"}
              {depositData
                .reduce((sum, day) => sum + day.amount, 0)
                .toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Received</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {currencies[currency]?.symbol || "$"}
              {spendingData
                .reduce((sum, day) => sum + day.amount, 0)
                .toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Spent</p>
          </div>
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${
                depositData.reduce((sum, day) => sum + day.amount, 0) -
                  spendingData.reduce((sum, day) => sum + day.amount, 0) >=
                0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {currencies[currency]?.symbol || "$"}
              {Math.abs(
                depositData.reduce((sum, day) => sum + day.amount, 0) -
                  spendingData.reduce((sum, day) => sum + day.amount, 0)
              ).toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">
              {depositData.reduce((sum, day) => sum + day.amount, 0) -
                spendingData.reduce((sum, day) => sum + day.amount, 0) >=
              0
                ? "Net Gain"
                : "Net Loss"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && initialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            Loading your financial dashboard...
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
              Financial Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome to your cheque processing hub
            </p>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center space-x-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3">
            <span className="text-sm font-medium text-gray-600">Currency:</span>
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Wallet Balance Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold opacity-90">
                Wallet Balance
              </h3>
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold mb-2 font-mono tracking-tight">
              {shouldAnimate ? (
                `${currencies[currency]?.symbol || "$"}${displayBalance}`
              ) : (
                <BalanceDisplay value={walletBalance} isCurrency={true} />
              )}
            </p>
            <p className="text-blue-100 text-sm">Available balance</p>
          </div>

          {/* Total Cheques Card */}
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
              {displayStats.total || 0}
            </p>
            <p className="text-gray-500 text-sm">All processed cheques</p>
          </div>

          {/* Pending Cheques Card */}
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
              {displayStats.pending || 0}
            </p>
            <p className="text-gray-500 text-sm">Awaiting processing</p>
          </div>

          {/* Processed Cheques Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Processed</h3>
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
              {(displayStats.processed || 0) + (displayStats.approved || 0)}
            </p>
            <p className="text-gray-500 text-sm">Successfully processed</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { key: "needs_review", label: "Needs Review", color: "orange" },
            { key: "processing", label: "Processing", color: "blue" },
            { key: "rejected", label: "Rejected", color: "red" },
            { key: "failed", label: "Failed", color: "rose" },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center"
            >
              <p
                className={`text-2xl font-bold text-${color}-600 mb-1 font-mono`}
              >
                {displayStats[key] || 0}
              </p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Money Flow Analytics Charts */}
        <MoneyFlowChart />

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/upload"
              className="flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Upload New Cheque</span>
            </Link>
            <Link
              to="/wallet"
              className="flex items-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
              <span>View Wallet</span>
            </Link>
            <button
              onClick={() => {
                setLoading(true);
                fetchDashboardData();
              }}
              className="flex items-center space-x-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
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
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Recent Cheques */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Recent Cheques
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                Displaying in {currencies[currency]?.name || "British Pound"}
              </span>
            </div>
          </div>

          {sortedCheques.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-300 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No cheques processed yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start by uploading your first cheque
              </p>
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
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("amount")}
                    >
                      Amount {getSortIndicator("amount")}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("currency")}
                    >
                      Currency {getSortIndicator("currency")}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("payer_name")}
                    >
                      Payer {getSortIndicator("payer_name")}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      Status {getSortIndicator("status")}
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("created_at")}
                    >
                      Date {getSortIndicator("created_at")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedCheques.map((cheque, index) => (
                    <tr
                      key={cheque.id || `cheque-${index}`}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          id="row_column"
                          name={cheque.id || index}
                        >{cheque.id || index}</div>
                        <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors font-mono">
                          {formatCurrency(
                            cheque.amount || 0,
                            cheque.currency || "GBP"
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {cheque.currency || "GBP"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {cheque.payer_name || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-1 transition-all duration-200 cursor-pointer"
                          value={cheque.status || "pending"}
                          onChange={(e) =>
                            handleStatusChange(index, e.target.value)
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="needs_review">Needs Review</option>
                          <option value="processing">Processing</option>
                          <option value="processed">Processed</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="failed">Failed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {cheque.created_at
                            ? new Date(cheque.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )
                            : "Date N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
