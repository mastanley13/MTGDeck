/**
 * Deck Helper Utilities
 * Standardized functions for deck operations and card counting
 */

/**
 * Get total card count including commander
 * @param {Object} deckData - Object containing cards array and commander
 * @returns {number} - Total cards including commander (should be 100 for complete deck)
 */
export const getTotalCardCount = (deckData) => {
  // Handle case where deckData is passed directly as an array (backwards compatibility)
  if (Array.isArray(deckData)) {
    return deckData.reduce((total, card) => total + (card.quantity || 1), 0);
  }

  // Handle case where deckData is an object with cards and commander properties
  if (deckData && typeof deckData === 'object') {
    const cards = Array.isArray(deckData.cards) ? deckData.cards : [];
    const mainDeckCount = cards.reduce((total, card) => total + (card.quantity || 1), 0);
    const commanderCount = deckData.commander ? 1 : 0;
    return mainDeckCount + commanderCount;
  }

  // If neither case matches, return 0
  console.warn('getTotalCardCount: Invalid input format:', deckData);
  return 0;
};

/**
 * Get main deck card count (excluding commander)
 * @param {Array|Object} deckData - Array of cards or object containing cards array
 * @returns {number} - Total non-commander cards (should be 99 for complete deck)
 */
export const getMainDeckCardCount = (deckData) => {
  // Handle case where deckData is passed directly as an array (backwards compatibility)
  if (Array.isArray(deckData)) {
    return deckData.reduce((total, card) => total + (card.quantity || 1), 0);
  }

  // Handle case where deckData is an object with cards property
  if (deckData && typeof deckData === 'object' && Array.isArray(deckData.cards)) {
    return deckData.cards.reduce((total, card) => total + (card.quantity || 1), 0);
  }

  // If neither case matches, return 0
  console.warn('getMainDeckCardCount: Invalid input format:', deckData);
  return 0;
};

/**
 * Get all cards including commander for analysis
 * @param {Array} cards - Array of main deck cards
 * @param {Object} commander - Commander card object
 * @returns {Array} - All cards including commander
 */
export const getAllCards = (cards = [], commander = null) => {
  // Validate that cards is an array
  if (!Array.isArray(cards)) {
    console.warn('getAllCards: cards parameter is not an array:', cards);
    return commander ? [commander] : [];
  }
  
  if (!commander) return cards;
  return [commander, ...cards];
};

/**
 * Check if deck is complete (100 cards total)
 * @param {Object} deckData - Object containing cards array and commander
 * @returns {boolean} - True if deck has exactly 100 cards
 */
export const isDeckComplete = (deckData) => {
  return getTotalCardCount(deckData) === 100;
};

/**
 * Check if main deck is full (99 cards)
 * @param {Object} deckData - Object containing cards array
 * @returns {boolean} - True if main deck has exactly 99 cards
 */
export const isMainDeckFull = (deckData) => {
  return getMainDeckCardCount(deckData) >= 99;
};

/**
 * Get deck completion info
 * @param {Object} deckData - Object containing cards array and commander
 * @returns {Object} - Object with completion details
 */
export const getDeckCompletionInfo = (deckData) => {
  const mainDeckCount = getMainDeckCardCount(deckData);
  const totalCount = getTotalCardCount(deckData);
  const hasCommander = !!deckData.commander;
  
  return {
    mainDeckCount,
    totalCount,
    hasCommander,
    isComplete: totalCount === 100,
    isMainDeckFull: mainDeckCount >= 99,
    remainingSlots: Math.max(0, 99 - mainDeckCount),
    totalRemainingSlots: Math.max(0, 100 - totalCount)
  };
};

/**
 * Validate deck structure and fix common issues
 * @param {Object} deck - Deck object
 * @returns {Object|null} - Fixed deck object or null if invalid
 */
export const validateDeckStructure = (deck) => {
  if (!deck || typeof deck !== 'object') {
    console.warn('Invalid deck object provided to validateDeckStructure');
    return null;
  }

  // Ensure cards array exists and is valid
  if (!Array.isArray(deck.cards)) {
    console.warn('Deck cards is not an array, initializing empty array. Current value:', deck.cards);
    deck.cards = [];
  }
  
  // Filter out any invalid card objects
  const originalCardsLength = deck.cards.length;
  deck.cards = deck.cards.filter(card => {
    if (!card || typeof card !== 'object') {
      console.warn('Removing invalid card object:', card);
      return false;
    }
    if (!card.id) {
      console.warn('Removing card without ID:', card);
      return false;
    }
    return true;
  });
  
  if (deck.cards.length !== originalCardsLength) {
    console.log(`Filtered out ${originalCardsLength - deck.cards.length} invalid cards`);
  }

  // Ensure commander is properly structured
  if (deck.commander && typeof deck.commander !== 'object') {
    console.warn('Commander is not a proper object, removing');
    deck.commander = null;
  }

  // Remove commander from main deck cards if it exists there (prevent double counting)
  if (deck.commander) {
    const commanderId = deck.commander.id;
    const originalLength = deck.cards.length;
    deck.cards = deck.cards.filter(card => card.id !== commanderId);
    
    if (deck.cards.length !== originalLength) {
      console.log(`Removed commander ${deck.commander.name} from main deck to prevent double counting`);
    }
  }

  // Validate card quantities
  deck.cards = deck.cards.map(card => {
    if (!card.quantity || card.quantity < 1) {
      card.quantity = 1;
    }
    return card;
  });

  // Ensure required fields exist
  deck.name = deck.name || 'Untitled Deck';
  deck.description = deck.description || '';
  deck.cardCategories = deck.cardCategories || {};
  deck.lastUpdated = deck.lastUpdated || new Date().toISOString();

  return deck;
};

/**
 * Get card type for categorization
 * @param {Object} card - Card object
 * @returns {string} - Card type category
 */
export const getCardType = (card) => {
  const typeLine = card.type_line || '';
  
  if (typeLine.includes('Land')) {
    return 'Lands';
  } else if (typeLine.includes('Creature')) {
    return 'Creatures';
  } else if (typeLine.includes('Artifact')) {
    if (typeLine.includes('Creature')) {
      return 'Creatures';
    }
    return 'Artifacts';
  } else if (typeLine.includes('Enchantment')) {
    if (typeLine.includes('Creature')) {
      return 'Creatures';
    }
    return 'Enchantments';
  } else if (typeLine.includes('Planeswalker')) {
    return 'Planeswalkers';
  } else if (typeLine.includes('Instant')) {
    return 'Instants';
  } else if (typeLine.includes('Sorcery')) {
    return 'Sorceries';
  } else {
    return 'Other';
  }
}; 