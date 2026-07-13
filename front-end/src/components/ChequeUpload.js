import React, { useState, useEffect } from "react";
import axios from "axios";
import storage from "../components/storage.js";

const ChequeUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [ocrData, setOcrData] = useState(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [extractionInProgress, setExtractionInProgress] = useState(false);

  // Cheque form fields
  const [chequeData, setChequeData] = useState({
    cheque_number: "",
    amount: "",
    currency: "USD",
    drawer_name: "",
    drawer_account: "",
    payee_name: "",
    bank_name: "",
    branch_code: "",
    cheque_date: "",
    routing_number: "",
    account_number: "",
    memo: "",
  });

  // Currency compatibility function
  const isCurrencyCompatible = (currency) => {
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

  useEffect(() => {
    const handleResize = () => {};
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setMessage("");
      setOcrData(null);
      setShowManualForm(false);
      setExtractionInProgress(true);

      // Auto-extract data using OCR
      await extractDataWithOCR(file);
      setExtractionInProgress(false);
    }
  };

  const extractDataWithOCR = async (file) => {
    setMessage("Extracting data from cheque image...");

    const user = storage.getUser();
    const token = storage.getToken();

    if (!user || !token) {
      setMessage("Please log in to process cheques");
      return;
    }

    const formData = new FormData();
    formData.append("cheque_image", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/cheque/extract",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setOcrData(response.data.data);

        // Auto-fill form with OCR data
        if (response.data.data) {
          const ocr = response.data.data;
          setChequeData((prev) => ({
            ...prev,
            cheque_number: ocr.cheque_number || "",
            amount: ocr.amount || "",
            currency: ocr.currency || "USD",
            drawer_name: ocr.drawer_name || "",
            drawer_account: ocr.drawer_account || "",
            payee_name: ocr.payee_name || "",
            bank_name: ocr.bank_name || "",
            branch_code: ocr.branch_code || "",
            cheque_date: ocr.cheque_date || "",
            routing_number: ocr.routing_number || "",
            account_number: ocr.account_number || "",
            memo: ocr.memo || "",
          }));
        }

        setMessage(
          `Data extracted successfully! Confidence: ${(
            response.data.data.confidence_score * 100
          ).toFixed(1)}%`
        );
      } else {
        setMessage("OCR extraction failed. Please enter details manually.");
        setShowManualForm(true);
      }
    } catch (error) {
      console.error("OCR extraction error:", error);
      setMessage("OCR service unavailable. Please enter details manually.");
      setShowManualForm(true);
    }
  };

  const handleInputChange = (field, value) => {
    setChequeData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    const required = [
      "cheque_number",
      "amount",
      "drawer_name",
      "payee_name",
      "cheque_date",
    ];

    for (let field of required) {
      if (!chequeData[field]?.trim()) {
        setMessage(`Please fill in ${field.replace("_", " ")}`);
        return false;
      }
    }

    if (!isCurrencyCompatible(chequeData.currency)) {
      setMessage(`Currency ${chequeData.currency} is not supported`);
      return false;
    }

    if (
      isNaN(parseFloat(chequeData.amount)) ||
      parseFloat(chequeData.amount) <= 0
    ) {
      setMessage("Please enter a valid amount");
      return false;
    }

    // Validate cheque date is not in the future
    const chequeDate = new Date(chequeData.cheque_date);
    const today = new Date();
    if (chequeDate > today) {
      setMessage("Cheque date cannot be in the future");
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a cheque image");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setUploading(true);
    setMessage("");

    const user = storage.getUser();
    const token = storage.getToken();

    if (!user || !token) {
      setMessage("Please log in to upload cheques");
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("cheque_image", selectedFile);
    formData.append("user_id", user.id);

    // Append all cheque data
    Object.keys(chequeData).forEach((key) => {
      if (chequeData[key]) {
        formData.append(key, chequeData[key]);
      }
    });

    try {
      const response = await axios.post(
        "http://localhost:5000/api/cheque/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Store cheque data locally
      const newCheque = {
        id: response.data.cheque_id || Date.now(),
        ...chequeData,
        amount: parseFloat(chequeData.amount),
        status: response.data.status || "pending",
        created_at: new Date().toISOString(),
        image_url: previewUrl,
        confidence_score: ocrData?.confidence_score || 0,
      };

      // Store in localStorage for offline access
      const existingCheques = storage.getPageData("cheques") || [];
      const updatedCheques = [newCheque, ...existingCheques];
      storage.setPageData("cheques", updatedCheques);

      setMessage("Cheque uploaded successfully! Processing...");

      // Reset form
      setSelectedFile(null);
      setPreviewUrl("");
      setOcrData(null);
      setShowManualForm(false);
      setChequeData({
        cheque_number: "",
        amount: "",
        currency: "USD",
        drawer_name: "",
        drawer_account: "",
        payee_name: "",
        bank_name: "",
        branch_code: "",
        cheque_date: "",
        routing_number: "",
        account_number: "",
        memo: "",
      });

      // Update dashboard data
      setTimeout(() => {
        window.dispatchEvent(new Event("chequeUploaded"));
      }, 1000);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage(error.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const toggleManualForm = () => {
    setShowManualForm(!showManualForm);
  };

  const clearForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setOcrData(null);
    setShowManualForm(false);
    setMessage("");
    setChequeData({
      cheque_number: "",
      amount: "",
      currency: "USD",
      drawer_name: "",
      drawer_account: "",
      payee_name: "",
      bank_name: "",
      branch_code: "",
      cheque_date: "",
      routing_number: "",
      account_number: "",
      memo: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-6xl w-full">
        {/* Header Card */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Upload Cheque
            </h1>
            <p className="text-gray-600 text-lg">
              Upload your cheque image and enter the details manually or use OCR
              extraction
            </p>
          </div>
        </div>

        {/* Main Upload Card */}
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 w-full max-w-4xl">
            {/* File Upload Section */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-800 mb-4">
                Cheque Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors duration-300">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={extractionInProgress}
                />
                <label
                  htmlFor="file-upload"
                  className={`cursor-pointer flex flex-col items-center justify-center ${
                    extractionInProgress ? "opacity-50" : ""
                  }`}
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    {extractionInProgress ? (
                      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
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
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-gray-600 font-medium mb-2">
                    {extractionInProgress
                      ? "Extracting data..."
                      : "Click to upload cheque image"}
                  </span>
                  <span className="text-sm text-gray-500">
                    PNG, JPG, JPEG up to 10MB
                  </span>
                </label>
              </div>
            </div>

            {/* Preview Section */}
            {previewUrl && (
              <div className="mb-8">
                <label className="block text-lg font-semibold text-gray-800 mb-4">
                  Cheque Preview
                </label>
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Cheque preview"
                    className="max-w-full max-h-80 object-contain rounded-lg mx-auto shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* OCR Status */}
            {ocrData && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-green-600"
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
                  <div>
                    <span className="text-green-800 font-medium">
                      Data extracted successfully!
                    </span>
                    <span className="text-green-700 text-sm ml-2">
                      Confidence: {(ocrData.confidence_score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Manual Form Toggle */}
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Cheque Details
              </h3>
              <div className="flex space-x-3">
                <button
                  onClick={toggleManualForm}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {showManualForm ? "Hide Manual Form" : "Show Manual Entry"}
                </button>
                <button
                  onClick={clearForm}
                  className="text-gray-600 hover:text-gray-700 font-medium text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Cheque Details Form - Always show when file is selected */}
            {(showManualForm || ocrData || selectedFile) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 border-b pb-2">
                    Basic Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cheque Number *
                    </label>
                    <input
                      type="text"
                      value={chequeData.cheque_number}
                      onChange={(e) =>
                        handleInputChange("cheque_number", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter cheque number"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={chequeData.amount}
                        onChange={(e) =>
                          handleInputChange("amount", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency *
                      </label>
                      <select
                        value={chequeData.currency}
                        onChange={(e) =>
                          handleInputChange("currency", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="CAD">CAD</option>
                        <option value="AUD">AUD</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cheque Date *
                    </label>
                    <input
                      type="date"
                      value={chequeData.cheque_date}
                      onChange={(e) =>
                        handleInputChange("cheque_date", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Memo
                    </label>
                    <input
                      type="text"
                      value={chequeData.memo}
                      onChange={(e) =>
                        handleInputChange("memo", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Optional memo"
                    />
                  </div>
                </div>

                {/* Bank & Account Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 border-b pb-2">
                    Bank Information
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drawer Name *
                    </label>
                    <input
                      type="text"
                      value={chequeData.drawer_name}
                      onChange={(e) =>
                        handleInputChange("drawer_name", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Person/company issuing cheque"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payee Name *
                    </label>
                    <input
                      type="text"
                      value={chequeData.payee_name}
                      onChange={(e) =>
                        handleInputChange("payee_name", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Person/company receiving cheque"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={chequeData.bank_name}
                      onChange={(e) =>
                        handleInputChange("bank_name", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Bank name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Branch Code
                      </label>
                      <input
                        type="text"
                        value={chequeData.branch_code}
                        onChange={(e) =>
                          handleInputChange("branch_code", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Branch code"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Routing Number
                      </label>
                      <input
                        type="text"
                        value={chequeData.routing_number}
                        onChange={(e) =>
                          handleInputChange("routing_number", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Routing number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={chequeData.account_number}
                      onChange={(e) =>
                        handleInputChange("account_number", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Drawer Account
                    </label>
                    <input
                      type="text"
                      value={chequeData.drawer_account}
                      onChange={(e) =>
                        handleInputChange("drawer_account", e.target.value)
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Drawer account number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || extractionInProgress}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 font-semibold text-lg shadow-lg"
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing Cheque...</span>
                </div>
              ) : (
                "Upload Cheque"
              )}
            </button>

            {/* Message Display */}
            {message && (
              <div
                className={`mt-6 p-4 rounded-xl border ${
                  message.includes("successfully") ||
                  message.includes("extracted")
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                } transition-all duration-300`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      message.includes("successfully") ||
                      message.includes("extracted")
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {message.includes("successfully") ||
                    message.includes("extracted") ? (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChequeUpload;
