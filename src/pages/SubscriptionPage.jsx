import React from 'react';
import { useSubscription, SUBSCRIPTION_LIMITS } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { initiatePremiumCheckout, createCustomerPortalSession, isStripeConfigured, getPaymentUrl } from '../utils/stripeIntegration';

const SubscriptionPage = () => {
  const { 
    isPremium, 
    subscriptionStatus, 
    usageData, 
    limits, 
    getDaysUntilWeeklyReset 
  } = useSubscription();
  
  const { currentUser } = useAuth();
  const daysUntilReset = getDaysUntilWeeklyReset;

  const handleUpgradeClick = async () => {
    if (!currentUser) {
      alert('Please log in to upgrade your subscription.');
      return;
    }

    try {
      await initiatePremiumCheckout(
        currentUser.id,
        currentUser.email,
        currentUser.id
      );
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Unable to start checkout process. Please try again or contact support.');
    }
  };

  const handleManageSubscription = async () => {
    if (!currentUser) {
      alert('Please log in to manage your subscription.');
      return;
    }

    try {
      await createCustomerPortalSession();
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Unable to open subscription management. Please contact support.');
    }
  };

  const handleRefreshStatus = () => {
    window.location.reload();
  };

  const PlanCard = ({ planType, planData, isCurrentPlan }) => {
    // Group features by category
    const featureCategories = {
      'Core Features': [
        'saved decks',
        'AI requests',
        'Export to all formats',
        'Format legality checking',
        'Commander color identity validation',
        'deck validation',
        'Card search powered by Scryfall'
      ],
      'Analytics & AI': [
        'deck analytics',
        'mana curve analysis',
        'AI Strategic Overview',
        'deck suggestions',
        'Synergy recommendations',
        'Card draw simulation'
      ],
      'Advanced Tools': [
        'Priority AI responses',
        'Priority customer support'
      ]
    };

    const categorizeFeature = (feature) => {
      for (const [category, keywords] of Object.entries(featureCategories)) {
        if (keywords.some(keyword => feature.toLowerCase().includes(keyword.toLowerCase()))) {
          return category;
        }
      }
      return 'Other Features';
    };

    const groupedFeatures = planData.features.reduce((acc, feature) => {
      const category = categorizeFeature(feature);
      if (!acc[category]) acc[category] = [];
      acc[category].push(feature);
      return acc;
    }, {});

    return (
      <div className={`relative group ${
        isCurrentPlan 
          ? 'scale-105 z-10' 
          : 'hover:scale-[1.02] transition-transform duration-300'
      }`}>
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-3xl blur-xl transition-opacity duration-300 ${
          isCurrentPlan 
            ? 'bg-gradient-to-r from-primary-500/30 to-blue-500/30 opacity-60' 
            : 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 opacity-0 group-hover:opacity-40'
        }`}></div>
        
        <div className={`relative glassmorphism-card p-8 border-2 transition-all duration-300 ${
          isCurrentPlan 
            ? 'border-primary-500/50 shadow-modern-primary' 
            : 'border-slate-700/50 hover:border-primary-500/30'
        }`}>
          {isCurrentPlan && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-primary-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                ✨ Current Plan
              </div>
            </div>
          )}
          
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">
              {planData.name}
            </h3>
            <div className="text-5xl font-bold text-gradient-primary mb-3">
              ${planData.price}
              <span className="text-lg font-normal text-slate-400">
                {planData.price > 0 ? '/month' : ''}
              </span>
            </div>
            {planData.price === 0 && (
              <p className="text-slate-400">Perfect for getting started</p>
            )}
            {planData.price > 0 && (
              <p className="text-slate-400">Professional deck building</p>
            )}
          </div>

          <div className="space-y-6 mb-10">
            {Object.entries(groupedFeatures).map(([category, features]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold text-primary-400 mb-2">{category}</h4>
                {features.map((feature, index) => (
                  <FeatureItem 
                    key={index}
                    included={true}
                    text={feature}
                    highlight={feature.includes('Unlimited') || feature.includes('Advanced') || feature.includes('Priority')}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="text-center">
            {isCurrentPlan ? (
              planType === 'PREMIUM' ? (
                <button
                  onClick={handleManageSubscription}
                  className="btn-modern btn-modern-secondary btn-modern-md w-full"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Manage Subscription</span>
                  </span>
                </button>
              ) : (
                <button
                  disabled
                  className="btn-modern btn-modern-ghost btn-modern-md w-full opacity-50 cursor-not-allowed"
                >
                  ✅ Current Plan
                </button>
              )
            ) : planType === 'PREMIUM' ? (
              <button
                onClick={handleUpgradeClick}
                className="btn-modern btn-modern-primary btn-modern-md w-full premium-glow"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀 Upgrade to Premium</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const FeatureItem = ({ included, text, highlight }) => (
    <div className="flex items-center space-x-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        included 
          ? highlight 
            ? 'bg-gradient-to-r from-primary-500 to-blue-500 text-white' 
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          : 'bg-slate-700 text-slate-400'
      }`}>
        {included ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <span className={`text-sm ${included ? highlight ? 'text-primary-300 font-semibold' : 'text-white' : 'text-slate-500'}`}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 space-y-16">
                {/* Header */}        <div className="text-center">          <div className="mb-8">            <img               src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png"               alt="MTG Commander Deck Builder Logo"               className="h-16 sm:h-20 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300 mb-6"            />          </div>          <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-6">            Subscription & Usage          </h1>          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">            Manage your subscription and track your usage of our powerful MTG Commander Deck Builder features.          </p>        </div>

        {/* Upgrade Hero for Free Users */}
        {!isPremium && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl"></div>
            <div className="relative glassmorphism-card p-12 border-primary-500/30 text-center">
              <div className="mb-8">
                <h2 className="text-4xl font-bold text-white mb-4">
                  🚀 Unlock Premium Power
                </h2>
                <p className="text-xl text-slate-300 mb-2">
                  Unlimited decks, unlimited AI requests, and premium features
                </p>
                <p className="text-3xl font-bold text-gradient-primary">
                  Just $3.99/month
                </p>
              </div>
              
                            <div className="flex justify-center mb-8">                <a                  href={getPaymentUrl()}                  target="_blank"                   rel="noopener noreferrer"                  className="btn-modern btn-modern-primary btn-modern-xl premium-glow group"                >                  <span className="flex items-center space-x-3">                    <span>⚡ Start Premium Now</span>                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />                    </svg>                  </span>                </a>              </div>
              
              <div className="flex justify-center space-x-8 text-sm text-slate-400">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Secure Stripe Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cancel Anytime</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Instant Activation</span>
                </div>
              </div>

              {/* Just Paid Section */}
              <div className="mt-8 pt-8 border-t border-slate-700/50">
                <div className="flex items-center justify-center space-x-4 text-slate-400">
                  <span>Just completed payment?</span>
                  <button
                    onClick={handleRefreshStatus}
                    className="btn-modern btn-modern-ghost btn-modern-sm"
                  >
                    <span className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh Status</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

                {/* Combined Usage & Plans Dashboard */}        <div>          <h2 className="text-3xl font-bold text-white mb-4 text-center">            📊 Current Usage & Plans          </h2>          <p className="text-slate-400 text-center mb-12 text-lg">            Track your usage and choose the plan that fits your needs          </p>          {/* Modern Usage Overview */}          <div className="glassmorphism-card p-8 border-primary-500/20 mb-12">            <div className="flex items-center justify-between mb-8">              <div className="flex items-center space-x-3">                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />                  </svg>                </div>                <div>                  <h3 className="text-xl font-bold text-white">Usage Dashboard</h3>                  <p className="text-slate-400 text-sm">                    {isPremium ? 'Premium Plan' : 'Free Plan'} •                     {!isPremium && ` Resets in ${daysUntilReset} day${daysUntilReset !== 1 ? 's' : ''}`}                    {isPremium && ' Unlimited Access'}                  </p>                </div>              </div>              {!isPremium && (                <a                  href={getPaymentUrl()}                  target="_blank"                  rel="noopener noreferrer"                  className="btn-modern btn-modern-primary btn-modern-sm premium-glow"                >                  <span className="flex items-center space-x-2">                    <span>⚡ Upgrade</span>                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />                    </svg>                  </span>                </a>              )}            </div>            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">              {/* Saved Decks Usage */}              <div className="relative">                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-primary-500/30 transition-all duration-300">                  <div className="flex items-center justify-between mb-4">                    <div className="flex items-center space-x-3">                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />                        </svg>                      </div>                      <span className="text-white font-semibold">Saved Decks</span>                    </div>                    <div className="text-right">                      <div className="text-2xl font-bold text-white">                        {usageData.savedDecks}                        <span className="text-sm text-slate-400 font-normal">                          /{limits.maxDecks === Infinity ? '∞' : limits.maxDecks}                        </span>                      </div>                    </div>                  </div>                                    {/* Progress Bar */}                  <div className="w-full bg-slate-700 rounded-full h-2 mb-3">                    <div                       className={`h-2 rounded-full transition-all duration-500 ${                        usageData.savedDecks >= limits.maxDecks && !isPremium                          ? 'bg-gradient-to-r from-red-500 to-red-600'                           : 'bg-gradient-to-r from-emerald-500 to-green-500'                      }`}                      style={{                         width: limits.maxDecks === Infinity                           ? '100%'                           : `${Math.min((usageData.savedDecks / limits.maxDecks) * 100, 100)}%`                       }}                    ></div>                  </div>                                    <div className="flex justify-between items-center text-sm">                    <span className="text-slate-400">                      {limits.maxDecks === Infinity                         ? 'Unlimited'                         : `${Math.max(0, limits.maxDecks - usageData.savedDecks)} remaining`                      }                    </span>                    {!isPremium && usageData.savedDecks >= limits.maxDecks && (                      <span className="text-red-400 font-medium">Limit reached</span>                    )}                  </div>                </div>                                {/* Limit reached warning overlay */}                {!isPremium && usageData.savedDecks >= limits.maxDecks && (                  <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">                    <div className="text-center p-4">                      <div className="flex items-center justify-center space-x-2 mb-2">                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />                        </svg>                        <span className="text-red-300 font-semibold text-sm">Limit Reached</span>                      </div>                      <a                        href={getPaymentUrl()}                        target="_blank"                        rel="noopener noreferrer"                        className="btn-modern btn-modern-primary btn-modern-xs"                      >                        Upgrade for Unlimited                      </a>                    </div>                  </div>                )}              </div>              {/* AI Requests Usage */}              <div className="relative">                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 hover:border-primary-500/30 transition-all duration-300">                  <div className="flex items-center justify-between mb-4">                    <div className="flex items-center space-x-3">                      <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />                        </svg>                      </div>                      <span className="text-white font-semibold">AI Requests</span>                    </div>                    <div className="text-right">                      <div className="text-2xl font-bold text-white">                        {usageData.aiRequestsThisWeek}                        <span className="text-sm text-slate-400 font-normal">                          /{limits.maxAIRequestsPerWeek === Infinity ? '∞' : limits.maxAIRequestsPerWeek}                        </span>                      </div>                    </div>                  </div>                                    {/* Progress Bar */}                  <div className="w-full bg-slate-700 rounded-full h-2 mb-3">                    <div                       className={`h-2 rounded-full transition-all duration-500 ${                        usageData.aiRequestsThisWeek >= limits.maxAIRequestsPerWeek && !isPremium                          ? 'bg-gradient-to-r from-red-500 to-red-600'                           : 'bg-gradient-to-r from-purple-500 to-blue-500'                      }`}                      style={{                         width: limits.maxAIRequestsPerWeek === Infinity                           ? '100%'                           : `${Math.min((usageData.aiRequestsThisWeek / limits.maxAIRequestsPerWeek) * 100, 100)}%`                       }}                    ></div>                  </div>                                    <div className="flex justify-between items-center text-sm">                    <span className="text-slate-400">                      {limits.maxAIRequestsPerWeek === Infinity                         ? 'Unlimited'                         : `${Math.max(0, limits.maxAIRequestsPerWeek - usageData.aiRequestsThisWeek)} remaining`                      }                    </span>                    {!isPremium && usageData.aiRequestsThisWeek >= limits.maxAIRequestsPerWeek && (                      <span className="text-red-400 font-medium">Limit reached</span>                    )}                  </div>                </div>                                {/* Limit reached warning overlay */}                {!isPremium && usageData.aiRequestsThisWeek >= limits.maxAIRequestsPerWeek && (                  <div className="absolute inset-0 bg-red-500/10 border-2 border-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">                    <div className="text-center p-4">                      <div className="flex items-center justify-center space-x-2 mb-2">                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />                        </svg>                        <span className="text-red-300 font-semibold text-sm">Limit Reached</span>                      </div>                      <a                        href={getPaymentUrl()}                        target="_blank"                        rel="noopener noreferrer"                        className="btn-modern btn-modern-primary btn-modern-xs"                      >                        Upgrade for Unlimited                      </a>                    </div>                  </div>                )}              </div>            </div>          </div>          {/* Subscription Plans */}          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">            <PlanCard               planType="FREE"              planData={SUBSCRIPTION_LIMITS.FREE}              isCurrentPlan={subscriptionStatus === 'FREE'}            />            <PlanCard               planType="PREMIUM"              planData={SUBSCRIPTION_LIMITS.PREMIUM}              isCurrentPlan={subscriptionStatus === 'PREMIUM'}            />          </div>

          {/* Plan Comparison Table */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">
              🔄 Detailed Plan Comparison
            </h3>
            <div className="glassmorphism-card p-6 border-slate-700/50 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-4 px-4 text-slate-400 font-medium">Feature</th>
                    <th className="text-center py-4 px-4 text-slate-400 font-medium">Free Plan</th>
                    <th className="text-center py-4 px-4 text-primary-400 font-medium">Premium Plan</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Saved Decks</td>
                    <td className="py-4 px-4 text-center text-slate-300">5 decks</td>
                    <td className="py-4 px-4 text-center text-primary-300">Unlimited</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">AI Requests</td>
                    <td className="py-4 px-4 text-center text-slate-300">5 per week</td>
                    <td className="py-4 px-4 text-center text-primary-300">Unlimited</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">AI Strategic Overview</td>
                    <td className="py-4 px-4 text-center text-slate-300">Commanders Only</td>
                    <td className="py-4 px-4 text-center text-primary-300">All Cards</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Deck Analytics</td>
                    <td className="py-4 px-4 text-center text-slate-300">Basic</td>
                    <td className="py-4 px-4 text-center text-primary-300">Advanced</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Card Search</td>
                    <td className="py-4 px-4 text-center text-slate-300">Powered by Scryfall</td>
                    <td className="py-4 px-4 text-center text-primary-300">Powered by Scryfall</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Export Formats</td>
                    <td className="py-4 px-4 text-center text-slate-300">All Formats</td>
                    <td className="py-4 px-4 text-center text-primary-300">All Formats</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Deck Validation</td>
                    <td className="py-4 px-4 text-center text-slate-300">✅</td>
                    <td className="py-4 px-4 text-center text-primary-300">✅</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Card Draw Simulation</td>
                    <td className="py-4 px-4 text-center text-slate-300">❌</td>
                    <td className="py-4 px-4 text-center text-primary-300">✅</td>
                  </tr>
                  <tr className="border-b border-slate-700/30">
                    <td className="py-4 px-4 text-white">Synergy Recommendations</td>
                    <td className="py-4 px-4 text-center text-slate-300">Basic</td>
                    <td className="py-4 px-4 text-center text-primary-300">Advanced</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-4 text-white">Customer Support</td>
                    <td className="py-4 px-4 text-center text-slate-300">Standard</td>
                    <td className="py-4 px-4 text-center text-primary-300">Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glassmorphism-card p-8 border-slate-700/50">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            ❓ Frequently Asked Questions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center space-x-2">
                  <span>💳</span>
                  <span>How do I upgrade to Premium?</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Click the "Upgrade to Premium" button to be redirected to our secure Stripe payment page. After completing payment, refresh this page to activate your premium features.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center space-x-2">
                  <span>⚡</span>
                  <span>What happens after I pay?</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Your account will be automatically upgraded to Premium. You may need to refresh the page to see your new premium status and unlimited access to all features.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center space-x-2">
                  <span>🔄</span>
                  <span>When do AI requests reset?</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  AI requests reset every 7 days from when you first used the feature. Premium users have unlimited requests.
                </p>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-white mb-2 flex items-center space-x-2">
                  <span>✅</span>
                  <span>Can I cancel anytime?</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Yes, you can cancel your Premium subscription at any time. Use the "Manage Subscription" button or contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage; 