/**
 * Utility functions for validating a Commander deck
 */

import { useMemo } from 'react';

/**
 * Check if the deck has exactly 100 cards including the commander
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Object} Validation result with status and message
 */
export const validateCardCount = (commander, cards) => {
  const deckCount = cards.reduce((total, card) => total + (card.quantity || 1), 0);
  
  // Commander decks should have exactly 99 cards in the main deck (commander is separate)
  if (!commander) {
    return {
      valid: false,
      message: 'No commander selected. A Commander deck must have a commander and exactly 99 other cards.',
    };
  }
  
  // Check if commander is accidentally included in cards array
  const commanderInDeck = cards.some(card => card.name === commander.name);
  if (commanderInDeck) {
    // If commander is in deck, we expect 100 total cards (99 + commander)
    if (deckCount < 100) {
      return {
        valid: false,
        message: `Deck contains ${deckCount} cards (including commander). A Commander deck must contain exactly 100 cards total.`,
      };
    } else if (deckCount > 100) {
      return {
        valid: false,
        message: `Deck contains ${deckCount} cards (including commander). A Commander deck must contain exactly 100 cards total.`,
      };
    }
    return { valid: true, message: 'Deck has exactly 100 cards including commander.' };
  } else {
    // Normal case: commander is separate, expect 99 cards in main deck
    if (deckCount < 99) {
      return {
        valid: false,
        message: `Deck contains ${deckCount} cards. A Commander deck must contain exactly 99 cards (plus commander = 100 total).`,
      };
    } else if (deckCount > 99) {
      return {
        valid: false,
        message: `Deck contains ${deckCount} cards. A Commander deck must contain exactly 99 cards (plus commander = 100 total).`,
      };
    }
    return { valid: true, message: 'Deck has exactly 99 cards plus commander (100 total).' };
  }
};

/**
 * Check if all cards in the deck comply with the commander's color identity
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Object} Validation result with status, message, and violating cards
 */
export const validateColorIdentity = (commander, cards) => {
  if (!commander) {
    return {
      valid: false,
      message: 'No commander selected.',
      violations: [],
    };
  }
  
  const commanderColors = commander.color_identity || [];
  const violations = [];
  
  cards.forEach(card => {
    const cardColors = card.color_identity || [];
    
    // Check if any of the card's colors are not in the commander's color identity
    const isCompliant = cardColors.every(color => commanderColors.includes(color));
    
    if (!isCompliant) {
      violations.push({
        card,
        reason: `Color identity (${cardColors.join('')}) not allowed in ${commander.name}'s color identity (${commanderColors.join('')}).`,
      });
    }
  });
  
  if (violations.length > 0) {
    return {
      valid: false,
      message: `${violations.length} cards violate the commander's color identity.`,
      violations,
    };
  }
  
  return { valid: true, message: 'All cards match the commander\'s color identity.', violations: [] };
};

/**
 * Check if the deck follows the singleton rule (only one copy of each card except basic lands)
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Object} Validation result with status, message, and violating cards
 */
export const validateSingleton = (cards) => {
  const cardCounts = {};
  const violations = [];
  
  cards.forEach(card => {
    const cardName = card.name;
    const quantity = card.quantity || 1;
    
    // Basic lands are exempt from the singleton rule
    const isBasicLand = card.type_line && 
      card.type_line.includes('Basic') && 
      card.type_line.includes('Land');
    
    if (!isBasicLand) {
      if (!cardCounts[cardName]) {
        cardCounts[cardName] = quantity;
      } else {
        cardCounts[cardName] += quantity;
      }
      
      if (cardCounts[cardName] > 1) {
        violations.push({
          card,
          reason: `Multiple copies (${cardCounts[cardName]}) of ${cardName} found.`,
        });
      }
    }
  });
  
  if (violations.length > 0) {
    return {
      valid: false,
      message: `${violations.length} cards violate the singleton rule.`,
      violations,
    };
  }
  
  return { valid: true, message: 'Deck follows the singleton rule.', violations: [] };
};

/**
 * Check if all cards in the deck are legal in the Commander format
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Object} Validation result with status, message, and violating cards
 */
