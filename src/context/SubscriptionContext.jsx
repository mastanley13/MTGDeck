import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getSubscriptionStatus, 
  updateSubscriptionStatus, 
  syncSubscriptionStatus
} from '../utils/ghlSubscriptionAPI';

const SubscriptionContext = createContext(null);

export const useSubscription = () => useContext(SubscriptionContext);

// Premium plan limits
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxDecks: 5,
    maxAIRequestsPerWeek: 5,
    name: 'Free',
    price: 0,
    features: [
      '5 saved decks',
      '5 AI requests per week',
      'Card search',
      'Basic analytics',
      'Free export feature'
    ]
  },
  PREMIUM: {
    maxDecks: Infinity,
    maxAIRequestsPerWeek: Infinity,
    name: 'Premium',
    price: 3.99,
    features: [
      'Unlimited saved decks',
      'Unlimited AI requests',
      'Card search',
      'Basic analytics',
      'Free export feature',
      'Coming soon: Card draw simulation',
      'Coming soon: Hand play out',
      'Coming soon: Advanced analytics'
    ]
  }
};

export const SubscriptionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState('FREE'); // 'FREE' or 'PREMIUM'
  const [usageData, setUsageData] = useState({
    savedDecks: 0,
    aiRequestsThisWeek: 0,
    weekStartDate: null,
  });
  const [loading, setLoading] = useState(true);
  const [ghlSyncLoading, setGhlSyncLoading] = useState(false);

  // Initialize usage data from localStorage and subscription from GHL
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load usage data from localStorage
        const storedUsage = localStorage.getItem('mtg_usage_data');
        
        if (storedUsage) {
          const parsedUsage = JSON.parse(storedUsage);
          
          // Check if we need to reset weekly AI requests
          const now = new Date();
          const weekStart = parsedUsage.weekStartDate ? new Date(parsedUsage.weekStartDate) : now;
          const daysSinceWeekStart = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
          
          if (daysSinceWeekStart >= 7) {
            // Reset weekly counters
            setUsageData({
              ...parsedUsage,
              aiRequestsThisWeek: 0,
              weekStartDate: now.toISOString(),
            });
          } else {
            setUsageData(parsedUsage);
          }
        } else {
          // Initialize usage data
          const initialUsage = {
            savedDecks: 0,
            aiRequestsThisWeek: 0,
            weekStartDate: new Date().toISOString(),
          };
          setUsageData(initialUsage);
          localStorage.setItem('mtg_usage_data', JSON.stringify(initialUsage));
        }

        // Load subscription status from GoHighLevel
        if (currentUser && currentUser.id) {
          try {
            const ghlStatus = await getSubscriptionStatus(currentUser.id);
            setSubscriptionStatus(ghlStatus);
            console.log(`Loaded subscription status from GHL: ${ghlStatus}`);
          } catch (error) {
            console.error('Failed to load subscription status from GHL, using default:', error);
            // Fall back to localStorage if GHL fails
            const storedSubscription = localStorage.getItem('mtg_subscription_status');
            if (storedSubscription) {
              setSubscriptionStatus(storedSubscription);
            }
          }
        } else {
          // No user logged in, try localStorage
          const storedSubscription = localStorage.getItem('mtg_subscription_status');
          if (storedSubscription) {
            setSubscriptionStatus(storedSubscription);
          }
        }
      } catch (error) {
        console.error('Error initializing subscription data:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [currentUser]);

  // Save usage data to localStorage whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('mtg_usage_data', JSON.stringify(usageData));
    }
  }, [usageData, loading]);

  // Save subscription status to localStorage (backup) whenever it changes
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('mtg_subscription_status', subscriptionStatus);
    }
  }, [subscriptionStatus, loading]);

  // Get current limits based on subscription
  const getCurrentLimits = useCallback(() => {
    return SUBSCRIPTION_LIMITS[subscriptionStatus];
  }, [subscriptionStatus]);

  // Check if user can save more decks
  const canSaveMoreDecks = useCallback(() => {
    const limits = getCurrentLimits();
    return usageData.savedDecks < limits.maxDecks;
  }, [usageData.savedDecks, getCurrentLimits]);

  // Check if user can make more AI requests
  const canMakeAIRequest = useCallback(() => {
    const limits = getCurrentLimits();
    return usageData.aiRequestsThisWeek < limits.maxAIRequestsPerWeek;
  }, [usageData.aiRequestsThisWeek, getCurrentLimits]);

  // Increment saved decks count
  const incrementSavedDecks = useCallback(() => {
    setUsageData(prev => ({
      ...prev,
      savedDecks: prev.savedDecks + 1,
    }));
  }, []);

  // Decrement saved decks count
  const decrementSavedDecks = useCallback(() => {
    setUsageData(prev => ({
      ...prev,
      savedDecks: Math.max(0, prev.savedDecks - 1),
    }));
  }, []);

  // Increment AI requests count
  const incrementAIRequests = useCallback(() => {
    setUsageData(prev => ({
      ...prev,
      aiRequestsThisWeek: prev.aiRequestsThisWeek + 1,
    }));
  }, []);

  // Update deck count based on actual saved decks
  const updateDeckCount = useCallback((deckCount) => {
    setUsageData(prev => ({
      ...prev,
      savedDecks: deckCount,
    }));
  }, []);

  // Sync subscription status from GoHighLevel
  const syncWithGoHighLevel = useCallback(async () => {
    if (!currentUser || !currentUser.id) {
      console.log('No user logged in, cannot sync with GoHighLevel');
      return false;
    }

    setGhlSyncLoading(true);
    try {
      const ghlStatus = await syncSubscriptionStatus(currentUser.id, setSubscriptionStatus);
      console.log(`Synced subscription status from GHL: ${ghlStatus}`);
      return true;
    } catch (error) {
      console.error('Error syncing with GoHighLevel:', error);
      return false;
    } finally {
      setGhlSyncLoading(false);
    }
  }, [currentUser]);

  // Get usage percentages for display
  const getUsagePercentages = useCallback(() => {
    const limits = getCurrentLimits();
    
    return {
      decks: limits.maxDecks === Infinity ? 0 : (usageData.savedDecks / limits.maxDecks) * 100,
      aiRequests: limits.maxAIRequestsPerWeek === Infinity ? 0 : (usageData.aiRequestsThisWeek / limits.maxAIRequestsPerWeek) * 100,
    };
  }, [usageData, getCurrentLimits]);

  // Get days until weekly reset
  const getDaysUntilWeeklyReset = useCallback(() => {
    if (!usageData.weekStartDate) return 7;
    
    const weekStart = new Date(usageData.weekStartDate);
    const now = new Date();
    const daysSinceWeekStart = Math.floor((now - weekStart) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, 7 - daysSinceWeekStart);
  }, [usageData.weekStartDate]);

  const value = {
    subscriptionStatus,
    usageData,
    loading,
    ghlSyncLoading,
    isPremium: subscriptionStatus === 'PREMIUM',
    isFree: subscriptionStatus === 'FREE',
    limits: getCurrentLimits(),
    canSaveMoreDecks: canSaveMoreDecks(),
    canMakeAIRequest: canMakeAIRequest(),
    incrementSavedDecks,
    decrementSavedDecks,
    incrementAIRequests,
    updateDeckCount,
    syncWithGoHighLevel,
    getUsagePercentages: getUsagePercentages(),
    getDaysUntilWeeklyReset: getDaysUntilWeeklyReset(),
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 