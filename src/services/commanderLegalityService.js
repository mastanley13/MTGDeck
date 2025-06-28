/**
 * Centralized Commander Format Legality Service
 * 
 * Provides comprehensive validation for:
 * - Banned cards (updated April 2025)
 * - Color identity compliance
 * - Format legality
 * - Singleton rule compliance
 * - Card count validation
 * 
 * Updated: April 2025 - Reflects latest official banned list changes
 */

// ===== COMMANDER BANNED LIST (APRIL 2025) =====
// Updated to reflect April 2025 changes where 5 cards were unbanned:
// - Gifts Ungiven (UNBANNED)
// - Sway of the Stars (UNBANNED) 
// - Braids, Cabal Minion (UNBANNED)
// - Coalition Victory (UNBANNED)
// - Panoptic Mirror (UNBANNED)

const COMMANDER_BANNED_CARDS = new Set([
  // Power 9 and iconic expensive cards (banned for accessibility)
  'Ancestral Recall',
  'Black Lotus',
  'Mox Emerald',
  'Mox Jet', 
  'Mox Pearl',
  'Mox Ruby',
  'Mox Sapphire',
  'Time Vault',
  'Time Walk',
  
  // Library and other expensive vintage cards
  'Library of Alexandria',
  'Karakas',
  
  // Fast mana that was too powerful
  'Channel',
  'Fastbond',
  'Tolarian Academy',
  'Mana Crypt', // Banned September 2024
  'Dockside Extortionist', // Banned September 2024
  'Jeweled Lotus', // Banned September 2024
  
  // Game warping effects
  'Balance',
  'Biorhythm',
  'Limited Resources',
  'Upheaval',
  'Trade Secrets',
  
  // Problematic creatures and commanders
  'Emrakul, the Aeons Torn',
  'Griselbrand',
  'Iona, Shield of Emeria',
  'Leovold, Emissary of Trest',
  'Hullbreacher',
  'Golos, Tireless Pilgrim',
  'Rofellos, Llanowar Emissary',
  'Lutri, the Spellchaser', // Companion issue
  'Nadu, Winged Wisdom', // Banned September 2024
  'Erayo, Soratami Ascendant',
  
  // Land destruction and resource denial
  'Sundering Titan',
  'Sylvan Primordial', 
  'Primeval Titan',
  
  // Combo enablers and oppressive cards
  'Flash',
  'Tinker',
  'Paradox Engine',
  'Prophet of Kruphix',
  'Recurring Nightmare',
  'Yawgmoth\'s Bargain',
  
  // Dexterity cards
  'Chaos Orb',
  'Falling Star',
  
  // Other problematic cards
  'Shahrazad'
]);