export const validateFormatLegality = (commander, cards) => {
  const violations = [];
  
  // Check commander legality
  if (commander && commander.legalities) {
    if (commander.legalities.commander !== 'legal') {
      violations.push({
        card: commander,
        reason: `${commander.name} is not legal as a commander.`,
      });
    }
  }
  
  // Check card legalities
  cards.forEach(card => {
    if (card.legalities && card.legalities.commander !== 'legal') {
      violations.push({
        card,
        reason: `${card.name} is not legal in Commander format.`,
      });
    }
  });
  
  if (violations.length > 0) {
    return {
      valid: false,
      message: `${violations.length} cards are not legal in Commander format.`,
      violations,
    };
  }
  
  return { valid: true, message: 'All cards are legal in Commander format.', violations: [] };
};

/**
 * Perform all validation checks on a deck
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Array} Array of validation results
 */
export const validateDeck = (commander, cards) => {
  return [
    {
      name: 'Card Count',
      ...validateCardCount(commander, cards),
    },
    {
      name: 'Color Identity',
      ...validateColorIdentity(commander, cards),
    },
    {
      name: 'Singleton Rule',
      ...validateSingleton(cards),
    },
    {
      name: 'Format Legality',
      ...validateFormatLegality(commander, cards),
    },
  ];
};

/**
 * Check if a deck is valid overall
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Boolean} Whether the deck is valid
 */
export const isDeckValid = (commander, cards) => {
  const validations = validateDeck(commander, cards);
  return validations.every(validation => validation.valid);
};

/**
 * Check if a single card is valid for the commander deck
 * @param {Object} card - The card object to validate
 * @param {Object} commander - The commander card object
 * @returns {Object} Validation result with status and message
 */
export const validateCardForCommander = (card, commander) => {
  if (!commander) {
    return {
      valid: false,
      message: 'No commander selected.',
    };
  }

  if (!card) {
    return {
      valid: false,
      message: 'No card provided.',
    };
  }

  const commanderColors = commander.color_identity || [];
  const cardColors = card.color_identity || [];

  // Check color identity compliance
  const isColorCompliant = cardColors.every(color => commanderColors.includes(color));
  
  if (!isColorCompliant) {
    return {
      valid: false,
      message: `${card.name} has color identity (${cardColors.join('')}) that is not allowed in ${commander.name}'s color identity (${commanderColors.join('')}).`,
    };
  }

  // Check format legality
  if (card.legalities && card.legalities.commander !== 'legal') {
    return {
      valid: false,
      message: `${card.name} is not legal in Commander format.`,
    };
  }

  return { 
    valid: true, 
    message: `${card.name} is valid for this commander deck.` 
  };
};

// Memoization cache for validation results
const validationCache = new Map();
const CACHE_SIZE_LIMIT = 1000;

// Helper to manage cache size
const maintainCacheSize = () => {
  if (validationCache.size > CACHE_SIZE_LIMIT) {
    // Remove oldest entries when cache gets too large
    const entriesToRemove = Array.from(validationCache.keys()).slice(0, Math.floor(CACHE_SIZE_LIMIT * 0.2));
    entriesToRemove.forEach(key => validationCache.delete(key));
  }
};

// Memoized color identity check
export const isColorIdentityCompliant = (card, commander) => {
  const cacheKey = `colorIdentity_${card?.id}_${commander?.id}`;
  
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }

  // If no commander, assume all colors are valid
  if (!commander) {
    const result = { isCompliant: true, message: '' };
    validationCache.set(cacheKey, result);
    maintainCacheSize();
    return result;
  }

  // Rest of your existing color identity validation logic here
  // ... existing code ...

  // Cache the result before returning
  validationCache.set(cacheKey, result);
  maintainCacheSize();
  return result;
};

// Memoized format legality check
export const isFormatLegal = (card, format = 'commander') => {
  const cacheKey = `formatLegal_${card?.id}_${format}`;
  
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }

  // Your existing format legality validation logic here
  // ... existing code ...

  // Cache the result before returning
  validationCache.set(cacheKey, result);
  maintainCacheSize();
  return result;
};

// Hook for memoized deck validation
export const useDeckValidation = (commander, cards) => {
  return useMemo(() => {
    return validateDeck(commander, cards);
  }, [commander?.id, JSON.stringify(cards.map(c => c.id))]);
}; 