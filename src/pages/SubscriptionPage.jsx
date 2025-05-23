import React from 'react';
import { useSubscription, SUBSCRIPTION_LIMITS } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import UsageDashboard from '../components/paywall/UsageDashboard';
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

  const PlanCard = ({ planType, planData, isCurrentPlan }) => (
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

        <div className="space-y-4 mb-10">
          {planData.features ? (
            planData.features.map((feature, index) => (
              <FeatureItem 
                key={index}
                included={true}
                text={feature}
              />
            ))
          ) : (
            <>
              <FeatureItem 
                included={true}
                text={`${planData.maxDecks === Infinity ? 'Unlimited' : planData.maxDecks} saved decks`}
              />
              <FeatureItem 
                included={true}
                text={`${planData.maxAIRequestsPerWeek === Infinity ? 'Unlimited' : planData.maxAIRequestsPerWeek} AI requests per week`}
              />
              <FeatureItem 
                included={planType === 'PREMIUM'}
                text="Priority AI responses"
              />
              <FeatureItem 
                included={planType === 'PREMIUM'}
                text="Advanced deck analytics"
              />
              <FeatureItem 
                included={planType === 'PREMIUM'}
                text="Cloud sync across devices"
              />
              <FeatureItem 
                included={planType === 'PREMIUM'}
                text="Export to popular formats"
              />
              <FeatureItem 
                included={planType === 'PREMIUM'}
                text="Priority customer support"
              />
            </>
          )}
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

  const FeatureItem = ({ included, text }) => (
    <div className="flex items-center space-x-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
        included 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
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
      <span className={`text-sm ${included ? 'text-white' : 'text-slate-500'}`}>
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

        {/* Current Usage Dashboard */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            📊 Current Usage
          </h2>
          <UsageDashboard />
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            🎯 Choose Your Plan
          </h2>
          <p className="text-slate-400 text-center mb-12 text-lg">
            Select the plan that best fits your deck building needs
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <PlanCard 
              planType="FREE"
              planData={SUBSCRIPTION_LIMITS.FREE}
              isCurrentPlan={subscriptionStatus === 'FREE'}
            />
            <PlanCard 
              planType="PREMIUM"
              planData={SUBSCRIPTION_LIMITS.PREMIUM}
              isCurrentPlan={subscriptionStatus === 'PREMIUM'}
            />
          </div>
        </div>

                {/* Usage Details */}        <div className="glassmorphism-card p-8 border-primary-500/20">          <h3 className="text-3xl font-bold text-white mb-8 text-center flex items-center justify-center space-x-3">            <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />            </svg>            <span>📈 Usage Details</span>          </h3>                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">            {/* Saved Decks Card */}            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 hover:border-primary-500/30 transition-all duration-300">              <div className="flex items-center space-x-4 mb-6">                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />                  </svg>                </div>                <h4 className="text-xl font-bold text-white">Saved Decks</h4>              </div>                            <div className="space-y-4">                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">                  <span className="text-slate-200 font-medium">Current Usage:</span>                  <span className="text-2xl font-bold text-primary-400">{usageData.savedDecks}</span>                </div>                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">                  <span className="text-slate-200 font-medium">Plan Limit:</span>                  <span className="text-2xl font-bold text-white">{limits.maxDecks === Infinity ? '∞' : limits.maxDecks}</span>                </div>                                {!isPremium && usageData.savedDecks >= limits.maxDecks && (                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mt-4">                    <div className="flex items-center space-x-2 mb-3">                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />                      </svg>                      <p className="text-red-300 font-semibold">Limit Reached!</p>                    </div>                    <p className="text-red-200 mb-3">                      Upgrade to Premium for unlimited decks.                    </p>                    <a                      href={getPaymentUrl()}                      target="_blank"                       rel="noopener noreferrer"                      className="btn-modern btn-modern-primary btn-modern-sm"                    >                      Upgrade Now                    </a>                  </div>                )}              </div>            </div>                        {/* AI Requests Card */}            <div className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 hover:border-primary-500/30 transition-all duration-300">              <div className="flex items-center space-x-4 mb-6">                <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />                  </svg>                </div>                <h4 className="text-xl font-bold text-white">AI Requests</h4>              </div>                            <div className="space-y-4">                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">                  <span className="text-slate-200 font-medium">This Week:</span>                  <span className="text-2xl font-bold text-primary-400">{usageData.aiRequestsThisWeek}</span>                </div>                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl">                  <span className="text-slate-200 font-medium">Weekly Limit:</span>                  <span className="text-2xl font-bold text-white">{limits.maxAIRequestsPerWeek === Infinity ? '∞' : limits.maxAIRequestsPerWeek}</span>                </div>                                {!isPremium && (                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">                    <div className="flex items-center space-x-2 mb-2">                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />                      </svg>                      <span className="text-blue-300 font-medium text-sm">Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}</span>                    </div>                  </div>                )}                                {!isPremium && usageData.aiRequestsThisWeek >= limits.maxAIRequestsPerWeek && (                  <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">                    <div className="flex items-center space-x-2 mb-3">                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />                      </svg>                      <p className="text-red-300 font-semibold">Limit Reached!</p>                    </div>                    <p className="text-red-200 mb-3">                      Upgrade to Premium for unlimited requests.                    </p>                    <a                      href={getPaymentUrl()}                      target="_blank"                       rel="noopener noreferrer"                      className="btn-modern btn-modern-primary btn-modern-sm"                    >                      Upgrade Now                    </a>                  </div>                )}              </div>            </div>          </div>        </div>

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