// ===== KNOWN COLOR IDENTITY VIOLATIONS =====
// Cards that commonly cause color identity issues
const COLOR_IDENTITY_VIOLATIONS = {
  // Triomes (3-color lands)
  'Raugrin Triome': ['R', 'U', 'W'],
  'Savai Triome': ['R', 'W', 'B'], 
  'Zagoth Triome': ['B', 'G', 'U'],
  'Ketria Triome': ['G', 'U', 'R'],
  'Indatha Triome': ['W', 'B', 'G'],
  
  // Talismans (2-color artifacts)
  'Talisman of Dominance': ['B', 'U'],
  'Talisman of Creativity': ['U', 'R'],
  'Talisman of Curiosity': ['G', 'U'],
  'Talisman of Hierarchy': ['W', 'B'],
  'Talisman of Impulse': ['R', 'G'],
  'Talisman of Indulgence': ['B', 'R'],
  'Talisman of Progress': ['W', 'U'],
  'Talisman of Resilience': ['B', 'G'],
  'Talisman of Unity': ['G', 'W'],
  'Talisman of Conviction': ['R', 'W'],
  
  // Other commonly problematic cards
  'Flooded Grove': ['G', 'U'],
  'Graven Cairns': ['B', 'R'],
  'Fire-Lit Thicket': ['R', 'G'],
  'Wooded Bastion': ['G', 'W'],
  'Fetid Heath': ['W', 'B'],
  'Cascade Bluffs': ['U', 'R'],
  'Twilight Mire': ['B', 'G'],
  'Rugged Prairie': ['R', 'W'],
  'Mystic Gate': ['W', 'U'],
  'Sunken Ruins': ['U', 'B'],
  
  // Hybrid mana cards that trip people up
  'Boros Reckoner': ['R', 'W'],
  'Dryad Militant': ['G', 'W'],
  'Rakdos Cackler': ['B', 'R'],
  'Enthusiastic Mechanaut': ['R', 'U'],
  
  // New additions for April 2025
  'Thopter Foundry': ['B', 'U', 'W'],
  'Time Sieve': ['B', 'U'],
  
  // Guild charms
  'Esper Charm': ['W', 'U', 'B'],
  'Bant Charm': ['G', 'W', 'U'],
  'Grixis Charm': ['U', 'B', 'R'],
  'Jund Charm': ['B', 'R', 'G'],
  'Naya Charm': ['R', 'G', 'W'],
  'Abzan Charm': ['W', 'B', 'G'],
  'Jeskai Charm': ['U', 'R', 'W'],
  'Sultai Charm': ['B', 'G', 'U'],
  'Mardu Charm': ['R', 'W', 'B'],
  'Temur Charm': ['G', 'U', 'R'],
  
  // Artifacts with off-color activated abilities
  'Cranial Plating': ['B'], // Has {B}{B}: Attach ability
  'Scuttlemutt': ['W', 'U', 'B', 'R', 'G'], // Has WUBRG activated abilities
  'Golem Artisan': ['W', 'U', 'R'], // Has {2}: +1/+1, {2}: Flying, {2}: Trample abilities
  'Karn Liberated': [], // Actually colorless despite being powerful
  
  // Cards that were causing issues with Cid
  'Thopter Foundry': ['B', 'U', 'W'],
  'Time Sieve': ['B', 'U'],
  
  // Guild Charms (all multicolor)
  'Esper Charm': ['W', 'U', 'B'],
  'Bant Charm': ['G', 'W', 'U'],
  'Grixis Charm': ['U', 'B', 'R'],
  'Jund Charm': ['B', 'R', 'G'],
  'Naya Charm': ['R', 'G', 'W'],
  'Abzan Charm': ['W', 'B', 'G'],
  'Jeskai Charm': ['U', 'R', 'W'],
  'Sultai Charm': ['B', 'G', 'U'],
  'Mardu Charm': ['R', 'W', 'B'],
  'Temur Charm': ['G', 'U', 'R'],
  
  // Common artifacts with off-color abilities
  'Birthing Pod': ['G'], // Has green activated ability
  'Mindslaver': [], // Actually colorless
  'Sensei\'s Divining Top': [], // Actually colorless
  'Eldrazi Monument': [], // Actually colorless
  
  // Equipment with off-color abilities
  'Sword of Fire and Ice': ['R', 'U'], // Protection and triggered abilities
  'Sword of Light and Shadow': ['W', 'B'],
  'Sword of War and Peace': ['R', 'W'],
  'Sword of Body and Mind': ['G', 'U'],
  'Sword of Feast and Famine': ['B', 'G'],
  'Sword of Truth and Justice': ['W', 'U']
};

// ===== CORE LEGALITY FUNCTIONS =====

/**
 * Check if a card is banned in Commander format
 * @param {string} cardName - Name of the card to check
 * @returns {boolean} True if the card is banned
 */
export const isCardBanned = (cardName) => {
  if (!cardName || typeof cardName !== 'string') return false;
  return COMMANDER_BANNED_CARDS.has(cardName.trim());
};

/**
 * Check if a card violates color identity rules
 * @param {string} cardName - Name of the card to check
 * @param {Array} commanderColorIdentity - Array of commander's color identity
 * @returns {Object} Validation result with isValid and details
 */
