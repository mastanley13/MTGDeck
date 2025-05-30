// Placeholder for card bucketing logic
console.log("bucketClassify.js loaded"); 

// Card classification constants
const RAMP_KEYWORDS = [
  'add {c}', // Add colorless
  'add {w}', 'add {u}', 'add {b}', 'add {r}', 'add {g}',
  'add one mana of any color',
  'search your library for a basic land card',
  'mana of any type',
  'treasure token',
  'search your library for up to two basic land cards'
];

const DRAW_KEYWORDS = [
  'draw a card',
  'draw two cards',
  'draw three cards',
  'draw cards',
  'scry 1, then draw a card',
  'look at the top'
];

const REMOVAL_KEYWORDS = [
  'destroy target',
  'exile target',
  'return target',
  'counter target',
  'sacrifice',
  'damage to target'
];

const PROTECTION_KEYWORDS = [
  'hexproof',
  'indestructible',
  'protection from',
  'can\'t be countered',
  'regenerate',
  'ward'
];

const TUTOR_KEYWORDS = [
  'search your library for',
  'tutor',
  'transmute',
  'fetch'
];

const FAST_MANA_KEYWORDS = [
  'dark ritual',
  'mana crypt',
  'sol ring',
  'mana vault',
  'chrome mox',
  'mox'
];

const COMBO_KEYWORDS = [
  'infinite',
  'untap target',
  'copy target',
  'create a token that\'s a copy',
  'whenever you cast',
  'whenever a creature enters the battlefield'
];

const INTERACTION_KEYWORDS = [
  'counter target spell',
  'destroy target',
  'exile target',
  'damage to target',
  'return target'
];

/**
 * Classifies a card into functional buckets
 * @param {Object} card - The card object from Scryfall.
 * @returns {string[]} An array of bucket names this card belongs to.
 */
function classifyCard(card) {
  const buckets = new Set();
  const oracleText = card.oracle_text ? card.oracle_text.toLowerCase() : '';
  const typeLine = card.type_line ? card.type_line.toLowerCase() : '';
  const name = card.name ? card.name.toLowerCase() : '';
  const price = card.prices?.usd || 0;

  // Ramp Classification
  if (RAMP_KEYWORDS.some(keyword => oracleText.includes(keyword)) ||
      (typeLine.includes('creature') && oracleText.includes('add') && oracleText.includes('mana'))) {
    buckets.add('ramp');
  }

  // Card Draw Classification
  if (DRAW_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('cardDraw');
  }

  // Removal Classification
  if (REMOVAL_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('removal');
  }

  // Protection Classification
  if (PROTECTION_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('protection');
  }

  // Tutor Classification
  if (TUTOR_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('tutors');
  }

  // Fast Mana Classification
  if (FAST_MANA_KEYWORDS.some(keyword => name.includes(keyword))) {
    buckets.add('fastMana');
  }

  // Combo Classification
  if (COMBO_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('combo');
  }

  // Interaction Classification
  if (INTERACTION_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('interaction');
  }

  // Combat Win Classification
  if (typeLine.includes('creature') && 
      (oracleText.includes('double strike') || 
       oracleText.includes('trample') || 
       oracleText.includes('infect'))) {
    buckets.add('combatWin');
  }

  // Alternative Win Classification
  if (oracleText.includes('you win the game') || 
      oracleText.includes('player loses the game')) {
    buckets.add('alternativeWin');
  }

  // Budget Classification
  const priceNum = parseFloat(price);
  if (priceNum <= 1) buckets.add('budgetCards');
  else if (priceNum <= 5) buckets.add('midCards');
  else if (priceNum <= 20) buckets.add('premiumCards');
  else buckets.add('expensiveCards');

  return Array.from(buckets);
}

/**
 * Calculates the power level of a deck based on various metrics
 * @param {Object} bucketCounts - The counts of cards in each bucket
 * @param {number} averageCMC - The average CMC of the deck
 * @returns {number} - Power level from 1-10
 */
