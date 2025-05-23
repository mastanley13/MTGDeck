import { useState, useCallback } from 'react';
import { getSuggestions, getOpenAIApiKey } from '../utils/openaiAPI';
import { searchCardByName } from '../utils/scryfallAPI';
import { useDeck } from '../context/DeckContext';
import { useSubscription } from '../context/SubscriptionContext';

/**
 * Custom hook for getting and managing AI-generated card suggestions
 * 
 * @param {Object} options - Options for the AI suggestions
 * @param {number} options.maxSuggestions - Maximum number of suggestions to get
 * @param {string} options.model - OpenAI model to use
 * @param {Array} options.categories - Categories to focus on
 * @returns {Object} - Suggestions state and functions
 */
export const useAISuggestions = (options = {}) => {
  const { commander, cards } = useDeck();
  const { canMakeAIRequest, incrementAIRequests, isPremium } = useSubscription();
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  // Always use the hardcoded API key
  const [apiKey] = useState(getOpenAIApiKey());
  const [focusCategories, setFocusCategories] = useState(options.categories || []);
  const [deckTheme, setDeckTheme] = useState('');
  const [maxSuggestions, setMaxSuggestions] = useState(options.maxSuggestions || 15);

  /**
   * Get card suggestions from OpenAI
   */
  const getSuggestionsFromAI = useCallback(async () => {
    if (!commander) {
      setError('Please select a commander first');
      return false;
    }

    // Check paywall limits
    if (!isPremium && !canMakeAIRequest) {
      setPaywallBlocked(true);
      setError('AI request limit reached. Upgrade to Premium for unlimited requests.');
      return false;
    }

    setIsLoading(true);
    setError(null);
    setPaywallBlocked(false);

    try {
      // Increment AI request counter
      if (!isPremium) {
        incrementAIRequests();
      }

      // Get the suggestions from OpenAI using the hardcoded API key
      const aiSuggestions = await getSuggestions(commander, cards, {
        apiKey: getOpenAIApiKey(), // Always use the hardcoded key
        maxSuggestions: maxSuggestions, // Use the state variable instead of options
        model: options.model || 'gpt-4o', // Use GPT-4 by default for better suggestions
        categories: focusCategories,
        deckTheme: deckTheme,
      });

      // Enrich suggestions with card data from Scryfall
      const enrichedSuggestions = await Promise.all(
        aiSuggestions.map(async (suggestion) => {
          try {
            const cardData = await searchCardByName(suggestion.name);
            return {
              ...suggestion,
              card: cardData.data && cardData.data.length > 0 ? cardData.data[0] : null,
            };
          } catch (err) {
            console.warn(`Could not fetch card data for ${suggestion.name}:`, err);
            return suggestion;
          }
        })
      );

      setSuggestions(enrichedSuggestions);
      return true;
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      
      // Provide a user-friendly error message
      if (err.message.includes('API key') || !getOpenAIApiKey()) {
        setError('Service temporarily unavailable. Please try again later or contact support.');
      } else {
        setError(err.message || 'Failed to get AI suggestions');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [commander, cards, focusCategories, deckTheme, maxSuggestions, options.model, isPremium, canMakeAIRequest, incrementAIRequests]);

  /**
   * Update focus categories for suggestions
   * 
   * @param {Array} categories - Categories to focus on
   */
  const updateFocusCategories = useCallback((categories) => {
    setFocusCategories(categories);
  }, []);

  /**
   * Update deck theme/strategy
   * 
   * @param {string} theme - Deck theme or strategy
   */
  const updateDeckTheme = useCallback((theme) => {
    setDeckTheme(theme);
  }, []);

  /**
   * Update the maximum number of suggestions
   * 
   * @param {number} count - Number of suggestions to request
   */
  const updateSuggestionCount = useCallback((count) => {
    setMaxSuggestions(count);
  }, []);

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setPaywallBlocked(false);
  }, []);

  /**
   * Clear paywall blocked state
   */
  const clearPaywallBlocked = useCallback(() => {
    setPaywallBlocked(false);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    paywallBlocked,
    apiKey,
    focusCategories,
    deckTheme,
    canMakeAIRequest,
    isPremium,
    getSuggestions: getSuggestionsFromAI,
    updateFocusCategories,
    updateDeckTheme,
    updateSuggestionCount,
    clearSuggestions,
    clearPaywallBlocked,
  };
};

export default useAISuggestions; 