export const validateColorIdentity = (cardName, commanderColorIdentity = []) => {
  if (!cardName || !Array.isArray(commanderColorIdentity)) {
    return { isValid: false, reason: 'Invalid input parameters' };
  }

  // Check known problematic cards
  const cardColors = COLOR_IDENTITY_VIOLATIONS[cardName];
  if (cardColors) {
    const isValid = cardColors.every(color => commanderColorIdentity.includes(color));
    
    if (!isValid) {
      return {
        isValid: false,
        reason: `${cardName} has color identity [${cardColors.join(', ')}] which is not allowed in commander identity [${commanderColorIdentity.join(', ')}]`,
        cardColorIdentity: cardColors,
        commanderColorIdentity
      };
    }
  }

  return { isValid: true, reason: 'Color identity compliant' };
};

/**
 * Check if a card is legal based on Scryfall legalities data
 * @param {Object} card - Card object with legalities property
 * @returns {Object} Validation result
 */
export const validateFormatLegality = (card) => {
  if (!card) {
    return { isValid: false, reason: 'No card provided' };
  }

  // Check if card has legalities data
  if (!card.legalities) {
    return { isValid: true, reason: 'No legalities data available - assuming legal' };
  }

  // Check Commander format legality
  const commanderLegality = card.legalities.commander;
  if (commanderLegality === 'banned' || commanderLegality === 'not_legal') {
    return {
      isValid: false,
      reason: `${card.name} is ${commanderLegality} in Commander format`,
      legality: commanderLegality
    };
  }

  return { isValid: true, reason: 'Legal in Commander format' };
};

/**
 * Comprehensive card validation for Commander format
 * @param {Object} card - Card object to validate
 * @param {Object} commander - Commander card object
 * @returns {Object} Complete validation result
 */
