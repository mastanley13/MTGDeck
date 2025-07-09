import { useCallback, useEffect } from 'react';
import { useDeck } from '../context/DeckContext';
import { useSubscription } from '../context/SubscriptionContext';

export const useDeckWithPaywall = () => {
  const deckContext = useDeck();
  const { updateDeckCount, canSaveMoreDecks, isPremium, incrementSavedDecks, decrementSavedDecks } = useSubscription();

  const {
    savedDecks,
    saveDeck: originalSaveDeck,
    saveCurrentDeckToGHL: originalSaveToGHL,
    ...restDeckContext
  } = deckContext;

  // Update subscription context when deck count changes
  useEffect(() => {
    updateDeckCount(savedDecks.length);
  }, [savedDecks.length, updateDeckCount]);

  // Enhanced save deck with paywall check
  const saveDeck = useCallback((name, description) => {
    const existingDeck = savedDecks.find(deck => deck.name === name);
    
    // If it's a new deck, check the limit
    if (!existingDeck && !isPremium && !canSaveMoreDecks) {
      return { success: false, reason: 'PAYWALL_LIMIT' }; // Indicate that save was blocked
    }
    
    // Proceed with original save
    originalSaveDeck(name, description);
    
    // Note: We don't increment here because the deck count is tracked via useEffect above
    return { success: true }; // Indicate successful save
  }, [savedDecks, isPremium, canSaveMoreDecks, originalSaveDeck]);

  // Enhanced save to GHL with paywall check
  const saveCurrentDeckToGHL = useCallback(async (contactId, commanderNameForGHL, localDeckName) => {
    const existingDeck = savedDecks.find(deck => deck.name === localDeckName);
    
    // If it's a new deck, check the limit
    if (!existingDeck && !isPremium && !canSaveMoreDecks) {
      return { success: false, reason: 'PAYWALL_LIMIT' }; // Indicate that save was blocked
    }
    
    // Proceed with original save
    const result = await originalSaveToGHL(contactId, commanderNameForGHL, localDeckName);
    
    // Note: We don't increment here because the deck count is tracked via useEffect above
    return { success: result, reason: result ? 'SUCCESS' : 'SAVE_ERROR' };
  }, [savedDecks, isPremium, canSaveMoreDecks, originalSaveToGHL]);

  // Function to delete a deck (decrements counter)
  const deleteDeck = useCallback((deckId) => {
    const deckToDelete = savedDecks.find(deck => deck.id === deckId);
    if (deckToDelete) {
      // Remove from saved decks array
      const updatedDecks = savedDecks.filter(deck => deck.id !== deckId);
      
      // Update the deck context
      if (deckContext.dispatch) {
        deckContext.dispatch({ 
          type: 'INIT_SAVED_DECKS', 
          payload: updatedDecks 
        });
      }
      
      // Note: We don't decrement here because the deck count is tracked via useEffect above
      return true;
    }
    return false;
  }, [savedDecks, deckContext.dispatch]);

  // Check if user can save more decks (for UI display)
  const checkCanSave = useCallback((deckName) => {
    const existingDeck = savedDecks.find(deck => deck.name === deckName);
    
    // If it's an existing deck, always allow save
    if (existingDeck) {
      return { canSave: true, reason: 'EXISTING_DECK' };
    }
    
    // If it's a new deck and user is premium, allow
    if (isPremium) {
      return { canSave: true, reason: 'PREMIUM_USER' };
    }
    
    // If it's a new deck and user has space, allow
    if (canSaveMoreDecks) {
      return { canSave: true, reason: 'WITHIN_LIMIT' };
    }
    
    // Otherwise, block
    return { canSave: false, reason: 'LIMIT_REACHED' };
  }, [savedDecks, isPremium, canSaveMoreDecks]);

  return {
    ...restDeckContext,
    savedDecks,
    saveDeck,
    saveCurrentDeckToGHL,
    deleteDeck,
    canSaveMoreDecks,
    isPremium,
    checkCanSave,
  };
};

export default useDeckWithPaywall; 