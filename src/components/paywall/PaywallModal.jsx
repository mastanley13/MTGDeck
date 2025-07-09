import React from 'react';
import { useSubscription, SUBSCRIPTION_LIMITS } from '../../context/SubscriptionContext';
import { getPaymentUrl, initiatePremiumCheckout } from '../../utils/stripeIntegration';
import { useAuth } from '../../context/AuthContext';

const PaywallModal = ({ isOpen, onClose, type = 'deck', title, message }) => {
  const { upgradeToPremium, limits } = useSubscription();
  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleDirectUpgrade = async () => {
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
      // Fallback to subscription page
      upgradeToPremium();
      onClose();
    }
  };

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
        <div className="p-6 border-t border-theme-bg-tertiary">
          <div className="flex flex-col gap-3">
            {/* Primary action - Direct payment */}
            <button
              onClick={handleDirectUpgrade}
              className="w-full px-4 py-3 bg-gradient-to-r from-theme-accent-blue to-theme-accent-purple text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-lg"
            >
              🚀 Pay Now - $3.99/month
            </button>
            
            {/* Alternative options */}
            <div className="flex gap-2">
              <a
                href={getPaymentUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-white border border-theme-accent-blue text-theme-accent-blue rounded-lg hover:bg-theme-accent-blue hover:text-white transition-colors text-center text-sm"
              >
                Direct Link
              </a>
              <button
                onClick={handleUpgrade}
                className="flex-1 px-4 py-2 text-theme-text-secondary border border-theme-bg-tertiary rounded-lg hover:bg-theme-bg-tertiary transition-colors text-sm"
              >
                View Plans
              </button>
            </div>
            
            {/* Dismiss option */}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-theme-text-muted hover:text-theme-text-secondary transition-colors text-sm"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaywallModal; 