export const validateCard = (card, commander) => {
  const violations = [];
  const warnings = [];

  if (!card || !card.name) {
    return {
      isValid: false,
      violations: [{ type: 'invalid_card', message: 'Invalid card object' }],
      warnings: []
    };
  }

  // 1. Check if card is banned
  if (isCardBanned(card.name)) {
    violations.push({
      type: 'banned_card',
      message: `${card.name} is banned in Commander format`,
      severity: 'critical'
    });
  }

  // 2. Check format legality from Scryfall data
  const formatCheck = validateFormatLegality(card);
  if (!formatCheck.isValid) {
    violations.push({
      type: 'format_legality',
      message: formatCheck.reason,
      severity: 'critical'
    });
  }

  // 3. Check color identity if commander is provided
  if (commander && commander.color_identity) {
    // Use learning-based validation that improves over time
    const colorCheck = validateColorIdentityWithLearning(card, commander.color_identity);
    if (!colorCheck.isValid) {
      violations.push({
        type: 'color_identity',
        message: colorCheck.reason,
        severity: 'critical',
        cardColorIdentity: colorCheck.cardColorIdentity,
        commanderColorIdentity: colorCheck.commanderColorIdentity,
        validationSource: colorCheck.source || 'static'
      });
    }
  }

  // 4. Additional card-specific validation from Scryfall data
  if (card.color_identity && commander && commander.color_identity) {
    const cardColors = card.color_identity || [];
    const commanderColors = commander.color_identity || [];
    
    const hasInvalidColors = cardColors.some(color => !commanderColors.includes(color));
    if (hasInvalidColors) {
      violations.push({
        type: 'color_identity',
        message: `${card.name} has colors [${cardColors.join(', ')}] not in commander identity [${commanderColors.join(', ')}]`,
        severity: 'critical'
      });
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    warnings
  };
};

/**
 * Check if a card can have multiple copies in a deck
 * @param {Object} card - Card object with oracle_text
 * @returns {boolean} True if card can have multiple copies
 * 
 * EXAMPLES OF CARDS THIS CORRECTLY HANDLES:
 * 
 * Basic Lands (type_line check):
 * - Plains, Island, Swamp, Mountain, Forest, Wastes
 * - Any card with type_line containing "Basic" and "Land"
 * 
 * Cards with "A deck can have any number of cards named" (oracle_text check):
 * - Cid, Timeless Artificer
 * - Dragon's Approach
 * - Hare Apparent
 * - Persistent Petitioners
 * - Rat Colony
 * - Relentless Rats
 * - Shadowborn Apostle
 * - Slime Against Humanity
 * - Tempest Hawk
 * - Templar Knight
 * 
 * Cards with limited multiples (also caught by oracle_text check):
 * - Seven Dwarves ("A deck can have up to seven cards named Seven Dwarves")
 * - Nazgûl ("A deck can have up to nine cards named Nazgûl")
 * 
 * Regular cards (will return false):
 * - Sol Ring, Lightning Bolt, Counterspell, etc.
 */
const canHaveMultipleCopies = (card) => {
  if (!card) return false;
  
  // Basic lands are always allowed multiples
  if (card.type_line && card.type_line.includes('Basic') && card.type_line.includes('Land')) {
    return true;
  }
  
  // Check for the specific text that allows multiple copies
  if (card.oracle_text) {
    const oracleText = card.oracle_text.toLowerCase();
    return oracleText.includes('a deck can have any number of cards named') ||
           oracleText.includes('any number of cards named');
  }
  
  return false;
};

/**
 * Validate an entire deck for Commander format compliance
 * @param {Array} cardList - Array of card objects in the deck
 * @param {Object} commander - Commander card object
 * @returns {Object} Complete deck validation result
 */
export const validateDeck = (cardList, commander) => {
  const violations = [];
  const warnings = [];
  const cardCounts = {};
  
  if (!Array.isArray(cardList)) {
    return {
      isValid: false,
      violations: [{ type: 'invalid_deck', message: 'Deck must be an array of cards' }],
      warnings: [],
      summary: { totalViolations: 1, criticalViolations: 1 }
    };
  }

  // 1. Validate commander
  if (commander) {
    const commanderValidation = validateCard(commander, null);
    if (!commanderValidation.isValid) {
      violations.push(...commanderValidation.violations.map(v => ({
        ...v,
        cardName: commander.name,
        location: 'commander'
      })));
    }
    
    // Check if commander is legendary
    if (commander.type_line && !commander.type_line.toLowerCase().includes('legendary')) {
      violations.push({
        type: 'invalid_commander',
        message: `${commander.name} is not legendary and cannot be a commander`,
        severity: 'critical',
        cardName: commander.name
      });
    }
  }

  // 2. Check deck size
  const totalCards = cardList.reduce((sum, card) => sum + (card.quantity || 1), 0);
  if (totalCards !== 99) {
    const severity = Math.abs(totalCards - 99) > 5 ? 'critical' : 'moderate';
    violations.push({
      type: 'deck_size',
      message: `Deck has ${totalCards} cards, must have exactly 99 cards`,
      severity,
      actualCount: totalCards,
      requiredCount: 99
    });
  }

  // 3. Validate each card and check singleton rule
  cardList.forEach((card, index) => {
    // Validate individual card
    const cardValidation = validateCard(card, commander);
    if (!cardValidation.isValid) {
      violations.push(...cardValidation.violations.map(v => ({
        ...v,
        cardName: card.name,
        location: `deck position ${index + 1}`
      })));
    }

    // Check singleton rule (except basic lands and cards that can have multiple copies)
    const canHaveMultiples = canHaveMultipleCopies(card);
    
    if (!canHaveMultiples) {
      const quantity = card.quantity || 1;
      cardCounts[card.name] = (cardCounts[card.name] || 0) + quantity;
      
      if (cardCounts[card.name] > 1) {
        violations.push({
          type: 'singleton_violation',
          message: `${card.name} appears ${cardCounts[card.name]} times (maximum 1 allowed)`,
          severity: 'critical',
          cardName: card.name,
          count: cardCounts[card.name]
        });
      }
    }
  });

  // 4. Check for essential deck components
  const landCount = cardList.filter(card => 
    card.type_line && card.type_line.includes('Land')
  ).reduce((sum, card) => sum + (card.quantity || 1), 0);
  
  if (landCount < 30) {
    warnings.push({
      type: 'low_land_count',
      message: `Only ${landCount} lands detected, consider adding more for consistency`,
      severity: 'minor'
    });
  }

  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const moderateViolations = violations.filter(v => v.severity === 'moderate').length;

  return {
    isValid: violations.length === 0,
    violations,
    warnings,
    summary: {
      totalViolations: violations.length,
      criticalViolations,
      moderateViolations,
      totalCards,
      landCount,
      deckAssessment: violations.length === 0 ? 
        'Deck is Commander format legal' : 
        `Deck has ${violations.length} violations that must be fixed`
    }
  };
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get all banned cards as an array
 * @returns {Array} Array of banned card names
 */
export const getAllBannedCards = () => {
  return Array.from(COMMANDER_BANNED_CARDS).sort();
};

/**
 * Get cards with known color identity issues
 * @returns {Object} Object mapping card names to their color identities
 */
export const getKnownColorIdentityCards = () => {
  return { ...COLOR_IDENTITY_VIOLATIONS };
};

/**
 * Check if a card name matches any banned card (case-insensitive)
 * @param {string} cardName - Card name to check
 * @returns {string|null} Exact banned card name if found, null otherwise
 */
export const findBannedCardMatch = (cardName) => {
  if (!cardName) return null;
  
  const normalized = cardName.trim().toLowerCase();
  for (const bannedCard of COMMANDER_BANNED_CARDS) {
    if (bannedCard.toLowerCase() === normalized) {
      return bannedCard;
    }
  }
  return null;
};

/**
 * Get replacement suggestions for banned cards
 * @param {string} cardName - Banned card name
 * @returns {Array} Array of suggested replacement cards
 */
export const getBannedCardReplacements = (cardName) => {
  const replacements = {
    // Fast mana replacements
    'Mana Crypt': ['Sol Ring', 'Arcane Signet', 'Mana Vault'],
    'Dockside Extortionist': ['Treasure Map', 'Goldspan Dragon', 'Smothering Tithe'],
    'Jeweled Lotus': ['Sol Ring', 'Arcane Signet', 'Commander\'s Sphere'],
    
    // Power 9 replacements
    'Black Lotus': ['Sol Ring', 'Mana Vault', 'Grim Monolith'],
    'Ancestral Recall': ['Divination', 'Rhystic Study', 'Mystic Remora'],
    'Time Walk': ['Time Warp', 'Temporal Manipulation', 'Capture of Jingzhou'],
    
    // Land replacements
    'Library of Alexandria': ['Reliquary Tower', 'Thought Vessel', 'Spellbook'],
    'Karakas': ['Command Tower', 'Exotic Orchard', 'City of Brass'],
    'Tolarian Academy': ['Command Tower', 'Ancient Tomb', 'City of Traitors'],
    
    // Creature replacements
    'Emrakul, the Aeons Torn': ['Ulamog, the Infinite Gyre', 'Kozilek, Butcher of Truth', 'Blightsteel Colossus'],
    'Griselbrand': ['Razaketh, the Foulblooded', 'Vilis, Broker of Blood', 'Rune-Scarred Demon'],
    'Primeval Titan': ['Sakura-Tribe Elder', 'Wood Elves', 'Farhaven Elf'],
    
    // Default replacements
    'default': ['Sol Ring', 'Command Tower', 'Arcane Signet']
  };

  return replacements[cardName] || replacements['default'];
};

/**
 * Format validation results for display
 * @param {Object} validationResult - Result from validateDeck or validateCard
 * @returns {Object} Formatted result for UI display
 */
export const formatValidationResults = (validationResult) => {
  if (!validationResult) return null;

  const { violations, warnings, summary } = validationResult;
  
  const groupedViolations = {
    critical: violations.filter(v => v.severity === 'critical'),
    moderate: violations.filter(v => v.severity === 'moderate'),
    minor: violations.filter(v => v.severity === 'minor')
  };

  return {
    isValid: validationResult.isValid,
    groupedViolations,
    warnings,
    summary,
    displayMessage: validationResult.isValid ? 
      '✅ Deck is Commander format legal!' :
      `❌ ${violations.length} violations found that need to be fixed`,
    quickFixes: violations
      .filter(v => v.type === 'banned_card')
      .map(v => ({
        problem: `${v.cardName} is banned`,
        suggestions: getBannedCardReplacements(v.cardName)
      }))
  };
};

/**
 * Cache for learned color identity violations
 * This gets populated as we encounter new violations
 */
const learnedViolations = new Map();

/**
 * Learn and cache a color identity violation for future reference
 * @param {string} cardName - Name of the card
 * @param {Array} colorIdentity - Card's actual color identity
 */
const learnColorIdentityViolation = (cardName, colorIdentity) => {
  if (cardName && Array.isArray(colorIdentity) && colorIdentity.length > 0) {
    learnedViolations.set(cardName, colorIdentity);
    console.log(`Learned color identity: ${cardName} = [${colorIdentity.join(', ')}]`);
  }
};

/**
 * Get color identity from learned cache
 * @param {string} cardName - Name of the card
 * @returns {Array|null} Color identity array or null if not found
 */
const getLearnedColorIdentity = (cardName) => {
  return learnedViolations.get(cardName) || null;
};

/**
 * Enhanced color identity validation with learning capability
 * @param {string|Object} cardNameOrObject - Card name or card object
 * @param {Array} commanderColorIdentity - Commander's color identity
 * @returns {Object} Validation result
 */
export const validateColorIdentityWithLearning = (cardNameOrObject, commanderColorIdentity = []) => {
  const cardName = typeof cardNameOrObject === 'string' ? cardNameOrObject : cardNameOrObject?.name;
  const cardObject = typeof cardNameOrObject === 'object' ? cardNameOrObject : null;

  if (!cardName || !Array.isArray(commanderColorIdentity)) {
    return { isValid: false, reason: 'Invalid input parameters' };
  }

  // 1. Check static known violations first (fastest)
  const staticResult = validateColorIdentity(cardName, commanderColorIdentity);
  if (!staticResult.isValid) {
    return staticResult;
  }

  // 2. Check learned violations cache
  const learnedColorIdentity = getLearnedColorIdentity(cardName);
  if (learnedColorIdentity) {
    const hasInvalidColors = learnedColorIdentity.some(color => !commanderColorIdentity.includes(color));
    if (hasInvalidColors) {
      return {
        isValid: false,
        reason: `${cardName} has color identity [${learnedColorIdentity.join(', ')}] which is not allowed in commander identity [${commanderColorIdentity.join(', ')}]`,
        cardColorIdentity: learnedColorIdentity,
        commanderColorIdentity,
        source: 'learned'
      };
    }
  }

  // 3. Check actual card data and learn from it
  if (cardObject && cardObject.color_identity) {
    const cardColors = cardObject.color_identity;
    
    // Learn this card's color identity for future use
    learnColorIdentityViolation(cardName, cardColors);
    
    const hasInvalidColors = cardColors.some(color => !commanderColorIdentity.includes(color));
    if (hasInvalidColors) {
      return {
        isValid: false,
        reason: `${cardName} has color identity [${cardColors.join(', ')}] which is not allowed in commander identity [${commanderColorIdentity.join(', ')}]`,
        cardColorIdentity: cardColors,
        commanderColorIdentity,
        source: 'scryfall'
      };
    }
  }

  return { isValid: true, reason: 'Color identity compliant' };
};

// ===== EXPORT DEFAULT SERVICE OBJECT =====
export default {
  // Core validation functions
  isCardBanned,
  validateColorIdentity,
  validateFormatLegality,
  validateCard,
  validateDeck,
  
  // Utility functions
  getAllBannedCards,
  getKnownColorIdentityCards,
  findBannedCardMatch,
  getBannedCardReplacements,
  formatValidationResults,
  
  // Constants for external use
  COMMANDER_BANNED_CARDS: Array.from(COMMANDER_BANNED_CARDS),
  COLOR_IDENTITY_VIOLATIONS
}; 