import React from 'react';
import { useSubscription, SUBSCRIPTION_LIMITS } from '../context/SubscriptionContext';
import UsageDashboard from '../components/paywall/UsageDashboard';

const SubscriptionPage = () => {
  const { 
    isPremium, 
    subscriptionStatus, 
    usageData, 
    limits, 
    getDaysUntilWeeklyReset 
  } = useSubscription();

  const daysUntilReset = getDaysUntilWeeklyReset;

  // Placeholder function for Stripe integration
  const handleUpgradeClick = () => {
    // TODO: Integrate with Stripe checkout
    console.log('Stripe integration coming soon');
    alert('Payment integration coming soon! Please check back later.');
  };

  const handleManageSubscription = () => {
    // TODO: Integrate with Stripe customer portal
    console.log('Stripe customer portal coming soon');
    alert('Subscription management coming soon! Please contact support for now.');
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
              <p className="text-sm text-red-500">
                You've reached your deck limit. Upgrade to Premium for unlimited decks.
              </p>
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
              <p className="text-sm text-red-500">
                You've reached your weekly AI request limit. Upgrade to Premium for unlimited requests.
              </p>
            )}
          </div>
        </div>
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
              Click the "Upgrade to Premium" button above to start your premium subscription. You'll get unlimited deck saves, unlimited AI requests, and exclusive features.
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
              Yes, you can cancel your Premium subscription at any time through the "Manage Subscription" button. You'll continue to have Premium access until the end of your billing period.
            </p>
          </div>

          <div>
            <h4 className="font-medium text-theme-text-primary mb-1">
              What payment methods do you accept?
            </h4>
            <p className="text-sm text-theme-text-secondary">
              We accept all major credit cards and debit cards through our secure payment processor. Your payment information is never stored on our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage; 