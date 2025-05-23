import { useState, useCallback } from 'react';
import { useSubscription } from '../context/SubscriptionContext';

export const usePaywall = () => {
  const {
    isPremium,
    canSaveMoreDecks,
    canMakeAIRequest,
    incrementSavedDecks,
    decrementSavedDecks,
    incrementAIRequests,
  } = useSubscription();

  const [paywallModal, setPaywallModal] = useState({
    isOpen: false,
    type: 'deck',
    title: '',
    message: '',
  });

  // Check if user can save a deck and show paywall if not
  const checkDeckSaveLimit = useCallback((onSuccess, customTitle, customMessage) => {
    if (isPremium || canSaveMoreDecks) {
      incrementSavedDecks();
      if (onSuccess) onSuccess();
      return true;
    } else {
      setPaywallModal({
        isOpen: true,
        type: 'deck',
        title: customTitle,
        message: customMessage,
      });
      return false;
    }
  }, [isPremium, canSaveMoreDecks, incrementSavedDecks]);

  // Check if user can make an AI request and show paywall if not
  const checkAIRequestLimit = useCallback((onSuccess, customTitle, customMessage) => {
    if (isPremium || canMakeAIRequest) {
      incrementAIRequests();
      if (onSuccess) onSuccess();
      return true;
    } else {
      setPaywallModal({
        isOpen: true,
        type: 'ai',
        title: customTitle,
        message: customMessage,
      });
      return false;
    }
  }, [isPremium, canMakeAIRequest, incrementAIRequests]);

  // Manually trigger paywall modal
  const showPaywall = useCallback((type = 'deck', title, message) => {
    setPaywallModal({
      isOpen: true,
      type,
      title,
      message,
    });
  }, []);

  // Close paywall modal
  const closePaywall = useCallback(() => {
    setPaywallModal({
      isOpen: false,
      type: 'deck',
      title: '',
      message: '',
    });
  }, []);

  // Decrement deck count (when deleting a deck)
  const handleDeckDeleted = useCallback(() => {
    decrementSavedDecks();
  }, [decrementSavedDecks]);

  return {
    // State
    paywallModal,
    isPremium,
    canSaveMoreDecks,
    canMakeAIRequest,
    
    // Actions
    checkDeckSaveLimit,
    checkAIRequestLimit,
    showPaywall,
    closePaywall,
    handleDeckDeleted,
  };
};

export default usePaywall; 