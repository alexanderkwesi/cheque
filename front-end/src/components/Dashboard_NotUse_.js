import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.js";
import storage from "./storage.js";

const URL = "http://localhost:5000" || "http://127.0.0.1:5000";

const Dashboard = () => {
  const userDataStr = localStorage.getItem("user");
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const [selectedChequeId, setSelectedChequeId] = useState("");
  const [userid, setuserid] = useState(userData?.id || 0);
  const [walletBalance, setWalletBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState("0.00");
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
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currency, setCurrency] = useState("GBP");
  const { user } = useAuth();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [chequeDetails, setChequeDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Track previous balance to detect transactions
  const [previousBalance, setPreviousBalance] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Chart data states - now based on real cheque data
  const [depositData, setDepositData] = useState([]);
  const [spendingData, setSpendingData] = useState([]);
  const [chartTimeRange, setChartTimeRange] = useState("7d");

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: "created_at",
    direction: "desc",
  });

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

  //

  // Currency compatibility check function
  const isCurrencyCompatible_not_use = (currency) => {
    if (!currency) return false;

    const compatibleCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "CAD",
      "AUD",
      "JPY",
      "CNY",
      "INR",
      "SGD",
      "HKD",
      "CHF",
      "NZD",
      "MXN",
      "BRL",
    ];

    return compatibleCurrencies.includes(currency.toUpperCase());
  };

  // Alternative version with more detailed checking
  const isCurrencyCompatible = (currency, userCurrency = "USD") => {
    if (!currency) return false;

    const currencyUpper = currency.toUpperCase();
    const userCurrencyUpper = userCurrency.toUpperCase();

    // If currencies match, they're always compatible
    if (currencyUpper === userCurrencyUpper) return true;

    // List of supported currencies for conversion
    const supportedCurrencies = [
      "USD",
      "EUR",
      "GBP",
      "CAD",
      "AUD",
      "JPY",
      "CNY",
      "INR",
      "SGD",
      "HKD",
      "CHF",
      "NZD",
      "MXN",
      "BRL",
    ];

    // Both currencies must be in the supported list
    return (
      supportedCurrencies.includes(currencyUpper) &&
      supportedCurrencies.includes(userCurrencyUpper)
    );
  };

  // Initialize token safely
  const [token, setToken] = useState(
    storage.getToken() || userData?.token || null
  );

  // Enhanced animated counter for money
  const animateMoneyValue = (
    start,
    end,
    duration,
    setter,
    isCurrency = false
  ) => {
    if (Math.abs(start - end) < 0.01) {
      if (isCurrency) {
        setter(formatCurrencyValue(end));
      } else {
        setter(Math.round(end));
      }
      return () => {};
    }

    const startValue =
      typeof start === "number" ? start : parseFloat(start) || 0;
    const endValue = typeof end === "number" ? end : parseFloat(end) || 0;

    const startTimestamp = performance.now();
    let animationFrameId;

    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      let currentValue = startValue + (endValue - startValue) * easeOutQuart;

      if (
        (endValue > startValue && currentValue > endValue) ||
        (endValue < startValue && currentValue < endValue)
      ) {
        currentValue = endValue;
      }

      if (isCurrency) {
        const formattedValue = currentValue.toFixed(2);
        setter(formattedValue);
      } else {
        setter(Math.round(currentValue));
      }

      if (Math.abs(currentValue - endValue) < 0.01 || progress >= 1) {
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

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
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

  // Validate cheque ID
  const isValidChequeId = (chequeId) => {
    return chequeId && chequeId > 0 && typeof chequeId === "number";
  };

  
  // Check if cheque currency matches wallet currency
  const checkCurrencyCompatibility = (chequeCurrency, walletCurrency) => {
    return chequeCurrency === walletCurrency;
  };

  // Process cheque with currency validation
  const processChequeWithCurrencyCheck = async (chequeId, chequeData) => {

    try {
      const token = storage.getToken() || userData?.token;
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Check if cheque currency matches wallet currency
      const isCurrencyCompatible = checkCurrencyCompatibility(
        chequeData.currency || "GBP",
        currency
      );

      if (!isCurrencyCompatible) {
        // Update status to failed in database
        console.log(
          `Currency mismatch for cheque ${chequeId}. Marking as failed.`
        );
        
       
    alert(chequeId, chequeData.status);

        const response = await axios.put(
          `${URL}/api/cheques/update-status/${chequeId}`,
          {
            chequeId: chequeId,
            new_status: chequeData.status || "failed" || 'processed' || 'needs review' || "approved" || "processing" || "pending" || "rejected",
            user_id: userid,
            failure_reason: `Currency mismatch: Cheque is in ${
              chequeData.currency || "GBP"
            } but wallet is in ${currency}` || "verification and compliance issue",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 5000,
          }
        );

        if (response.status === 200) {
          console.log(
            `✅ Cheque ${chequeId} marked as failed due to currency mismatch`
          );

          // Update local state to reflect the failed status
          const updatedCheques = recentCheques.map((c) =>
            c.id === chequeId
              ? {
                  ...c,
                  status:
                    "failed" ||
                    "processed" ||
                    "needs review" ||
                    "approved" ||
                    "processing" ||
                    "pending" ||
                    "rejected",
                }
              : c
          );
          setRecentCheques(updatedCheques);

          // Update stats
          const updatedStats = { ...displayStats };
          if (updatedStats[chequeData.status] > 0) {
            updatedStats[chequeData.status]--;
          }
          updatedStats.failed = (updatedStats.failed || 0) + 1;
          setDisplayStats(updatedStats);

          return {
            success: false,
            message: `Cheque processing failed: Currency mismatch. Cheque is in ${
              chequeData.currency || "GBP"
            } but wallet is in ${currency}`,
          };
        }
      }

      // If currencies match, proceed with normal processing
      console.log(
        `Currency compatible for cheque ${chequeId}. Proceeding with processing.`
      );

      // Here you would add your normal cheque processing logic
      // For example, updating status to processed
      const processResponse = await axios.put(
        `${URL}/api/cheques/process/${chequeId}`,
        { user_id: userid, chequeId:chequeId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (processResponse.status === 200) {
        // Update local state
        const updatedCheques = recentCheques.map((c) =>
          c.id === chequeId ? { ...c, status: "processed" } : c
        );
        setRecentCheques(updatedCheques);

        // Update wallet balance
        const newBalance = walletBalance + (chequeData.amount || 0);
        setWalletBalance(newBalance);
        setDisplayBalance(formatCurrencyValue(newBalance));

        return {
          success: true,
          message: "Cheque processed successfully",
        };
      }
    } catch (error) {
      console.error("Error processing cheque:", error);
      return {
        success: false,
        message: `Processing error: ${
          error.response?.data?.message || error.message
        }`,
      };
    }
  };

  // Generate real-time chart data from processed cheques
  const generateRealTimeChartData = (cheques, timeRange) => {
    const now = new Date();
    let daysToShow = 0;

    switch (timeRange) {
      case "7d":
        daysToShow = 7;
        break;
      case "30d":
        daysToShow = 30;
        break;
      case "90d":
        daysToShow = 90;
        break;
      default:
        daysToShow = 7;
    }

    // Initialize date ranges
    const deposits = [];
    const spending = [];

    // Create date array for the selected time range
    for (let i = daysToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      deposits.push({
        date: dateStr,
        amount: 0,
        count: 0,
      });

      spending.push({
        date: dateStr,
        amount: 0,
        count: 0,
      });
    }

    // Process cheques to populate real data
    cheques.forEach((cheque) => {
      if (!cheque.created_at) return;

      const chequeDate = new Date(cheque.created_at);
      const dateStr = chequeDate.toISOString().split("T")[0];

      // Check if this date is within our chart range
      const chartDate = deposits.find((d) => d.date === dateStr);
      if (!chartDate) return;

      const amount = convertAmount(
        cheque.amount || 0,
        cheque.currency || "GBP"
      );

      // Only count processed and approved cheques as deposits
      if (cheque.status === "processed" || cheque.status === "approved") {
        chartDate.amount += amount;
        chartDate.count += 1;
      }

      // For spending, you might want to track withdrawals or other transactions
      // This is a placeholder - you can implement actual spending logic based on your data
      if (cheque.status === "rejected" || cheque.status === "failed") {
        const spendingDate = spending.find((d) => d.date === dateStr);
        if (spendingDate) {
          // You might want to track fees or other deductions here
          spendingDate.amount += amount * 0.1; // Example: 10% fee for failed transactions
          spendingDate.count += 1;
        }
      }
    });

    return { deposits, spending };
  };

  // Update chart data when cheques or time range changes
  useEffect(() => {
    if (recentCheques.length > 0) {
      const { deposits, spending } = generateRealTimeChartData(
        recentCheques,
        chartTimeRange
      );
      setDepositData(deposits);
      setSpendingData(spending);
    }
  }, [recentCheques, chartTimeRange]);

  // Cheque row click handler - Open modal with details
  const handleChequeClick = async (chequeId, chequeData) => {
    console.log("Cheque clicked - ID:", chequeId, "Data:", chequeData);

    // Validate cheque ID
    if (!isValidChequeId(chequeId)) {
      console.error("Invalid cheque ID:", chequeId);
      alert("Error: Invalid cheque selection - missing or invalid ID");
      return;
    }

    setSelectedChequeId(chequeId);
    setSelectedCheque(chequeData);
    setDetailsLoading(true);
    setDetailsError("");
    setIsModalOpen(true);

    try {
      // Fetch detailed cheque information
      const token = storage.getToken() || userData?.token;
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("Fetching details for cheque ID:", chequeId);
      const response = await axios.get(`${URL}/api/cheques/${chequeId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        setChequeDetails(response.data);
        console.log("Cheque details loaded:", response.data);
      }
    } catch (error) {
      console.error("Error fetching cheque details:", error);
      setDetailsError(
        "Failed to load cheque details. Using basic information."
      );
      // Fallback to basic cheque data
      setChequeDetails({
        ...chequeData,
        additional_info: "Detailed information not available",
      });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCheque(null);
    setChequeDetails(null);
    setDetailsError("");
  };

  // Additional cheque actions
  const handleChequeAction = async (action, chequeId) => {
    // Validate cheque ID
    if (!isValidChequeId(chequeId)) {
      alert("Error: Invalid cheque ID for this action");
      return;
    }

    try {
      const token = storage.getToken() || userData?.token;
      if (!token) {
        throw new Error("No authentication token found");
      }

      switch (action) {
        case "download":
          // Download cheque document
          const response = await axios.get(
            `${URL}/api/cheques/${chequeId}/download`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              responseType: "blob",
            }
          );

          // Create download link
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `cheque-${chequeId}.pdf`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          break;

        case "resend":
          // Resend cheque notification
          await axios.post(
            `${URL}/api/cheques/${chequeId}/resend`,
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          alert("Notification resent successfully!");
          break;

        case "delete":
          if (window.confirm("Are you sure you want to delete this cheque?")) {
            await axios.delete(`${URL}/api/cheques/${chequeId}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            alert("Cheque deleted successfully!");
            closeModal();
            // Refresh the cheques list
            fetchDashboardData();
          }
          break;

        case "process":
          // Process cheque with currency check
          const chequeData = recentCheques.find((c) => c.id === chequeId);
          if (chequeData) {
            const result = await processChequeWithCurrencyCheck(
              chequeId,
              chequeData
            );
            if (result.success) {
              alert("Cheque processed successfully!");
            } else {
              alert(result.message);
            }
          }
          break;

        default:
          console.warn("Unknown action:", action);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      alert(
        `Failed to ${action} cheque: ${
          error.response?.data?.message || error.message
        }`
      );
    }
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
      setPreviousBalance(balance || 0);
      setRecentCheques(cheques || []);
      setDisplayStats(stats || getChequeStatus);
      console.log("Loaded cached dashboard data");
    }
  };

  // Separate function for fallback data
  const setFallbackData = () => {
    const fallbackBalance = 1250.75;
    const fallbackCheques = [
      {
        id: 1001,
        amount: 500.0,
        currency: "GBP",
        payer_name: "ABC Corporation",
        status: "processed",
        created_at: new Date("2024-01-15").toISOString(),
        payer_account: "12345678",
        payer_sort_code: "12-34-56",
        recipient_name: "John Doe",
        recipient_account: "87654321",
        memo: "Invoice payment for Q4 services",
      },
      {
        id: 1002,
        amount: 250.5,
        currency: "USD",
        payer_name: "XYZ Ltd",
        status: "pending",
        created_at: new Date("2024-01-20").toISOString(),
        payer_account: "23456789",
        payer_sort_code: "23-45-67",
        recipient_name: "Jane Smith",
        recipient_account: "98765432",
        memo: "Consulting fees",
      },
      {
        id: 1003,
        amount: 750.0,
        currency: "GBP",
        payer_name: "John Smith",
        status: "approved",
        created_at: new Date("2024-01-10").toISOString(),
        payer_account: "34567890",
        payer_sort_code: "34-56-78",
        recipient_name: "Business Corp",
        recipient_account: "10987654",
        memo: "Equipment purchase",
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

    setWalletBalance(fallbackBalance);
    setPreviousBalance(fallbackBalance);
    setRecentCheques(fallbackCheques);
    setChequeSatus(fallbackStats);
    setDisplayStats(fallbackStats);
    setDisplayBalance(formatCurrencyValue(fallbackBalance));

    storage.setPageData("dashboard", {
      balance: fallbackBalance,
      cheques: fallbackCheques,
      stats: fallbackStats,
      last_updated: new Date().toISOString(),
      source: "fallback",
    });
  };

  const load_userid = () => {
    const userId = user?.id || storage.getUserId() || userData?.id || 0;
    setuserid(userId);
  };

  // Check if there's been a transaction
  const hasTransactionOccurred = (oldBalance, newBalance) => {
    const difference = Math.abs(newBalance - oldBalance);
    return difference > 0.01;
  };

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

        const isTransaction = hasTransactionOccurred(
          previousBalance,
          newBalance
        );

        if (isTransaction && !initialLoad) {
          console.log("Transaction detected - animating balance change");
          setShouldAnimate(true);
          setWalletBalance(newBalance);
          animateMoneyValue(
            previousBalance,
            newBalance,
            1500,
            setDisplayBalance,
            true
          );
        } else {
          console.log("No transaction detected - setting balance directly");
          setWalletBalance(newBalance);
          setDisplayBalance(formatCurrencyValue(newBalance));
          setShouldAnimate(false);
        }

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
        const chequesData = response.data.cheques || [];
        const statusActions = response.data.status_actions || {};

        // Validate cheque IDs in the response
        const validatedCheques = chequesData.map((cheque) => ({
          ...cheque,
          id: isValidChequeId(cheque.id) ? cheque.id : null,
        }));

        setRecentCheques(validatedCheques);
        setChequesCount(validatedCheques.length);
        setDisplayStats(statusActions);
        setChequeSatus(statusActions);

        return validatedCheques;
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

  // Fetch data on mount
  useEffect(() => {
    if (!token) {
      console.log("Token not available, cancel fetch");
      window.location.href = "/login";
      return;
    } else {
      console.log("Token is available, initialize fetch");
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fetchDashboardData, token]);

  // Debug cheque data
  useEffect(() => {
    console.log("Recent cheques data:", recentCheques);
    console.log("Sorted cheques data:", sortedCheques);

    // Check for invalid cheque IDs
    const invalidCheques = recentCheques.filter(
      (cheque) => !isValidChequeId(cheque.id)
    );
    if (invalidCheques.length > 0) {
      console.warn("Found cheques with invalid IDs:", invalidCheques);
    }
  }, [recentCheques, sortedCheques]);

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

  // Status change handler with currency validation
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

    // Get the cheque ID - ensure it's valid
    const validChequeId = cheque.id;
    console.log(
      "Status change - Cheque ID:",
      validChequeId,
      "Index:",
      index,
      "Cheque:",
      cheque
    );

    if (!isValidChequeId(validChequeId)) {
      alert(
        `Error: Invalid cheque ID: ${validChequeId}. Please try refreshing the page.`
      );
      return;
    }

    // Check currency compatibility when changing to processed status
    if (newStatus === "processed") {
      const isCurrencyCompatible = checkCurrencyCompatibility(
        cheque.currency || "GBP",
        currency
      );

      if (!isCurrencyCompatible) {
        alert(
          `Cannot process cheque: Currency mismatch. Cheque is in ${
            cheque.currency || "GBP"
          } but wallet is in ${currency}. Status will be set to failed.`
        );
        newStatus = "failed";
      }
    }

    const originalStatus = cheque.status;

    // Optimistic update
    const updatedCheques = recentCheques.map((c) =>
      c.id === validChequeId ? { ...c, status: newStatus } : c
    );
    setRecentCheques(updatedCheques);

    // API call
    try {
      const response = await axios.put(
        `${URL}/api/cheques/update-status/${validChequeId}`,
        {
          new_status: newStatus,
          user_id: userid,
          ...(newStatus === "failed" &&
            !isCurrencyCompatible && {
              failure_reason: `Currency mismatch: Cheque is in ${
                cheque.currency || "GBP"
              } but wallet is in ${currency}`,
            }),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );

      if (response.status === 200) {
        console.log(
          "✅ Status updated successfully for cheque ID:",
          validChequeId
        );
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

  // Simple Balance Component
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

  // Enhanced Cheque Details Modal Component
  const ChequeDetailsModal = () => {
    if (!isModalOpen) return null;

    const displayData = chequeDetails || selectedCheque;
    const isCurrencyCompatible = displayData
      ? checkCurrencyCompatibility(displayData.currency || "GBP", currency)
      : true;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
            <h2 className="text-2xl font-bold text-gray-800">Cheque Details</h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          </div>

          {/* Modal Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {detailsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading cheque details...</p>
              </div>
            ) : detailsError ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800">{detailsError}</p>
              </div>
            ) : null}

            {displayData && (
              <div className="space-y-6">
                {/* Currency Compatibility Warning */}
                {!isCurrencyCompatible && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <div className="flex items-center">
                      <svg
                        className="w-5 h-5 text-red-600 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <h3 className="text-red-800 font-semibold">
                        Currency Mismatch
                      </h3>
                    </div>
                    <p className="text-red-700 mt-2">
                      This cheque is in {displayData.currency || "GBP"} but your
                      wallet is in {currency}. Processing will fail due to
                      currency incompatibility.
                    </p>
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-blue-600 mb-2">
                      Amount
                    </label>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(
                        displayData.amount || 0,
                        displayData.currency || "GBP"
                      )}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Original:{" "}
                      {currencies[displayData.currency || "GBP"]?.symbol || "$"}
                      {displayData.amount || 0} {displayData.currency || "GBP"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Status
                    </label>
                    <div className="mt-1">
                      <StatusBadge status={displayData.status} />
                    </div>
                    {!isCurrencyCompatible &&
                      displayData.status !== "failed" && (
                        <p className="text-xs text-red-600 mt-2">
                          Will fail if processed due to currency mismatch
                        </p>
                      )}
                  </div>
                </div>

                {/* Payer Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Payer Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Payer Name
                      </label>
                      <p className="text-gray-900 font-medium text-lg">
                        {displayData.payer_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Account Number
                      </label>
                      <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                        {displayData.payer_account || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Sort Code
                      </label>
                      <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                        {displayData.payer_sort_code || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recipient Information */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    Recipient Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Recipient Name
                      </label>
                      <p className="text-gray-900 font-medium text-lg">
                        {displayData.recipient_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Account Number
                      </label>
                      <p className="text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                        {displayData.recipient_account || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Additional Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Date Created
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-900 font-medium">
                          {displayData.created_at
                            ? new Date(
                                displayData.created_at
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Memo / Description
                      </label>
                      <div className="bg-gray-50 rounded-lg p-4 min-h-[80px]">
                        <p className="text-gray-900">
                          {displayData.memo || "No memo provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        handleChequeAction("download", displayData.id)
                      }
                      className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Download Document</span>
                    </button>

                    {isCurrencyCompatible &&
                      displayData.status !== "processed" &&
                      displayData.status !== "failed" && (
                        <button
                          onClick={() =>
                            handleChequeAction("process", displayData.id)
                          }
                          className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Process Cheque</span>
                        </button>
                      )}

                    <button
                      onClick={() =>
                        handleChequeAction("resend", displayData.id)
                      }
                      className="flex items-center space-x-2 bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Resend Notification</span>
                    </button>
                    <button
                      onClick={() =>
                        handleChequeAction("delete", displayData.id)
                      }
                      className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span>Delete Cheque</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Chart Component for Real-time Money Flow Analytics
  const MoneyFlowChart = () => {
    // Calculate totals from real data
    const totalDeposits = depositData.reduce((sum, day) => sum + day.amount, 0);
    const totalSpending = spendingData.reduce(
      (sum, day) => sum + day.amount,
      0
    );
    const netFlow = totalDeposits - totalSpending;

    // Find max amount for chart scaling
    const maxAmount =
      Math.max(
        ...depositData.map((d) => d.amount),
        ...spendingData.map((d) => d.amount)
      ) || 1; // Prevent division by zero

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
        return date.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
        });
      }
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Real-time Money Flow Analytics
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
          {/* Deposits Chart - Real processed cheques */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Money Received
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">
                  {currencies[currency]?.symbol || "$"}
                  {totalDeposits.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {depositData.reduce((sum, day) => sum + day.count, 0)}{" "}
                  processed cheques
                </p>
              </div>
            </div>

            <div className="h-48 relative">
              <div className="absolute inset-0 flex items-end justify-between space-x-1">
                {depositData.map((day, index) => {
                  const height = Math.max((day.amount / maxAmount) * 100, 2); // Minimum 2% height for visibility
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 hover:from-green-600 hover:to-green-500"
                        style={{ height: `${height}%` }}
                        title={`${formatDateLabel(day.date)}: ${
                          currencies[currency]?.symbol || "$"
                        }${day.amount.toFixed(2)} (${day.count} cheques)`}
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

          {/* Spending Chart - Fees and deductions */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border border-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-800 flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                Fees & Deductions
              </h3>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">
                  {currencies[currency]?.symbol || "$"}
                  {totalSpending.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  const height = Math.max((day.amount / maxAmount) * 100, 2);
                  return (
                    <div
                      key={index}
                      className="flex flex-col items-center flex-1"
                    >
                      <div
                        className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all duration-500 hover:from-red-600 hover:to-red-500"
                        style={{ height: `${height}%` }}
                        title={`${formatDateLabel(day.date)}: ${
                          currencies[currency]?.symbol || "$"
                        }${day.amount.toFixed(2)} (${day.count} transactions)`}
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
              {totalDeposits.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-600">Total Processed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {currencies[currency]?.symbol || "$"}
              {totalSpending.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-600">Total Fees</p>
          </div>
          <div className="text-center">
            <p
              className={`text-2xl font-bold ${
                netFlow >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {currencies[currency]?.symbol || "$"}
              {Math.abs(netFlow).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-gray-600">
              {netFlow >= 0 ? "Net Gain" : "Net Loss"}
            </p>
          </div>
        </div>

        {/* Data Source Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Data reflects actual processed cheques and transactions from your
            account
          </p>
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

        {/* Real-time Money Flow Analytics Charts */}
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
                  {sortedCheques.map((cheque, index) => {
                    const isValidCheque = isValidChequeId(cheque.id);
                    const isCurrencyCompatible = checkCurrencyCompatibility(
                      cheque.currency || "GBP",
                      currency
                    );

                    return (
                      <tr
                        key={cheque.id || `cheque-${index}`}
                        className={`hover:bg-gray-50 transition-colors group ${
                          isValidCheque
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-60"
                        } ${
                          !isCurrencyCompatible && cheque.status !== "failed"
                            ? "bg-red-50 hover:bg-red-100"
                            : ""
                        }`}
                        onClick={() =>
                          isValidCheque && handleChequeClick(cheque.id, cheque)
                        }
                        title={
                          !isValidCheque
                            ? "This cheque has an invalid ID and cannot be selected"
                            : !isCurrencyCompatible &&
                              cheque.status !== "failed"
                            ? `Currency mismatch: Cheque is in ${
                                cheque.currency || "GBP"
                              } but wallet is in ${currency}. Processing will fail.`
                            : ""
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors font-mono">
                            {formatCurrency(
                              cheque.amount || 0,
                              cheque.currency || "GBP"
                            )}
                            {!isValidCheque && (
                              <span className="text-xs text-red-500 ml-2">
                                (Invalid ID)
                              </span>
                            )}
                            {!isCurrencyCompatible &&
                              cheque.status !== "failed" && (
                                <span className="text-xs text-red-500 ml-2">
                                  (Currency Mismatch)
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isCurrencyCompatible
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {cheque.currency || "GBP"}
                            {!isCurrencyCompatible && (
                              <svg
                                className="w-3 h-3 ml-1"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {cheque.payer_name || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            className={`text-sm border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded-lg px-3 py-1 transition-all duration-200 ${
                              isValidCheque && isCurrencyCompatible
                                ? "cursor-pointer"
                                : "cursor-not-allowed opacity-50"
                            }`}
                            value={cheque.status || "pending"}
                            onChange={(e) =>
                              isValidCheque &&
                              isCurrencyCompatible &&
                              handleStatusChange(index, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            disabled={!isValidCheque || !isCurrencyCompatible}
                          >
                            <option value="pending">Pending</option>
                            <option value="needs_review">Needs Review</option>
                            <option value="processing">Processing</option>
                            <option value="processed">Processed</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="failed">Failed</option>
                          </select>
                          {!isCurrencyCompatible &&
                            cheque.status !== "failed" && (
                              <p className="text-xs text-red-500 mt-1">
                                Cannot process - currency mismatch
                              </p>
                            )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Cheque Details Modal */}
      <ChequeDetailsModal />
    </div>
  );
};

export default Dashboard;