function calculatePowerLevel(bucketCounts, averageCMC) {
  let score = 5; // Start at middle

  // Fast mana increases power
  score += (bucketCounts.fastMana || 0) * 0.5;
  
  // Tutors increase power
  score += (bucketCounts.tutors || 0) * 0.3;
  
  // Interaction pieces are good
  score += Math.min((bucketCounts.interaction || 0) * 0.2, 1);
  
  // Lower average CMC is better
  if (averageCMC <= 2.5) score += 1;
  else if (averageCMC >= 4) score -= 1;

  // Combo potential increases power
  if (bucketCounts.combo > 3) score += 1;
  
  // Cap the score between 1 and 10
  return Math.max(1, Math.min(10, Math.round(score)));
}

/**
 * Generates recommendations based on deck composition
 * @param {Object} bucketCounts - The counts of cards in each bucket
 * @returns {string[]} - Array of recommendations
 */
function generateRecommendations(bucketCounts) {
  const recommendations = [];
  
  if ((bucketCounts.ramp || 0) < 10) {
    recommendations.push("Consider adding more ramp spells to accelerate your mana development");
  }
  
  if ((bucketCounts.cardDraw || 0) < 10) {
    recommendations.push("Add more card draw to improve consistency and maintain hand advantage");
  }
  
  if ((bucketCounts.interaction || 0) < 8) {
    recommendations.push("Include more interaction pieces to control your opponents' threats");
  }
  
  if ((bucketCounts.protection || 0) < 3) {
    recommendations.push("Add protection pieces to keep your key permanents safe");
  }

  return recommendations;
}

/**
 * Generates balance suggestions based on deck composition
 * @param {Object} bucketCounts - The counts of cards in each bucket
 * @returns {string[]} - Array of balance suggestions
 */
function generateBalanceSuggestions(bucketCounts) {
  const suggestions = [];
  
  const totalCards = Object.values(bucketCounts).reduce((a, b) => a + b, 0);
  
  if ((bucketCounts.fastMana || 0) > 5) {
    suggestions.push("High concentration of fast mana might make the deck too explosive for casual pods");
  }
  
  if ((bucketCounts.tutors || 0) > 5) {
    suggestions.push("Consider reducing tutors for more variance and casual-friendly gameplay");
  }
  
  if ((bucketCounts.combo || 0) > 3) {
    suggestions.push("Multiple combo pieces detected - ensure your playgroup is comfortable with combo strategies");
  }

  return suggestions;
}

/**
 * Processes the entire deck and returns counts and analysis for each functional bucket
 * @param {Object[]} cards - Array of card objects in the deck
 * @param {Object} commander - The commander card
 * @returns {Object} An object with counts and analysis for each bucket
 */
export function getFunctionalBuckets(cards, commander) {
  const bucketCounts = {
    ramp: 0,
    cardDraw: 0,
    removal: 0,
    protection: 0,
    tutors: 0,
    fastMana: 0,
    combo: 0,
    interaction: 0,
    combatWin: 0,
    alternativeWin: 0,
    budgetCards: 0,
    midCards: 0,
    premiumCards: 0,
    expensiveCards: 0
  };

  const allCards = commander ? [commander, ...cards] : cards;
  let totalCost = 0;
  let totalCMC = 0;

  allCards.forEach(card => {
    const quantity = card.quantity || 1;
    const classifications = classifyCard(card);
    
    classifications.forEach(bucket => {
      if (bucketCounts[bucket] !== undefined) {
        bucketCounts[bucket] += quantity;
      }
    });

    // Calculate total cost
    if (card.prices?.usd) {
      totalCost += parseFloat(card.prices.usd) * quantity;
    }

    // Calculate average CMC
    if (card.cmc) {
      totalCMC += card.cmc * quantity;
    }
  });

  // Calculate average CMC
  const totalCards = allCards.reduce((sum, card) => sum + (card.quantity || 1), 0);
  const averageCMC = totalCMC / totalCards;

  // Add derived statistics
  bucketCounts.totalCost = totalCost.toFixed(2);
  bucketCounts.averageCMC = averageCMC;
  bucketCounts.powerLevel = calculatePowerLevel(bucketCounts, averageCMC);
  bucketCounts.recommendations = generateRecommendations(bucketCounts);
  bucketCounts.balanceSuggestions = generateBalanceSuggestions(bucketCounts);

  return bucketCounts;
}

console.log("bucketClassify.js loaded with classification functions."); 