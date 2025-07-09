import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';

const UsageDashboard = ({ className = '' }) => {
  const {
    isPremium,
    limits,
    usageData,
    getUsagePercentages,
    getDaysUntilWeeklyReset,
  } = useSubscription();

  const percentages = getUsagePercentages;
  const daysUntilReset = getDaysUntilWeeklyReset;

  const ProgressBar = ({ value, max, color = 'blue', className = '' }) => {
    const percentage = max === Infinity ? 0 : (value / max) * 100;
    const isNearLimit = percentage >= 80;
    
    return (
      <div className={`w-full bg-theme-bg-tertiary rounded-full h-2 ${className}`}>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isNearLimit 
              ? 'bg-gradient-to-r from-red-500 to-red-600' 
              : color === 'blue'
              ? 'bg-gradient-to-r from-theme-accent-blue to-blue-600'
              : 'bg-gradient-to-r from-theme-accent-purple to-purple-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  };

  const StatCard = ({ title, current, max, percentage, icon, isUnlimited }) => (
    <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-bg-tertiary">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-lg mr-2">{icon}</span>
          <h4 className="font-medium text-theme-text-primary">{title}</h4>
        </div>
        <span className="text-sm text-theme-text-secondary">
          {current}/{isUnlimited ? '∞' : max}
        </span>
      </div>
      
      {!isUnlimited && (
        <div className="mb-2">
          <ProgressBar value={current} max={max} />
        </div>
      )}
      
      <div className="text-xs text-theme-text-secondary">
        {isUnlimited ? (
          'Unlimited'
        ) : percentage >= 100 ? (
          <span className="text-red-500 font-medium">Limit reached</span>
        ) : percentage >= 80 ? (
          <span className="text-yellow-600 font-medium">Approaching limit</span>
        ) : (
          `${(100 - percentage).toFixed(0)}% remaining`
        )}
      </div>
    </div>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Subscription Status */}
      <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-bg-tertiary">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {isPremium ? '⭐' : '🆓'}
            </span>
            <div>
              <h3 className="font-semibold text-theme-text-primary">
                {limits.name} Plan
              </h3>
              <p className="text-sm text-theme-text-secondary">
                {isPremium 
                  ? 'Enjoy unlimited access to all features' 
                  : 'Limited access to features'
                }
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-theme-accent-blue">
              ${limits.price}{isPremium ? '/mo' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          title="Saved Decks"
          current={usageData.savedDecks}
          max={limits.maxDecks}
          percentage={percentages.decks}
          icon="📦"
          isUnlimited={isPremium}
        />
        
        <StatCard
          title="AI Requests"
          current={usageData.aiRequestsThisWeek}
          max={limits.maxAIRequestsPerWeek}
          percentage={percentages.aiRequests}
          icon="🤖"
          isUnlimited={isPremium}
        />
      </div>

      {/* Weekly Reset Info */}
      {!isPremium && (
        <div className="text-center text-sm text-theme-text-muted">
          AI requests reset in {daysUntilReset} day{daysUntilReset !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default UsageDashboard; 