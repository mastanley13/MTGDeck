// List of all official Game Changers as of April 2025
const GAME_CHANGERS = [
  'Drannith Magistrate', 'Enlightened Tutor', 'Humility', "Serra's Sanctum",
  'Smothering Tithe', "Teferi's Protection", 'Consecrated Sphinx', 'Cyclonic Rift',
  'Expropriate', 'Force of Will', 'Fierce Guardianship', 'Gifts Ungiven',
  'Intuition', 'Jin-Gitaxias, Core Augur', 'Mystical Tutor', 'Narset, Parter of Veils',
  'Rhystic Study', 'Sway of the Stars', "Thassa's Oracle", 'Urza, Lord High Artificer',
  "Bolas's Citadel", 'Braids, Cabal Minion', 'Demonic Tutor', 'Imperial Seal',
  'Necropotence', 'Opposition Agent', 'Orcish Bowmasters', 'Tergrid, God of Fright',
  'Vampiric Tutor', 'Ad Nauseam', 'Deflecting Swat', 'Gamble', "Jeska's Will",
  'Underworld Breach', 'Crop Rotation', 'Food Chain', "Gaea's Cradle",
  'Natural Order', 'Seedborn Muse', 'Survival of the Fittest', 'Vorinclex, Voice of Hunger',
  'Worldly Tutor', 'Aura Shards', 'Coalition Victory', 'Grand Arbiter Augustin IV',
  'Kinnan, Bonder Prodigy', 'Yuriko, the Tiger\'s Shadow', 'Notion Thief',
  'Winota, Joiner of Forces', 'Ancient Tomb', 'Chrome Mox', 'Field of the Dead',
  'Glacial Chasm', 'Grim Monolith', "Lion's Eye Diamond", 'Mana Vault',
  "Mishra's Workshop", 'Mox Diamond', 'Panoptic Mirror', 'The One Ring',
  'The Tabernacle at Pendrell Vale'
];

// Check for mass land destruction or extra turns
const hasMassLandDestruction = (card) => {
  const text = card.oracle_text?.toLowerCase() || '';
  return text.includes('destroy all lands') || 
         text.includes('destroy each land') ||
         (text.includes('destroy all') && text.includes('land'));
};

const hasExtraTurns = (card) => {
  const text = card.oracle_text?.toLowerCase() || '';
  return text.includes('extra turn') || 
         text.includes('additional turn');
};

/**
 * Analyzes a deck to determine its Commander Bracket based on the official system
 * @param {Array} cards - Array of card objects
 * @param {Object} commander - Commander card object
 * @returns {Object} Bracket analysis results
 */
export const analyzeBracket = (cards, commander) => {
  const allCards = [...cards, ...(commander ? [commander] : [])];
  
  // Count Game Changers
  const gameChangers = allCards.filter(card => 
    GAME_CHANGERS.includes(card.name)
  );
  const gameChangerCount = gameChangers.length;

  // Check for infinite combos (simplified check - would need more sophisticated combo detection)
  const potentialComboCards = allCards.filter(card => 
    card.oracle_text && (
      card.oracle_text.toLowerCase().includes('infinite') ||
      card.oracle_text.toLowerCase().includes('untap') ||
      card.oracle_text.toLowerCase().includes('create a copy')
    )
  );

  // Count tutors (simplified - would need more comprehensive tutor detection)
  const tutors = allCards.filter(card =>
    card.oracle_text && card.oracle_text.toLowerCase().includes('search your library')
  );

  // Check for MLD and extra turns
  const hasMLDCards = allCards.some(hasMassLandDestruction);
  const hasExtraTurnCards = allCards.some(hasExtraTurns);

  // Determine bracket based on characteristics
  let bracket;
  let bracketName;
  let bracketDescription;

  if (!hasMLDCards && !hasExtraTurnCards && !potentialComboCards.length && gameChangerCount === 0 && tutors.length <= 2) {
    bracket = 1;
    bracketName = 'Exhibition';
    bracketDescription = 'Your ultra-casual Commander deck.';
  } else if (!hasMLDCards && !hasExtraTurnCards && !potentialComboCards.length && gameChangerCount === 0 && tutors.length <= 4) {
    bracket = 2;
    bracketName = 'Core';
    bracketDescription = 'The average current preconstructed deck.';
  } else if (!hasMLDCards && !hasExtraTurnCards && gameChangerCount <= 3) {
    bracket = 3;
    bracketName = 'Upgraded';
    bracketDescription = 'Beyond the strength of an average precon deck.';
  } else if (gameChangerCount > 3) {
    bracket = 4;
    bracketName = 'Optimized';
    bracketDescription = 'High power Commander. It\'s time to go wild!';
  } else {
    bracket = 5;
    bracketName = 'CEDH';
    bracketDescription = 'High power with a very competitive and metagame focused mindset.';
  }

  return {
    bracket,
    bracketName,
    bracketDescription,
    gameChangerCount,
    gameChangers: gameChangers.map(card => card.name),
    tutorCount: tutors.length,
    hasMLDCards,
    hasExtraTurnCards,
    potentialComboCount: potentialComboCards.length,
    restrictions: {
      noMLD: !hasMLDCards,
      noExtraTurns: !hasExtraTurnCards,
      noInfiniteCombo: potentialComboCards.length === 0,
      noGameChangers: gameChangerCount === 0,
      fewTutors: tutors.length <= 2
    }
  };
}; 