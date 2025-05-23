import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getPaymentUrl, initiatePremiumCheckout } from '../../utils/stripeIntegration';

const UsageBanner = ({ className = '', showOnlyWhenNearLimit = false }) => {
  const {
    isPremium,
    limits,
    usageData,
    getDaysUntilWeeklyReset,
    upgradeToPremium,
  } = useSubscription();
  
  const { currentUser } = useAuth();

  const daysUntilReset = getDaysUntilWeeklyReset;

  const handleDirectUpgrade = async () => {
    if (!currentUser) {
      upgradeToPremium(); // Fallback to subscription page
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
      upgradeToPremium(); // Fallback to subscription page
    }
  };

  // Calculate usage percentages
  const deckUsagePercentage = limits.maxDecks === Infinity ? 0 : (usageData.savedDecks / limits.maxDecks) * 100;
  const aiUsagePercentage = limits.maxAIRequestsPerWeek === Infinity ? 0 : (usageData.aiRequestsThisWeek / limits.maxAIRequestsPerWeek) * 100;

  // Determine if we should show the banner
  const isNearLimit = deckUsagePercentage >= 80 || aiUsagePercentage >= 80;
  const isAtLimit = usageData.savedDecks >= limits.maxDecks || usageData.aiRequestsThisWeek >= limits.maxAIRequestsPerWeek;

  // If showOnlyWhenNearLimit is true and user is not near/at limit, don't show
  if (showOnlyWhenNearLimit && !isNearLimit && !isPremium === false) {
    return null;
  }

  // Don't show for premium users unless specifically requested
  if (isPremium && showOnlyWhenNearLimit) {
    return null;
  }

  const getBannerStyle = () => {
    if (isPremium) {
      return 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200';
    }
    if (isAtLimit) {
      return 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200';
    }
    if (isNearLimit) {
      return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
    }
    return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
  };

  const getTextColor = () => {
    if (isPremium) return 'text-blue-800';
    if (isAtLimit) return 'text-red-800';
    if (isNearLimit) return 'text-yellow-800';
    return 'text-gray-800';
  };

  const getActionButton = () => {
    if (isPremium) {
      return (
        <Link
          to="/subscription"
          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          Manage Subscription
        </Link>
      );
    }

    if (isAtLimit || isNearLimit) {
      return (
        <button
          onClick={handleDirectUpgrade}
          className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
        >
          Upgrade to Premium
        </button>
      );
    }

    return (
      <Link
        to="/subscription"
        className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
      >
        View Usage
      </Link>
    );
  };

  return (
    <div className={`border rounded-lg p-4 ${getBannerStyle()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Subscription Status */}
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {isPremium ? '⭐' : '🆓'}
            </span>
            <div>
              <div className={`font-medium ${getTextColor()}`}>
                {limits.name} Plan
              </div>
              {!isPremium && (
                <div className="text-sm text-gray-600">
                  ${limits.price}/month
                </div>
              )}
            </div>
          </div>

          {/* Usage Stats */}
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <span className="mr-1">📦</span>
              <span className={getTextColor()}>
                {usageData.savedDecks}/{limits.maxDecks === Infinity ? '∞' : limits.maxDecks} decks
              </span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🤖</span>
              <span className={getTextColor()}>
                {usageData.aiRequestsThisWeek}/{limits.maxAIRequestsPerWeek === Infinity ? '∞' : limits.maxAIRequestsPerWeek} AI requests
              </span>
              {!isPremium && (
                <span className="ml-1 text-gray-500">
                  (resets in {daysUntilReset}d)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {getActionButton()}
        </div>
      </div>

      {/* Warning Messages */}
      {!isPremium && isAtLimit && (
        <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
          <div className="text-sm text-red-800 mb-2">
            <strong>Limit reached!</strong> You've hit your usage limits. Upgrade to Premium for unlimited access.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDirectUpgrade}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Upgrade Now - $3.99
            </button>
            <a
              href={getPaymentUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 border border-red-300 text-red-600 text-sm rounded hover:bg-red-50 transition-colors"
            >
              Direct Link
            </a>
          </div>
        </div>
      )}
      
      {!isPremium && isNearLimit && !isAtLimit && (
        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded">
          <div className="text-sm text-yellow-800 mb-2">
            <strong>Approaching limit!</strong> You're close to your usage limits. Consider upgrading to Premium.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDirectUpgrade}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              Upgrade to Premium
            </button>
            <a
              href={getPaymentUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 border border-yellow-300 text-yellow-600 text-sm rounded hover:bg-yellow-50 transition-colors"
            >
              Direct Payment
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageBanner; 