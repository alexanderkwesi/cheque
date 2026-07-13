import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-lg">CP</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ChequeProcessor
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a
                  href="#features"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                >
                  How It Works
                </a>
                <a
                  href="#security"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition duration-200"
                >
                  Security
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <div className="pt-10 mx-auto max-w-7xl px-4 sm:pt-12 sm:px-6 md:pt-16 lg:pt-20 lg:px-8 xl:pt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Digital Cheque</span>
                  <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Processing Made Simple
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Streamline your financial operations with our enterprise-grade
                  cheque processing platform. Convert physical cheques to
                  digital funds with unmatched speed, security, and reliability.
                </p>
                <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/register"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 md:py-4 md:text-lg md:px-10 transition duration-200"
                    >
                      Start Processing Cheques
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link
                      to="/login"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 md:py-4 md:text-lg md:px-10 transition duration-200"
                    >
                      Enterprise Demo
                    </Link>
                  </div>
                </div>
                <div className="mt-6 text-sm text-gray-500">
                  Trusted by financial institutions worldwide • SOC 2 Compliant
                  • Bank-grade security
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-blue-50 to-purple-50 sm:h-72 md:h-96 lg:w-full lg:h-full rounded-l-3xl flex items-center justify-center p-8">
            <div className="relative w-full max-w-md">
              {/* Professional Phone Mockup with Dashboard Preview */}
              <div className="relative mx-auto bg-gray-900 rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl border-[14px] border-gray-900 overflow-hidden">
                {/* Camera Bar */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-6 bg-gray-900 rounded-b-2xl z-20 flex justify-center items-center">
                  <div className="w-20 h-1 bg-gray-700 rounded-full"></div>
                </div>

                {/* Screen with Dashboard Preview */}
                <div className="absolute inset-[6px] bg-white rounded-[2rem] overflow-hidden z-10">
                  <div className="h-full bg-gray-50">
                    {/* Dashboard Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">ChequeProcessor</h3>
                        <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                      </div>
                      <p className="text-xs opacity-90 mt-1">Welcome back</p>
                    </div>

                    {/* Dashboard Content */}
                    <div className="p-4">
                      {/* Balance Card */}
                      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 border border-gray-100">
                        <p className="text-xs text-gray-500">
                          Available Balance
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          $12,847.50
                        </p>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button className="bg-blue-50 text-blue-600 rounded-lg p-3 text-xs font-medium">
                          Deposit Cheque
                        </button>
                        <button className="bg-purple-50 text-purple-600 rounded-lg p-3 text-xs font-medium">
                          View History
                        </button>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                        <p className="text-xs font-medium text-gray-900 mb-3">
                          Recent Deposits
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                John Smith Corp
                              </p>
                              <p className="text-xs text-gray-500">
                                2 hours ago
                              </p>
                            </div>
                            <span className="text-green-600 font-semibold">
                              +$2,500.00
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Global Enterprises
                              </p>
                              <p className="text-xs text-gray-500">Yesterday</p>
                            </div>
                            <span className="text-green-600 font-semibold">
                              +$5,000.00
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Power Button */}
                <div className="absolute -right-2 top-32 w-1 h-16 bg-gray-800 rounded-r-md"></div>
                <div className="absolute -right-2 top-52 w-1 h-16 bg-gray-800 rounded-r-md"></div>

                {/* Volume Buttons */}
                <div className="absolute -left-2 top-24 w-1 h-12 bg-gray-800 rounded-l-md"></div>
                <div className="absolute -left-2 top-40 w-1 h-12 bg-gray-800 rounded-l-md"></div>

                {/* Bottom Speaker */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gray-700 rounded-full mb-2"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Enterprise-Grade Cheque Processing
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Designed for businesses and financial institutions requiring
              reliable, secure, and efficient cheque processing solutions.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
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
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Advanced Security
              </h3>
              <p className="text-gray-600">
                Multi-layered security with end-to-end encryption, fraud
                detection, and compliance with financial regulations including
                PCI DSS and SOC 2.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                High-Speed Processing
              </h3>
              <p className="text-gray-600">
                Process cheques in minutes, not days. Our AI-powered system
                automatically extracts and verifies cheque data with 99.9%
                accuracy.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition duration-300 border border-gray-100">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-6">
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
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Global Coverage
              </h3>
              <p className="text-gray-600">
                Support for multiple currencies and banking systems worldwide.
                Process cheques from over 150 countries with automatic currency
                conversion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Powerful Dashboard Interface
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Manage all your cheque processing activities through our
              intuitive, feature-rich dashboard designed for efficiency and
              control.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Real-time Financial Overview
              </h3>
              <p className="text-gray-600 mb-8">
                Monitor your cheque processing pipeline, track deposits in
                real-time, and access comprehensive reporting tools—all from a
                single, unified dashboard.
              </p>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600"
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
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Live Status Tracking
                    </h4>
                    <p className="text-gray-600">
                      Monitor cheque processing status from upload to clearance
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Advanced Analytics
                    </h4>
                    <p className="text-gray-600">
                      Gain insights with detailed reports and financial
                      analytics
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Secure Access Control
                    </h4>
                    <p className="text-gray-600">
                      Role-based permissions and multi-factor authentication
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg">
                {/* Dashboard Preview Image */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="bg-gray-900 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-white text-sm font-medium">
                      dashboard.chequeprocessor.com
                    </div>
                    <div className="w-6"></div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">
                          Processed Today
                        </p>
                        <p className="text-2xl font-bold text-gray-900">24</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">
                          Total Value
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          $47.8K
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Recent Activity
                      </p>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            ACME Corp • Cheque #4582
                          </span>
                          <span className="text-green-600 font-medium">
                            Completed
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            Global Bank • Cheque #4583
                          </span>
                          <span className="text-blue-600 font-medium">
                            Processing
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition duration-200">
                      Process New Cheque
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Streamlined Processing Workflow
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From capture to clearance—a seamless, automated process
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 to-purple-200 transform -translate-y-1/2"></div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {[
                  {
                    step: "1",
                    title: "Capture",
                    desc: "Upload cheque images via mobile app or web portal",
                    icon: "📱",
                  },
                  {
                    step: "2",
                    title: "Extract",
                    desc: "AI-powered data extraction with automatic validation",
                    icon: "🤖",
                  },
                  {
                    step: "3",
                    title: "Verify",
                    desc: "Real-time fraud detection and authenticity checks",
                    icon: "🔍",
                  },
                  {
                    step: "4",
                    title: "Clear",
                    desc: "Automated clearance and instant fund availability",
                    icon: "💸",
                  },
                ].map((item, index) => (
                  <div key={index} className="relative text-center">
                    <div className="w-20 h-20 bg-white border-4 border-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg z-10">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4">
                        {item.step}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Enterprise-Grade Security
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Built with the highest security standards to protect your
                financial data and ensure regulatory compliance across all
                jurisdictions.
              </p>

              <div className="mt-8 space-y-6">
                {[
                  {
                    title: "256-bit AES Encryption",
                    desc: "Military-grade encryption for all data in transit and at rest",
                  },
                  {
                    title: "SOC 2 Type II Certified",
                    desc: "Regularly audited for security, availability, and confidentiality",
                  },
                  {
                    title: "PCI DSS Compliant",
                    desc: "Full compliance with payment card industry data security standards",
                  },
                  {
                    title: "Multi-factor Authentication",
                    desc: "Advanced identity verification and access controls",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600"
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
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: "🔐", title: "Data Encryption", color: "blue" },
                    { icon: "🛡️", title: "Fraud Detection", color: "green" },
                    { icon: "📊", title: "Audit Logging", color: "purple" },
                    { icon: "✅", title: "KYC/AML", color: "red" },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100"
                    >
                      <div
                        className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center mx-auto mb-3`}
                      >
                        <span className="text-xl">{item.icon}</span>
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {item.title}
                      </h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to Transform Your Cheque Processing?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
            Join leading financial institutions and businesses that trust
            ChequeProcessor for secure, efficient digital cheque processing.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10 transition duration-200 shadow-lg"
            >
              Start Free 
            </Link>
            <Link
              to="/schedule_demo"
              className="inline-flex items-center justify-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-600 md:py-4 md:text-lg md:px-10 transition duration-200"
            >
              Schedule Demo
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            No setup fees • 30-day money-back guarantee • Enterprise support
            included
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">CP</span>
                </div>
                <span className="text-xl font-bold">ChequeProcessor</span>
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                Enterprise-grade digital cheque processing for modern financial
                institutions.
              </p>
            </div>

            {[
              {
                title: "Product",
                links: ["Features", "Security", "Pricing", "API Docs"],
              },
              {
                title: "Company",
                links: ["About", "Blog", "Careers", "Contact"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Compliance", "GDPR"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                  {section.title}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a
                        href="#"
                        className="text-sm text-gray-300 hover:text-white transition duration-200"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                &copy; 2024 ChequeProcessor. All rights reserved.
              </p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <span className="text-sm text-gray-400">SOC 2 Compliant</span>
                <span className="text-sm text-gray-400">PCI DSS Certified</span>
                <span className="text-sm text-gray-400">GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
