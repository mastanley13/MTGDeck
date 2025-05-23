import React from 'react';
import { useSubscription, SUBSCRIPTION_LIMITS } from '../../context/SubscriptionContext';

const PaywallModal = ({ isOpen, onClose, type = 'deck', title, message }) => {
  const { upgradeToPremium, limits } = useSubscription();

  if (!isOpen) return null;

  const handleUpgrade = () => {
    upgradeToPremium();
    onClose();
  };

  const getTypeSpecificContent = () => {
    switch (type) {
      case 'deck':
        return {
          title: title || 'Deck Limit Reached',
          message: message || `You've reached the maximum of ${limits.maxDecks} saved decks on the free plan.`,
          icon: '📦',
        };
      case 'ai':
        return {
          title: title || 'AI Request Limit Reached',
          message: message || `You've reached the maximum of ${limits.maxAIRequestsPerWeek} AI requests this week on the free plan.`,
          icon: '🤖',
        };
      default:
        return {
          title: title || 'Upgrade Required',
          message: message || 'This feature requires a premium subscription.',
          icon: '⭐',
        };
    }
  };

  const content = getTypeSpecificContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-theme-bg-secondary rounded-xl shadow-2xl max-w-md w-full border border-theme-bg-tertiary">
        {/* Header */}
        <div className="p-6 text-center border-b border-theme-bg-tertiary">
          <div className="text-4xl mb-2">{content.icon}</div>
          <h2 className="text-xl font-bold text-theme-text-primary mb-2">
            {content.title}
          </h2>
          <p className="text-theme-text-secondary text-sm">
            {content.message}
          </p>
        </div>

        {/* Premium Features */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
            Upgrade to Premium
          </h3>
          
          <div className="space-y-3 mb-6">
            {SUBSCRIPTION_LIMITS.PREMIUM.features ? (
              SUBSCRIPTION_LIMITS.PREMIUM.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-theme-text-secondary">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </div>
              ))
            ) : (
              <>
                <div className="flex items-center text-sm text-theme-text-secondary">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited deck saves
                </div>
                <div className="flex items-center text-sm text-theme-text-secondary">
                  <span className="text-green-500 mr-2">✓</span>
                  Unlimited AI suggestions
                </div>
                <div className="flex items-center text-sm text-theme-text-secondary">
                  <span className="text-green-500 mr-2">✓</span>
                  Priority AI responses
                </div>
                <div className="flex items-center text-sm text-theme-text-secondary">
                  <span className="text-green-500 mr-2">✓</span>
                  Advanced deck analytics
                </div>
                <div className="flex items-center text-sm text-theme-text-secondary">
                  <span className="text-green-500 mr-2">✓</span>
                  Cloud sync across devices
                </div>
              </>
            )}
          </div>

          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-theme-accent-blue">
              ${SUBSCRIPTION_LIMITS.PREMIUM.price}
              <span className="text-sm font-normal text-theme-text-secondary">/month</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-theme-bg-tertiary flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-theme-text-secondary border border-theme-bg-tertiary rounded-lg hover:bg-theme-bg-tertiary transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-theme-accent-blue to-theme-accent-purple text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal; 