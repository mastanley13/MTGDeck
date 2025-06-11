import React from 'react';

const AffiliatePage = () => {
  const handleApplyClick = () => {
    window.open('https://reflio.com/affiliate-signup', '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Header */}
        <div className="text-center">
          <div className="mb-8">
            <img 
              src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png"
              alt="MTG Commander Deck Builder Logo"
              className="h-16 sm:h-20 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300 mb-6"
            />
          </div>
          <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-6">
            Become an Affiliate
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Join our affiliate program and earn 30% commission on every premium subscription you refer!
          </p>
        </div>

        {/* Hero Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
          <div className="relative glassmorphism-card p-12 border-primary-500/30 text-center">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-4">
                Earn With Every Referral
              </h2>
              <p className="text-xl text-slate-300 mb-2">
                Share the power of AI deck building and earn passive income
              </p>
              <p className="text-3xl font-bold text-gradient-primary">
                30% Commission Per Sale
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <button 
                onClick={handleApplyClick}
                className="btn-modern btn-modern-primary btn-modern-xl premium-glow group">
                <span className="flex items-center space-x-3">
                  <span>⚡ Apply Now</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

            <div className="flex justify-center space-x-8 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Monthly Payouts</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Real-time Tracking</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Dedicated Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Why Become an Affiliate?
          </h2>
          <p className="text-slate-400 text-center mb-12 text-lg">
            Join our growing community of successful affiliates
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefit Card 1 */}
            <div className="glassmorphism-card p-8 border-slate-700/50 hover:border-primary-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">30% Commission</h3>
              <p className="text-slate-400">
                Earn a generous 30% commission on every premium subscription purchase made through your unique affiliate link.
              </p>
            </div>

            {/* Benefit Card 2 */}
            <div className="glassmorphism-card p-8 border-slate-700/50 hover:border-primary-500/30 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Dedicated Support</h3>
              <p className="text-slate-400">
                Get priority support and resources to help you maximize your earnings as an affiliate partner.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="glassmorphism-card p-8 border-slate-700/50">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                  1
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-white mb-2">Apply</h3>
                <p className="text-slate-300">
                  Complete our simple application form to become an affiliate partner. We'll review your application and get back to you within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                  2
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-white mb-2">Share</h3>
                <p className="text-slate-300">
                  Get your unique affiliate link and promotional materials. Share them with your audience through your preferred channels.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
                  3
                </div>
              </div>
              <div className="ml-6">
                <h3 className="text-xl font-bold text-white mb-2">Earn</h3>
                <p className="text-slate-300">
                  Earn 30% commission on every premium subscription purchase. Track your earnings in real-time and receive monthly payouts.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <button 
            onClick={handleApplyClick}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Apply Now
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Questions? Contact our affiliate support team at affiliates@mtgapp.com
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Powered by Reflio - Secure and automated affiliate tracking and payouts
          </p>
        </div>
      </div>
    </div>
  );
};

export default AffiliatePage; 