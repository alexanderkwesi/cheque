import React, { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import storage from "../components/storage.js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(
  "pk_test_51SW1fMAzg22IlGNuMiRSk4lIU0LmIC1MGeUGDuDoTC71gICiGeK81AA1eRAGRXXjhS1pEHDI4zlnq8jgfe7dbXvY00GNE2kbPo"
);

const URL = "http://localhost:5000" || "http://127.0.0.1:5000";
const BASE_URL = "http://localhost:5001" || "http://127.0.0.1:5001";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [displayBalance, setDisplayBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "",
    sortCode: "",
    accountName: "",
  });
  const [stripeLoading, setStripeLoading] = useState(false);



  const navigate = useNavigate();



  // Get user data from localStorage (same as Dashboard.js)
  const userDataStr = localStorage.getItem("user");
  const userData = userDataStr ? JSON.parse(userDataStr) : null;
  const [userid, setUserid] = useState(userData?.id || 0);
  const [token, setToken] = useState(
    storage.getToken() || userData?.token || null
  );

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

  // Mock exchange rates (same as Dashboard.js)
  const exchangeRates = {
    GBP: 1.0,
    USD: 1.27,
    EUR: 1.17,
    CAD: 1.72,
    AUD: 1.94,
    JPY: 188.42,
    INR: 105.67,
  };

  // Animated counter
  const animateValue = (start, end, duration, setter) => {
    const startTimestamp = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      setter(value);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  useEffect(() => {
    loadUserData();
    fetchWalletData();
    loadCachedData();
    checkForStripeReturn();
  }, []);

  const loadUserData = () => {
    const userId = userData?.id || storage.getUserId() || 0;
    setUserid(userId);
  };

  const loadCachedData = () => {
    const cachedBalance = storage.getPageData("wallet_balance");
    const cachedTransactions = storage.getPageData("wallet_transactions");

    if (cachedBalance) {
      setBalance(cachedBalance.balance || 0);
      setDisplayBalance(cachedBalance.balance || 0);
    }

    if (cachedTransactions) {
      setTransactions(cachedTransactions.transactions || []);
    }
  };

  // Calculate balance from processed cheques (same logic as Dashboard.js)
  const calculateBalanceFromCheques = (cheques) => {
    if (!cheques || !Array.isArray(cheques)) return 0;

    return cheques.reduce((total, cheque) => {
      // Only count processed and approved cheques
      if (cheque.status === "processed" || cheque.status === "approved") {
        const amount = Number(cheque.amount) || 0;
        return total + amount;
      }
      return total;
    }, 0);
  };

  // Fetch wallet data using the same logic as Dashboard.js
  const fetchWalletData = async () => {
    if (!token) {
      setError("Please log in to view wallet");
      setLoading(false);
      return;
    }

    try {
      // Use the same endpoint as Dashboard.js to get user cheques
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
        const chequesData = response.data.cheques || [];

        // Calculate balance from processed cheques
        const calculatedBalance = calculateBalanceFromCheques(chequesData);

        setBalance(calculatedBalance);
        animateValue(
          displayBalance,
          calculatedBalance,
          1500,
          setDisplayBalance
        );

        // Convert cheques to transaction format
        const transactionData = chequesData.map((cheque) => ({
          id: cheque.id,
          type: "cheque_deposit",
          amount: cheque.amount,
          description: `Cheque from ${cheque.payer_name || "Unknown Payer"}`,
          status: cheque.status,
          date: cheque.created_at,
          currency: cheque.currency || "GBP",
        }));

        setTransactions(transactionData);

        // Cache the data
        storage.setPageData("wallet_balance", {
          balance: calculatedBalance,
          last_updated: new Date().toISOString(),
        });
        storage.setPageData("wallet_transactions", {
          transactions: transactionData,
          last_updated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setError("Failed to load wallet data. Using cached data if available.");

      // Try to use cached dashboard data as fallback
      const cachedDashboard = storage.getPageData("dashboard");
      if (cachedDashboard && cachedDashboard.balance) {
        setBalance(cachedDashboard.balance);
        setDisplayBalance(cachedDashboard.balance);
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if returning from Stripe checkout
  const checkForStripeReturn = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");

    if (sessionId) {
      try {
        setStripeLoading(true);
        const response = await axios.get(
          `${BASE_URL}/api/session-status?session_id=${sessionId}`
        );
        const {
          status,
          payment_status,
          amount_total,
          currency: paymentCurrency,
        } = response.data;

        if (payment_status === "paid") {
          // Payment was successful - update wallet
          const user = storage.getUser();
          const token = storage.getToken();

          if (user && token) {
            // For Stripe deposits, we'll create a mock cheque entry
            // This ensures the balance calculation remains consistent
            const mockCheque = {
              id: `stripe_${Date.now()}`,
              amount: amount_total / 100,
              currency: paymentCurrency.toUpperCase(),
              payer_name: "Stripe Payment",
              status: "processed",
              created_at: new Date().toISOString(),
            };

            // Refresh wallet data to include the new "cheque"
            await fetchWalletData();

            // Add transaction to local state
            const newTransaction = {
              id: `stripe_${sessionId}`,
              type: "deposit",
              amount: amount_total / 100,
              description: "Stripe Deposit",
              status: "completed",
              date: new Date().toISOString(),
              currency: paymentCurrency.toUpperCase(),
            };

            const updatedTransactions = [newTransaction, ...transactions];
            setTransactions(updatedTransactions);

            // Update cache
            storage.setPageData("wallet_transactions", {
              transactions: updatedTransactions,
              last_updated: new Date().toISOString(),
            });

            alert(
              `Successfully deposited ${formatCurrency(
                amount_total / 100,
                paymentCurrency.toUpperCase()
              )}!`
            );
          }
        }

        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (error) {
        console.error("Error processing Stripe return:", error);
        alert("Error processing payment. Please check your wallet balance.");
      } finally {
        setStripeLoading(false);
      }
    }
  };

  // Convert amount to selected currency (same as Dashboard.js)
  const convertAmount = (amount, fromCurrency = "GBP") => {
    if (fromCurrency === currency) return amount;
    const amountInGBP = amount / exchangeRates[fromCurrency];
    return amountInGBP * exchangeRates[currency];
  };

  // Format currency display (same as Dashboard.js)
  const formatCurrency = (amount, originalCurrency = "GBP") => {
    const convertedAmount = convertAmount(amount, originalCurrency);
    return `${currencies[currency]?.symbol || "$"}${convertedAmount.toFixed(
      2
    )}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stripe Deposit Handler using BASE_URL
  const handleStripeDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    const user = storage.getUser();
    if (!user) {
      alert("Please log in to make a deposit");
      return;
    }

    setStripeLoading(true);

    try {
      // Create checkout session with Stripe server using BASE_URL
      const response = await axios.post(
        `${BASE_URL}/api/create-checkout-session`,
        {
          amount: parseFloat(depositAmount),
          currency: currency.toLowerCase(),
          user_id: user.id,
        }
      );

      const { clientSecret } = response.data;

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({
        sessionId: clientSecret,
      });

      if (error) {
        console.error("Stripe error:", error);
        alert("Payment failed: " + error.message);
      }
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Deposit failed. Please try again.");
    } finally {
      setStripeLoading(false);
      setDepositAmount("");
      setShowDepositModal(false);
    }
  };

  // Manual deposit using BASE_URL wallet deposit endpoint
  const handleManualDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    const user = storage.getUser();
    const token = storage.getToken();

    if (!user || !token) {
      alert("Please log in to make a deposit");
      return;
    }

    try {
      // Use BASE_URL for manual deposits
      const response = await axios.post(
        `${BASE_URL}/api/wallet/deposit`,
        {
          amount: parseFloat(depositAmount),
          currency: currency,
          user_id: user.id,
          source: "manual",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Create a cheque entry to maintain consistency with Dashboard.js
        const chequeResponse = await axios.post(
          `${URL}/api/cheques/create`,
          {
            amount: parseFloat(depositAmount),
            currency: currency,
            payer_name: "Manual Deposit",
            status: "processed",
            user_id: user.id,
            payer_account: "MANUAL_DEPOSIT",
            payer_sort_code: "00-00-00",
            recipient_name: user.name || "User",
            recipient_account: "WALLET_ACCOUNT",
            memo: "Manual wallet deposit",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Refresh wallet data to get updated balance
        await fetchWalletData();

        // Add transaction to local state
        const newTransaction = {
          id: Date.now(),
          type: "deposit",
          amount: parseFloat(depositAmount),
          description: "Manual Deposit",
          status: "completed",
          date: new Date().toISOString(),
          currency: currency,
        };

        const updatedTransactions = [newTransaction, ...transactions];
        setTransactions(updatedTransactions);

        // Update cache
        storage.setPageData("wallet_transactions", {
          transactions: updatedTransactions,
          last_updated: new Date().toISOString(),
        });

        setDepositAmount("");
        setShowDepositModal(false);

        // Notify dashboard of balance update
        window.dispatchEvent(new Event("balanceUpdated"));

        alert("Deposit successful!");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      alert("Deposit failed. Please try again.");
    }
  };

  // Withdraw using BASE_URL wallet withdrawal endpoint
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid withdrawal amount");
      return;
    }

    if (parseFloat(withdrawAmount) > balance) {
      alert("Insufficient balance for withdrawal");
      return;
    }

    if (
      !bankDetails.accountNumber ||
      !bankDetails.sortCode ||
      !bankDetails.accountName
    ) {
      alert("Please fill in all bank details");
      return;
    }

    const user = storage.getUser();
    const token = storage.getToken();

    if (!user || !token) {
      alert("Please log in to make a withdrawal");
      return;
    }

    try {
      // Use BASE_URL for withdrawals
      const response = await axios.post(
        `${BASE_URL}/api/wallet/withdraw`,
        {
          amount: parseFloat(withdrawAmount),
          currency: currency,
          bankDetails: bankDetails,
          user_id: user.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Create a negative cheque entry to maintain consistency with Dashboard.js
        const chequeResponse = await axios.post(
          `${URL}/api/cheques/create`,
          {
            amount: -parseFloat(withdrawAmount),
            currency: currency,
            payer_name: "Withdrawal",
            status: "processed",
            user_id: user.id,
            payer_account: "WITHDRAWAL",
            payer_sort_code: "00-00-00",
            recipient_name: bankDetails.accountName,
            recipient_account: bankDetails.accountNumber,
            memo: `Withdrawal to bank account ${bankDetails.accountNumber}`,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Refresh wallet data to get updated balance
        await fetchWalletData();

        const newTransaction = {
          id: Date.now(),
          type: "withdrawal",
          amount: -parseFloat(withdrawAmount),
          description: `Bank Transfer to ${bankDetails.accountName}`,
          status: "pending",
          date: new Date().toISOString(),
          currency: currency,
        };

        const updatedTransactions = [newTransaction, ...transactions];
        setTransactions(updatedTransactions);

        // Update cache
        storage.setPageData("wallet_transactions", {
          transactions: updatedTransactions,
          last_updated: new Date().toISOString(),
        });

        setWithdrawAmount("");
        setBankDetails({ accountNumber: "", sortCode: "", accountName: "" });
        setShowWithdrawModal(false);

        // Notify dashboard of balance update
        window.dispatchEvent(new Event("balanceUpdated"));

        alert("Withdrawal request submitted successfully!");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Withdrawal failed. Please try again.");
    }
  };

  // Confirm deposit after Stripe payment (for webhook simulation)
  const confirmDeposit = async (paymentIntentId, amount, paymentCurrency) => {
    try {
      const user = storage.getUser();
      const token = storage.getToken();

      if (!user || !token) {
        console.error("User not authenticated for deposit confirmation");
        return;
      }

      // Confirm deposit with BASE_URL
      const response = await axios.post(
        `${BASE_URL}/api/wallet/confirm-deposit`,
        {
          user_id: user.id,
          payment_intent_id: paymentIntentId,
          amount: amount,
          currency: paymentCurrency,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        // Create cheque entry for consistency
        await axios.post(
          `${URL}/api/cheques/create`,
          {
            amount: amount,
            currency: paymentCurrency,
            payer_name: "Stripe Payment",
            status: "processed",
            user_id: user.id,
            payer_account: "STRIPE_PAYMENT",
            payer_sort_code: "00-00-00",
            recipient_name: user.name || "User",
            recipient_account: "WALLET_ACCOUNT",
            memo: "Stripe payment deposit",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // Refresh data
        await fetchWalletData();
        console.log("Deposit confirmed successfully");
      }
    } catch (error) {
      console.error("Error confirming deposit:", error);
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
  };

  const refreshData = () => {
    setLoading(true);
    fetchWalletData();
  };

  if (loading || stripeLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            {stripeLoading ? "Processing payment..." : "Loading your wallet..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Digital Wallet
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your funds and transactions
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={refreshData}
              className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300 border border-gray-200 font-medium"
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

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white mb-8 transform hover:scale-105 transition-transform duration-500">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold opacity-90 mb-2">
                Current Balance
              </h2>
              <p className="text-5xl font-bold tracking-tight">
                {formatCurrency(displayBalance)}
              </p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-2xl">
              <svg
                className="w-8 h-8"
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
          <p className="text-blue-100 text-lg font-medium">
            Available in {currencies[currency]?.name || "British Pound"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => setShowDepositModal(true)}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 border border-green-100 hover:border-green-300 group"
          >
            <div className="bg-green-50 p-3 rounded-xl inline-block mb-4 group-hover:bg-green-100 transition-colors">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div className="text-green-600 text-xl font-semibold mb-2">
              Deposit
            </div>
            <div className="text-gray-600 text-sm">Add funds to wallet</div>
          </button>

          <button
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 group"
          >
            <div className="bg-blue-50 p-3 rounded-xl inline-block mb-4 group-hover:bg-blue-100 transition-colors">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div className="text-blue-600 text-xl font-semibold mb-2">
              Withdraw
            </div>
            <div className="text-gray-600 text-sm">Transfer to bank</div>
          </button>

          <button
            onClick={() => navigate("/upload")}
            className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-all duration-300 border border-purple-100 hover:border-purple-300 group"
          >
            <div className="bg-purple-50 p-3 rounded-xl inline-block mb-4 group-hover:bg-purple-100 transition-colors">
              <svg
                className="w-8 h-8 text-purple-600"
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
            <div className="text-purple-600 text-xl font-semibold mb-2">
              Cash Cheque
            </div>
            <div className="text-gray-600 text-sm">Upload cheque</div>
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">
              Transaction History
            </h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                Amounts in {currencies[currency]?.name || "British Pound"}
              </span>
              <button
                onClick={refreshData}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="p-6 bg-red-50 text-red-700 border-b border-red-100">
              {error}
              <button
                onClick={refreshData}
                className="ml-2 text-sm underline font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          <div className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-300 text-6xl mb-4">💸</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No transactions yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start by depositing funds or cashing a cheque!
                </p>
                <div className="space-x-3">
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
                  >
                    Deposit Funds
                  </button>
                  <button
                    onClick={() => (window.location.href = "/upload")}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Cash a Cheque
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {transaction.description}
                          </div>
                          <div className="text-xs text-gray-500 capitalize font-medium">
                            {transaction.type?.replace("_", " ")}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(transaction.date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className={`text-lg font-bold ${
                              transaction.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {formatCurrency(
                              Math.abs(transaction.amount),
                              transaction.currency
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                              transaction.status === "completed" ||
                              transaction.status === "processed"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : "bg-red-100 text-red-800 border border-red-200"
                            }`}
                          >
                            {transaction.status}
                          </span>
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

      {/* Updated Deposit Modal with Stripe */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">
              Deposit Funds
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amount ({currencies[currency]?.symbol || "$"})
              </label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                min="0"
                step="0.01"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                💳 <strong>Secure Payment:</strong> You'll be redirected to
                Stripe for secure payment processing.
              </p>
            </div>

            <div className="flex space-x-4 mb-4">
              <button
                onClick={handleStripeDeposit}
                disabled={stripeLoading}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition duration-200 font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {stripeLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ${
                    depositAmount
                      ? formatCurrency(parseFloat(depositAmount))
                      : ""
                  }`
                )}
              </button>
            </div>

            <div className="border-t pt-4">
              <button
                onClick={handleManualDeposit}
                className="w-full bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition duration-200 font-semibold"
              >
                Manual Deposit (Test)
              </button>
            </div>

            <div className="flex space-x-4 mt-4">
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-400 transition duration-200 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-semibold mb-6 text-gray-800">
              Withdraw to Bank
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Amount ({currencies[currency]?.symbol || "$"})
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                min="0"
                step="0.01"
                max={balance}
              />
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Available: {formatCurrency(balance)}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) =>
                    setBankDetails((prev) => ({
                      ...prev,
                      accountName: e.target.value,
                    }))
                  }
                  placeholder="John Doe"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Number
                </label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails((prev) => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                  placeholder="12345678"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sort Code
                </label>
                <input
                  type="text"
                  value={bankDetails.sortCode}
                  onChange={(e) =>
                    setBankDetails((prev) => ({
                      ...prev,
                      sortCode: e.target.value,
                    }))
                  }
                  placeholder="12-34-56"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleWithdraw}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition duration-200 font-semibold text-lg"
              >
                Withdraw{" "}
                {withdrawAmount
                  ? formatCurrency(parseFloat(withdrawAmount))
                  : ""}
              </button>
              <button
                onClick={() => setShowWithdrawModal(false)}
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

export default Wallet;
