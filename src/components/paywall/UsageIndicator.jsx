import React from 'react';
import { useSubscription } from '../../context/SubscriptionContext';

const UsageIndicator = ({ type = 'deck', inline = false, showIcon = true }) => {
  const { isPremium, limits, usageData, upgradeToPremium } = useSubscription();

  if (isPremium) {
    return (
      <div className={`${inline ? 'inline-flex' : 'flex'} items-center text-xs text-theme-text-muted`}>
        {showIcon && <span className="mr-1">⭐</span>}
        <span>Premium</span>
      </div>
    );
  }

  const getUsageInfo = () => {
    switch (type) {
      case 'deck':
        return {
          current: usageData.savedDecks,
          max: limits.maxDecks,
          icon: '📦',
          label: 'decks',
        };
      case 'ai':
        return {
          current: usageData.aiRequestsThisWeek,
          max: limits.maxAIRequestsPerWeek,
          icon: '🤖',
          label: 'AI requests',
        };
      default:
        return null;
    }
  };

  const usage = getUsageInfo();
  if (!usage) return null;

  const percentage = (usage.current / usage.max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage.current >= usage.max;

  const getStatusColor = () => {
    if (isAtLimit) return 'text-red-500';
    if (isNearLimit) return 'text-yellow-500';
    return 'text-theme-text-secondary';
  };

  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-theme-accent-blue';
  };

  return (
    <div className={`${inline ? 'inline-flex' : 'flex'} items-center space-x-2`}>
      {showIcon && (
        <span className="text-sm">{usage.icon}</span>
      )}
      
      <div className="flex items-center space-x-1">
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {usage.current}/{usage.max}
        </span>
        
        {!inline && (
          <div className="w-12 bg-theme-bg-tertiary rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
      </div>

      {isAtLimit && (
        <button
          onClick={upgradeToPremium}
          className="text-xs text-theme-accent-blue hover:text-theme-accent-purple transition-colors font-medium"
        >
          Upgrade
        </button>
      )}
    </div>
  );
};

export default UsageIndicator; 