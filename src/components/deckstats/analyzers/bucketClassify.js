// Placeholder for card bucketing logic
console.log("bucketClassify.js loaded"); 

const RAMP_KEYWORDS = [
  'add {c}', // Add colorless
  'add {w}', 'add {u}', 'add {b}', 'add {r}', 'add {g}',
  'add one mana of any color',
  'search your library for a basic land card, put it onto the battlefield tapped',
  'mana of any type',
  'treasure token',
  'search your library for up to two basic land cards, put one onto the battlefield tapped and the other into your hand'
  // Add more sophisticated ramp detection keywords/patterns here
];

const DRAW_KEYWORDS = [
  'draw a card',
  'draw two cards',
  'draw three cards',
  'draw cards',
  'scry 1, then draw a card', // Common pattern for cantrips
  'look at the top two cards of your library. put one of them into your hand'
  // Add more sophisticated draw detection keywords/patterns here
];

/**
 * Classifies a card into functional buckets (e.g., Ramp, Draw).
 * A card can belong to multiple buckets if applicable, though this version is simplified.
 * @param {Object} card - The card object from Scryfall.
 * @returns {string[]} An array of bucket names this card belongs to.
 */
function classifyCard(card) {
  const buckets = new Set();
  const oracleText = card.oracle_text ? card.oracle_text.toLowerCase() : '';
  const typeLine = card.type_line ? card.type_line.toLowerCase() : '';

  // Ramp Check
  // Prioritize type line for mana rocks/dorks, then oracle text
  if (typeLine.includes('artifact') && RAMP_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    // Simple check for mana rocks
    if (oracleText.includes('add') && (oracleText.includes('mana') || oracleText.match(/\{\w+\}/g))) {
        buckets.add('Ramp');
    }
  } else if (typeLine.includes('creature') && RAMP_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
     // Simple check for mana dorks
    if (oracleText.includes('add') && (oracleText.includes('mana') || oracleText.match(/\{\w+\}/g))){
        buckets.add('Ramp');
    }
  } else if (RAMP_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    // For land ramp spells or other ramp effects
    buckets.add('Ramp');
  }

  // Draw Check
  if (DRAW_KEYWORDS.some(keyword => oracleText.includes(keyword))) {
    buckets.add('Draw');
  }
  
  // TODO: Add checks for Removal, Wipes, Tutors, Finishers, etc.

  return Array.from(buckets);
}

/**
 * Processes the entire deck and returns counts for each functional bucket.
 * @param {Object[]} cards - Array of card objects in the deck.
 * @param {Object} commander - The commander card (can also have functional roles).
 * @returns {Object} An object with counts for each bucket (e.g., { Ramp: 5, Draw: 10 }).
 */
export function getFunctionalBuckets(cards, commander) {
  const bucketCounts = { Ramp: 0, Draw: 0 /*, Removal: 0, etc. */ }; // Initialize with all potential buckets
  const allCards = commander ? [commander, ...cards] : cards;

  allCards.forEach(card => {
    const quantity = card.quantity || 1; // Commander will have quantity undefined, assume 1
    const classifications = classifyCard(card);
    classifications.forEach(bucket => {
      if (bucketCounts[bucket] !== undefined) {
        bucketCounts[bucket] += quantity;
      } else {
        // This handles if classifyCard starts returning new bucket types not pre-initialized
        bucketCounts[bucket] = quantity;
      }
    });
  });

  return bucketCounts;
}

console.log("bucketClassify.js loaded with classification functions."); 