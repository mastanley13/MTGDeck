/**
 * Count the number of cards by converted mana cost (CMC)
 * @param {Array} cards - The deck cards array
 * @returns {Object} - Object with CMC as keys and counts as values
 */
export const getManaCurve = (cards) => {
  if (!cards || !Array.isArray(cards)) {
    return {};
  }

  const manaCurve = {};
  
  // Initialize with zeros
  for (let i = 0; i <= 7; i++) {
    manaCurve[i] = 0;
  }
  
  // Filter out lands and count cards by CMC
  cards.forEach(card => {
    const type = card.type_line || '';
    // Skip land cards
    if (type.includes('Land')) {
      return;
    }
    
    const cmc = Math.min(Math.floor(card.cmc || 0), 7); // Group 7+ costs together
    const quantity = card.quantity || 1;
    manaCurve[cmc] = (manaCurve[cmc] || 0) + quantity;
  });
  
  return manaCurve;
};

/**
 * Get the color distribution of cards in the deck
 * @param {Array} cards - The deck cards array
 * @returns {Object} - Object with color as keys and counts as values
 */
export const getColorDistribution = (cards) => {
  if (!cards || !Array.isArray(cards)) {
    return {};
  }
  
  const colors = {
    W: 0, // White
    U: 0, // Blue
    B: 0, // Black
    R: 0, // Red
    G: 0, // Green
    Colorless: 0
  };
  
  // Count cards by color identity
  cards.forEach(card => {
    const quantity = card.quantity || 1;
    
    if (!card.colors || card.colors.length === 0) {
      colors.Colorless += quantity;
      return;
    }
    
    // Count each color in the card
    card.colors.forEach(color => {
      if (colors[color] !== undefined) {
        colors[color] += quantity;
      }
    });
  });
  
  return colors;
};

/**
 * Get card type breakdown for the deck
 * @param {Array} cards - The deck cards array
 * @returns {Object} - Object with card type as keys and counts as values
 */
export const getCardTypeBreakdown = (cards) => {
  if (!cards || !Array.isArray(cards)) {
    return {};
  }
  
  const typeBreakdown = {
    Creature: 0,
    Instant: 0,
    Sorcery: 0,
    Artifact: 0,
    Enchantment: 0,
    Planeswalker: 0,
    Land: 0,
    Other: 0
  };
  
  // Count cards by type
  cards.forEach(card => {
    const quantity = card.quantity || 1;
    const type = card.type_line || '';
    
    if (type.includes('Creature')) {
      typeBreakdown.Creature += quantity;
    } else if (type.includes('Instant')) {
      typeBreakdown.Instant += quantity;
    } else if (type.includes('Sorcery')) {
      typeBreakdown.Sorcery += quantity;
    } else if (type.includes('Artifact')) {
      typeBreakdown.Artifact += quantity;
    } else if (type.includes('Enchantment')) {
      typeBreakdown.Enchantment += quantity;
    } else if (type.includes('Planeswalker')) {
      typeBreakdown.Planeswalker += quantity;
    } else if (type.includes('Land')) {
      typeBreakdown.Land += quantity;
    } else {
      typeBreakdown.Other += quantity;
    }
  });
  
  return typeBreakdown;
};

/**
 * Calculate average converted mana cost of the deck
 * @param {Array} cards - The deck cards array
 * @returns {number} - Average CMC
 */
export const getAverageCMC = (cards) => {
  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return 0;
  }
  
  // Filter out lands which don't have a CMC
  const nonLandCards = cards.filter(card => {
    const type = card.type_line || '';
    return !type.includes('Land');
  });
  
  if (nonLandCards.length === 0) {
    return 0;
  }
  
  // Calculate total CMC and cards
  let totalCMC = 0;
  let totalCards = 0;
  
  nonLandCards.forEach(card => {
    const quantity = card.quantity || 1;
    totalCMC += (card.cmc || 0) * quantity;
    totalCards += quantity;
  });
  
  return totalCards > 0 ? +(totalCMC / totalCards).toFixed(2) : 0;
};

/**
 * Get a full analysis of the deck
 * @param {Object} deck - The deck object
 * @returns {Object} - Full deck analysis
 */
export const analyzeDeck = (deck) => {
  if (!deck || !deck.cards) {
    return null;
  }
  
  return {
    deckName: deck.name,
    commander: deck.commander ? deck.commander.name : 'Unknown',
    totalCards: deck.cards.reduce((total, card) => total + (card.quantity || 1), 0),
    manaCurve: getManaCurve(deck.cards),
    colorDistribution: getColorDistribution(deck.cards),
    typeBreakdown: getCardTypeBreakdown(deck.cards),
    averageCMC: getAverageCMC(deck.cards)
  };
}; 