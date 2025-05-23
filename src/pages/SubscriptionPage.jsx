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

  // Handle upgrade to premium
  const handleUpgradeClick = async () => {
    if (!currentUser) {
      alert('Please log in to upgrade your subscription.');
      return;
    }

    try {
      await initiatePremiumCheckout(
        currentUser.id, // GoHighLevel contact ID
        currentUser.email, // User's email
        currentUser.id // User ID for metadata
      );
    } catch (error) {
      console.error('Error starting checkout:', error);
      alert('Unable to start checkout process. Please try again or contact support.');
    }
  };

  // Handle subscription management
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

  // Handle refresh subscription status
  const handleRefreshStatus = () => {
    window.location.reload();
  };

  const PlanCard = ({ planType, planData, isCurrentPlan }) => (
    <div className={`relative bg-theme-bg-secondary rounded-xl p-6 border-2 transition-all duration-300 ${
      isCurrentPlan 
        ? 'border-theme-accent-blue shadow-lg scale-105' 
        : 'border-theme-bg-tertiary hover:border-theme-accent-blue/50'
    }`}>
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-theme-accent-blue to-theme-accent-purple text-white px-4 py-1 rounded-full text-sm font-medium">
            Current Plan
          </span>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-theme-text-primary mb-2">
          {planData.name}
        </h3>
        <div className="text-4xl font-bold text-theme-accent-blue mb-2">
          ${planData.price}
          <span className="text-sm font-normal text-theme-text-secondary">
            {planData.price > 0 ? '/month' : ''}
          </span>
        </div>
        {planData.price === 0 && (
          <p className="text-sm text-theme-text-secondary">Perfect for getting started</p>
        )}
      </div>

      <div className="space-y-4 mb-8">
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
              className="w-full px-6 py-3 bg-theme-bg-tertiary text-theme-text-primary rounded-lg font-medium hover:bg-gray-300 transition-colors border border-theme-bg-tertiary"
            >
              Manage Subscription
            </button>
          ) : (
            <button
              disabled
              className="w-full px-6 py-3 bg-theme-bg-tertiary text-theme-text-secondary rounded-lg font-medium cursor-not-allowed"
            >
              Current Plan
            </button>
          )
        ) : planType === 'PREMIUM' ? (
          <button
            onClick={handleUpgradeClick}
            className="w-full px-6 py-3 bg-gradient-to-r from-theme-accent-blue to-theme-accent-purple text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Upgrade to Premium
          </button>
        ) : null}
      </div>
    </div>
  );

  const FeatureItem = ({ included, text }) => (
    <div className="flex items-center">
      <span className={`mr-3 text-lg ${included ? 'text-green-500' : 'text-theme-text-muted'}`}>
        {included ? '✓' : '✗'}
      </span>
      <span className={`text-sm ${included ? 'text-theme-text-primary' : 'text-theme-text-muted'}`}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-theme-text-primary mb-4">
          Subscription & Usage
        </h1>
        <p className="text-lg text-theme-text-secondary max-w-2xl mx-auto">
          Manage your subscription and track your usage of MTG Commander Deck Builder features.
        </p>
      </div>

      {/* Upgrade CTA for Free Users */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Upgrade to Premium Today!</h2>
          <p className="text-xl mb-6 opacity-90">
            Unlock unlimited decks, unlimited AI requests, and premium features for just $3.99/month
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleUpgradeClick}
              className="px-8 py-4 bg-white text-blue-600 text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              🚀 Start Premium Now - $3.99/month
            </button>
            <a
              href={getPaymentUrl()}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-white text-white text-lg font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              Direct Payment Link →
            </a>
          </div>
          <p className="text-sm mt-4 opacity-75">
            ✅ Secure payment through Stripe • ✅ Cancel anytime • ✅ Instant activation
          </p>
        </div>
      )}

      {/* Payment Information */}
      {!isPremium && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400">💳</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Ready to Upgrade to Premium?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Payment is processed securely through Stripe. Click below to upgrade now for just $3.99/month.
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-4 flex flex-col gap-2">
              <button
                onClick={handleUpgradeClick}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-md hover:opacity-90 transition-opacity font-medium"
              >
                Pay Now - $3.99/month
              </button>
              <a
                href={getPaymentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-white border border-blue-300 text-blue-600 text-sm rounded-md hover:bg-blue-50 transition-colors text-center"
              >
                Direct Link
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Just Paid Section */}
      {!isPremium && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-green-400">✅</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Just completed payment?
                </h3>
                <div className="mt-1 text-sm text-green-700">
                  <p>
                    If you just completed your payment, click refresh to update your subscription status.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleRefreshStatus}
              className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
            >
              Refresh Status
            </button>
          </div>
        </div>
      )}

      {/* Current Usage Dashboard */}
      <div>
        <h2 className="text-2xl font-semibold text-theme-text-primary mb-6">
          Current Usage
        </h2>
        <UsageDashboard />
      </div>

      {/* Subscription Plans */}
      <div>
        <h2 className="text-2xl font-semibold text-theme-text-primary mb-6">
          Subscription Plans
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
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

      {/* Usage Details */}
      <div className="bg-theme-bg-secondary rounded-xl p-6 border border-theme-bg-tertiary">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-4">
          Usage Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-theme-text-primary mb-2">Saved Decks</h4>
            <p className="text-sm text-theme-text-secondary mb-1">
              You have saved {usageData.savedDecks} out of {limits.maxDecks === Infinity ? 'unlimited' : limits.maxDecks} decks.
            </p>
            {!isPremium && usageData.savedDecks >= limits.maxDecks && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 mb-2">
                  ⚠️ You've reached your deck limit! Upgrade to Premium for unlimited decks.
                </p>
                <button
                  onClick={handleUpgradeClick}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-theme-text-primary mb-2">AI Requests</h4>
            <p className="text-sm text-theme-text-secondary mb-1">
              You have used {usageData.aiRequestsThisWeek} out of {limits.maxAIRequestsPerWeek === Infinity ? 'unlimited' : limits.maxAIRequestsPerWeek} AI requests this week.
            </p>
            {!isPremium && (
              <p className="text-sm text-theme-text-muted">
                Resets in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
              </p>
            )}
            {!isPremium && usageData.aiRequestsThisWeek >= limits.maxAIRequestsPerWeek && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 mb-2">
                  ⚠️ You've reached your weekly AI request limit! Upgrade to Premium for unlimited requests.
                </p>
                <button
                  onClick={handleUpgradeClick}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick upgrade section in usage details for free users */}
        {!isPremium && (
          <div className="mt-6 pt-6 border-t border-theme-bg-tertiary">
            <div className="text-center">
              <h4 className="font-medium text-theme-text-primary mb-2">Ready to upgrade?</h4>
              <p className="text-sm text-theme-text-secondary mb-4">
                Get unlimited access to all features for just $3.99/month
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleUpgradeClick}
                  className="px-6 py-2 bg-gradient-to-r from-theme-accent-blue to-theme-accent-purple text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Upgrade to Premium
                </button>
                <a
                  href={getPaymentUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 border border-theme-accent-blue text-theme-accent-blue rounded-md hover:bg-theme-accent-blue hover:text-white transition-colors"
                >
                  Direct Link
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="bg-theme-bg-secondary rounded-xl p-6 border border-theme-bg-tertiary">
        <h3 className="text-xl font-semibold text-theme-text-primary mb-4">
          Frequently Asked Questions
        </h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-theme-text-primary mb-1">
              How do I upgrade to Premium?
            </h4>
            <p className="text-sm text-theme-text-secondary">
              Click the "Upgrade to Premium" button above to be redirected to our secure Stripe payment page. After completing payment, return to this page and refresh your browser to activate your premium features.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-theme-text-primary mb-1">
              What happens after I pay?
            </h4>
            <p className="text-sm text-theme-text-secondary">
              After successful payment, your account will be automatically upgraded to Premium. You may need to refresh the page to see your new premium status and unlimited access to all features.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-theme-text-primary mb-1">
              When do AI requests reset?
            </h4>
            <p className="text-sm text-theme-text-secondary">
              AI requests reset every 7 days from when you first used the feature. Premium users have unlimited requests.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium text-theme-text-primary mb-1">
              Can I cancel my subscription anytime?
            </h4>
            <p className="text-sm text-theme-text-secondary">
              Yes, you can cancel your Premium subscription at any time. Contact our support team or use the subscription management link in your payment confirmation email from Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage; 