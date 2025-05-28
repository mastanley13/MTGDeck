/**
 * Utility functions for validating a Commander deck
 */

/**
 * Check if the deck has exactly 100 cards including the commander
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of card objects in the deck
 * @returns {Object} Validation result with status and message
 */
export const validateCardCount = (commander, cards) => {
  const commanderCount = commander ? 1 : 0;
  const deckCount = cards.reduce((total, card) => total + (card.quantity || 1), 0);
  const totalCount = commanderCount + deckCount;
  
  if (totalCount < 100) {
    return {
      valid: false,
      message: `Deck contains ${totalCount} cards. A Commander deck must contain exactly 100 cards including the commander.`,
    };
  } else if (totalCount > 100) {
    return {
      valid: false,
      message: `Deck contains ${totalCount} cards. A Commander deck must contain exactly 100 cards including the commander.`,
    };
  }
  
  return { valid: true, message: 'Deck has exactly 100 cards.' };
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