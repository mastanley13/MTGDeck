// Deck Validation Logic
// This file will contain the validation rules for Commander decks

/**
 * Validates a Commander deck for legality
 * @param {Object} commander - The commander card object
 * @param {Array} cards - Array of cards in the deck
 * @returns {Object} - Validation result with any issues
 */
export const validateDeck = (commander, cards) => {
  // Validation results
  const result = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Check deck size (100 cards including commander)
  if (cards.length + 1 !== 100) {
    result.isValid = false;
    result.errors.push(`Deck must contain exactly 100 cards (currently ${cards.length + 1})`);
  }

  // Check for duplicates (Commander decks are singleton)
  const cardNames = cards.map(card => card.name);
  const uniqueCardNames = new Set(cardNames);
  if (uniqueCardNames.size !== cardNames.length) {
    result.isValid = false;
    result.errors.push('Commander decks must not contain duplicate cards (except basic lands)');
  }

  // Check color identity
  // Will be implemented with actual color identity logic
  
  return result;
};

export default validateDeck; 