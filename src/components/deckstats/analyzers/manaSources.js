// Placeholder for mana source analysis logic
console.log("manaSources.js loaded"); 

/**
 * Identifies the colors of mana a card can produce.
 * This is a simplified version and can be expanded to handle complex cases.
 * @param {Object} card - The card object from Scryfall.
 * @returns {string[]} An array of color characters (W, U, B, R, G) or ['Colorless'] or [].
 */
function getManaProducingColors(card) {
  const colorsProduced = new Set();
  const oracleText = card.oracle_text ? card.oracle_text.toLowerCase() : '';
  const typeLine = card.type_line ? card.type_line.toLowerCase() : '';

  // Basic lands
  if (typeLine.includes('basic')) {
    if (typeLine.includes('plains')) colorsProduced.add('W');
    if (typeLine.includes('island')) colorsProduced.add('U');
    if (typeLine.includes('swamp')) colorsProduced.add('B');
    if (typeLine.includes('mountain')) colorsProduced.add('R');
    if (typeLine.includes('forest')) colorsProduced.add('G');
    if (typeLine.includes('wastes')) colorsProduced.add('C'); // For Wastes basic land
    return colorsProduced.size > 0 ? Array.from(colorsProduced) : [];
  }

  // Check oracle text for mana abilities
  // This is a very simplified check. Real mana abilities are complex.
  // Example: "{T}: Add {G}."
  const manaAddRegex = /add\s*(\{[WUBRGCX0-9]+\})+/g;
  let match;
  while ((match = manaAddRegex.exec(oracleText)) !== null) {
    const symbols = match[0].match(/\{([WUBRGCX0-9]+)\}/g) || [];
    symbols.forEach(symbolWithBraces => {
      const symbol = symbolWithBraces.substring(1, symbolWithBraces.length - 1);
      if (['W', 'U', 'B', 'R', 'G'].includes(symbol.toUpperCase())) {
        colorsProduced.add(symbol.toUpperCase());
      }
      if (symbol.toUpperCase() === 'C') {
        colorsProduced.add('C');
      }
      // Ignores generic mana like {1}, {2} or variable like {X}
    });
  }
  
  // Consider card's color identity if it's a land and doesn't explicitly add colored mana (e.g. Command Tower)
  // This is a heuristic and might not always be accurate for all lands.
  if (typeLine.includes('land') && colorsProduced.size === 0 && card.color_identity) {
    card.color_identity.forEach(ciColor => colorsProduced.add(ciColor));
  }

  // If after all checks, no specific colors found, but it might be a generic mana rock
  // For now, we are primarily interested in colored sources.
  // Could add a check for "add mana of any color" later.

  return colorsProduced.size > 0 ? Array.from(colorsProduced) : [];
}

/**
 * Calculates the number of sources for each color of mana.
 * @param {Object[]} cards - Array of card objects in the deck.
 * @param {Object} commander - The commander card object.
 * @returns {Object} An object with counts for each color (W, U, B, R, G, C) and Multi.
 */
export function calculateManaSources(cards, commander) {
  const sources = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0, Multi: 0 };
  const allCards = commander ? [commander, ...cards] : cards; // Consider commander as a source if applicable

  allCards.forEach(card => {
    const quantity = card.quantity || 1;
    const produced = getManaProducingColors(card);

    if (produced.length > 1) {
      let isMultiColorSource = false;
      produced.forEach(color => {
        if (sources[color] !== undefined) {
          sources[color] += quantity;
          isMultiColorSource = true;
        } else if (color === 'C') {
           sources.C += quantity;
        }
      });
      if (isMultiColorSource) {
        // Only increment multi if it produces at least two WUBRG colors
        const wubrgProduced = produced.filter(c => c !== 'C');
        if (wubrgProduced.length > 1) {
            sources.Multi += quantity;
        }
      }
    } else if (produced.length === 1) {
      const color = produced[0];
      if (sources[color] !== undefined) {
        sources[color] += quantity;
      } else if (color === 'C') {
        sources.C += quantity;
      }
    }
  });

  return sources;
}

/**
 * Calculates the color pip requirements for the deck.
 * @param {Object[]} cards - Array of card objects in the deck.
 * @param {Object} commander - The commander card object.
 * @returns {Object} An object with pip counts for each color (W, U, B, R, G).
 */
export function calculatePipRequirements(cards, commander) {
  const pips = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  const allCards = commander ? [commander, ...cards] : cards;

  allCards.forEach(card => {
    const quantity = card.quantity || 1;
    const manaCost = card.mana_cost;

    if (manaCost) {
      const symbols = manaCost.match(/\{(.*?)\}/g)?.map(s => s.substring(1, s.length - 1)) || [];
      symbols.forEach(symbol => {
        const upperSymbol = symbol.toUpperCase();
        if (pips[upperSymbol] !== undefined) {
          // Basic colored pips
          pips[upperSymbol] += quantity;
        } else if (symbol.includes('/')) {
          // Handle hybrid pips by assuming the player can pay any of its colors.
          // For pip requirements, we often count the easiest-to-cast option or sum them up.
          // Simplified: count one for each color component of a hybrid pip.
          // More advanced: consider which color is more constrained by commander ID.
          const hybridParts = symbol.split('/');
          hybridParts.forEach(part => {
            // phyrexian mana is like {W/P} - P is not a color
            if (pips[part.toUpperCase()] !== undefined) {
              pips[part.toUpperCase()] += quantity;
            }
          });
        }
        // Phyrexian mana like {W/P} also implies a W pip if paid with life.
        // This simplification counts it as a requirement for that color.
      });
    }
  });
  return pips;
}

console.log("manaSources.js loaded with calculation functions."); 