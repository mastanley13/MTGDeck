import { getTotalCardCount, getMainDeckCardCount, getAllCards } from './deckHelpers.js';

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
 * Identify game-changing cards in the deck
 * @param {Array} cards - The deck cards array
 * @returns {Array} - Array of game-changing cards
 */
export const getGameChangers = (cards) => {
  if (!cards || !Array.isArray(cards)) {
    return [];
  }

  // List of known game-changing cards (this could be expanded)
  const gameChangingCards = [
    'Sol Ring', 'Mana Crypt', 'Mana Vault', 'Chrome Mox', 'Mox Diamond',
    'Demonic Tutor', 'Vampiric Tutor', 'Imperial Seal', 'Mystical Tutor',
    'Cyclonic Rift', 'Rhystic Study', 'Smothering Tithe', 'Dockside Extortionist',
    'Fierce Guardianship', 'Force of Will', 'Mana Drain', 'Counterspell',
    'Craterhoof Behemoth', 'Avenger of Zendikar', 'Eldrazi Titans'
  ];

  return cards.filter(card => 
    gameChangingCards.includes(card.name) || 
    (card.cmc >= 7 && card.type_line && card.type_line.includes('Creature'))
  );
};

/**
 * Get a full analysis of the deck
 * @param {Object} deck - The deck object with cards and commander
 * @returns {Object} - Full deck analysis
 */
export const analyzeDeck = (deck) => {
  if (!deck || !deck.cards) {
    return null;
  }
  
  // Use standardized functions for consistent counting
  const allCards = getAllCards(deck.cards, deck.commander);  // Include commander in analysis
  const totalCards = getTotalCardCount(deck.cards, deck.commander);  // Total including commander
  const mainDeckCount = getMainDeckCardCount(deck.cards);  // Main deck only
  
  return {
    deckName: deck.name,
    commander: deck.commander ? deck.commander.name : 'Unknown',
    totalCards: totalCards,  // This will now correctly show 100 for complete deck
    mainDeckCards: mainDeckCount,  // This shows the 99 non-commander cards
    hasCommander: !!deck.commander,
    manaCurve: getManaCurve(allCards),  // Include commander in mana curve
    colorDistribution: getColorDistribution(allCards),  // Include commander in colors
    typeBreakdown: getCardTypeBreakdown(allCards),  // Include commander in types
    averageCMC: getAverageCMC(allCards),  // Include commander in average
    gameChangers: getGameChangers(allCards)  // Include commander in game changers
  };
}; 