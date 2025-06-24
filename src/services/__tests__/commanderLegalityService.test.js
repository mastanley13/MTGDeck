/**
 * Test suite for Commander Legality Service
 * Tests all validation functions with comprehensive edge cases
 */

import {
  isCardBanned,
  validateColorIdentity,
  validateFormatLegality,
  validateCard,
  validateDeck,
  getAllBannedCards,
  getKnownColorIdentityCards,
  findBannedCardMatch,
  getBannedCardReplacements,
  formatValidationResults
} from '../commanderLegalityService';

describe('Commander Legality Service', () => {
  
  // ===== BANNED CARD TESTS =====
  describe('isCardBanned', () => {
    test('should identify banned cards correctly', () => {
      expect(isCardBanned('Black Lotus')).toBe(true);
      expect(isCardBanned('Mana Crypt')).toBe(true);
      expect(isCardBanned('Dockside Extortionist')).toBe(true);
      expect(isCardBanned('Nadu, Winged Wisdom')).toBe(true);
    });

    test('should identify legal cards correctly', () => {
      expect(isCardBanned('Sol Ring')).toBe(false);
      expect(isCardBanned('Command Tower')).toBe(false);
      expect(isCardBanned('Lightning Bolt')).toBe(false);
    });

    test('should handle recently unbanned cards correctly', () => {
      // These were unbanned in April 2025
      expect(isCardBanned('Gifts Ungiven')).toBe(false);
      expect(isCardBanned('Sway of the Stars')).toBe(false);
      expect(isCardBanned('Braids, Cabal Minion')).toBe(false);
      expect(isCardBanned('Coalition Victory')).toBe(false);
      expect(isCardBanned('Panoptic Mirror')).toBe(false);
    });

    test('should handle edge cases', () => {
      expect(isCardBanned('')).toBe(false);
      expect(isCardBanned(null)).toBe(false);
      expect(isCardBanned(undefined)).toBe(false);
      expect(isCardBanned('  Black Lotus  ')).toBe(true); // whitespace
    });
  });

  // ===== COLOR IDENTITY TESTS =====
  describe('validateColorIdentity', () => {
    test('should validate color identity correctly', () => {
      const commanderColors = ['R', 'G'];
      
      // Valid cards
      expect(validateColorIdentity('Lightning Bolt', commanderColors).isValid).toBe(true);
      expect(validateColorIdentity('Forest', commanderColors).isValid).toBe(true);
      
      // Known violations
      const result = validateColorIdentity('Raugrin Triome', commanderColors);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Raugrin Triome');
      expect(result.cardColorIdentity).toEqual(['R', 'U', 'W']);
    });

    test('should handle Talisman color identity violations', () => {
      const monoRedCommander = ['R'];
      
      const result = validateColorIdentity('Talisman of Dominance', monoRedCommander);
      expect(result.isValid).toBe(false);
      expect(result.cardColorIdentity).toEqual(['B', 'U']);
    });

    test('should handle edge cases', () => {
      expect(validateColorIdentity('', ['R']).isValid).toBe(false);
      expect(validateColorIdentity('Sol Ring', null).isValid).toBe(false);
      expect(validateColorIdentity('Sol Ring', []).isValid).toBe(true); // Unknown card, empty commander
    });
  });

  // ===== FORMAT LEGALITY TESTS =====
  describe('validateFormatLegality', () => {
    test('should validate legal cards', () => {
      const legalCard = {
        name: 'Lightning Bolt',
        legalities: { commander: 'legal' }
      };
      
      const result = validateFormatLegality(legalCard);
      expect(result.isValid).toBe(true);
    });

    test('should catch banned cards', () => {
      const bannedCard = {
        name: 'Black Lotus',
        legalities: { commander: 'banned' }
      };
      
      const result = validateFormatLegality(bannedCard);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('banned');
    });

    test('should handle missing legalities', () => {
      const cardWithoutLegalities = { name: 'Custom Card' };
      
      const result = validateFormatLegality(cardWithoutLegalities);
      expect(result.isValid).toBe(true); // Assumes legal if no data
    });

    test('should handle edge cases', () => {
      expect(validateFormatLegality(null).isValid).toBe(false);
      expect(validateFormatLegality({}).isValid).toBe(false);
    });
  });

  // ===== CARD VALIDATION TESTS =====
  describe('validateCard', () => {
    const testCommander = {
      name: 'Alesha, Who Smiles at Death',
      color_identity: ['R', 'W', 'B'],
      type_line: 'Legendary Creature — Human Warrior'
    };

    test('should validate legal cards', () => {
      const legalCard = {
        name: 'Lightning Bolt',
        color_identity: ['R'],
        legalities: { commander: 'legal' }
      };
      
      const result = validateCard(legalCard, testCommander);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should catch banned cards', () => {
      const bannedCard = {
        name: 'Black Lotus',
        color_identity: [],
        legalities: { commander: 'legal' } // Even if Scryfall says legal, our ban list overrides
      };
      
      const result = validateCard(bannedCard, testCommander);
      expect(result.isValid).toBe(false);
      expect(result.violations[0].type).toBe('banned_card');
    });

    test('should catch color identity violations', () => {
      const colorViolationCard = {
        name: 'Counterspell',
        color_identity: ['U'],
        legalities: { commander: 'legal' }
      };
      
      const result = validateCard(colorViolationCard, testCommander);
      expect(result.isValid).toBe(false);
      expect(result.violations[0].type).toBe('color_identity');
    });

    test('should handle multiple violations', () => {
      const problematicCard = {
        name: 'Ancestral Recall', // Banned + wrong colors
        color_identity: ['U'],
        legalities: { commander: 'legal' }
      };
      
      const result = validateCard(problematicCard, testCommander);
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(1);
    });
  });

  // ===== DECK VALIDATION TESTS =====
  describe('validateDeck', () => {
    const testCommander = {
      name: 'Alesha, Who Smiles at Death',
      color_identity: ['R', 'W', 'B'],
      type_line: 'Legendary Creature — Human Warrior',
      legalities: { commander: 'legal' }
    };

    test('should validate a legal deck', () => {
      const legalDeck = Array.from({ length: 99 }, (_, i) => ({
        name: `Legal Card ${i + 1}`,
        color_identity: ['R'],
        type_line: 'Creature',
        legalities: { commander: 'legal' }
      }));
      
      const result = validateDeck(legalDeck, testCommander);
      expect(result.isValid).toBe(true);
      expect(result.summary.totalCards).toBe(99);
    });

    test('should catch deck size violations', () => {
      const oversizedDeck = Array.from({ length: 105 }, (_, i) => ({
        name: `Card ${i + 1}`,
        color_identity: ['R'],
        legalities: { commander: 'legal' }
      }));
      
      const result = validateDeck(oversizedDeck, testCommander);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'deck_size')).toBe(true);
    });

    test('should catch singleton violations', () => {
      const deckWithDuplicates = [
        {
          name: 'Lightning Bolt',
          color_identity: ['R'],
          legalities: { commander: 'legal' }
        },
        {
          name: 'Lightning Bolt', // Duplicate
          color_identity: ['R'],
          legalities: { commander: 'legal' }
        }
      ];
      
      const result = validateDeck(deckWithDuplicates, testCommander);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'singleton_violation')).toBe(true);
    });

    test('should allow multiple basic lands', () => {
      const deckWithBasicLands = [
        {
          name: 'Mountain',
          type_line: 'Basic Land — Mountain',
          color_identity: ['R'],
          legalities: { commander: 'legal' }
        },
        {
          name: 'Mountain',
          type_line: 'Basic Land — Mountain',
          color_identity: ['R'],
          legalities: { commander: 'legal' }
        }
      ];
      
      const result = validateDeck(deckWithBasicLands, testCommander);
      expect(result.violations.some(v => v.type === 'singleton_violation')).toBe(false);
    });

    test('should validate commander is legendary', () => {
      const nonLegendaryCommander = {
        name: 'Lightning Bolt',
        type_line: 'Instant',
        color_identity: ['R']
      };
      
      const result = validateDeck([], nonLegendaryCommander);
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'invalid_commander')).toBe(true);
    });
  });

  // ===== UTILITY FUNCTION TESTS =====
  describe('getAllBannedCards', () => {
    test('should return sorted array of banned cards', () => {
      const bannedCards = getAllBannedCards();
      expect(Array.isArray(bannedCards)).toBe(true);
      expect(bannedCards.length).toBeGreaterThan(50);
      expect(bannedCards.includes('Black Lotus')).toBe(true);
      expect(bannedCards.includes('Mana Crypt')).toBe(true);
      
      // Should be sorted
      const sorted = [...bannedCards].sort();
      expect(bannedCards).toEqual(sorted);
    });
  });

  describe('getKnownColorIdentityCards', () => {
    test('should return object with color identity mappings', () => {
      const colorCards = getKnownColorIdentityCards();
      expect(typeof colorCards).toBe('object');
      expect(colorCards['Raugrin Triome']).toEqual(['R', 'U', 'W']);
      expect(colorCards['Talisman of Dominance']).toEqual(['B', 'U']);
    });
  });

  describe('findBannedCardMatch', () => {
    test('should find exact matches case-insensitively', () => {
      expect(findBannedCardMatch('black lotus')).toBe('Black Lotus');
      expect(findBannedCardMatch('BLACK LOTUS')).toBe('Black Lotus');
      expect(findBannedCardMatch('  Black Lotus  ')).toBe('Black Lotus');
    });

    test('should return null for non-banned cards', () => {
      expect(findBannedCardMatch('Sol Ring')).toBe(null);
      expect(findBannedCardMatch('Lightning Bolt')).toBe(null);
      expect(findBannedCardMatch('')).toBe(null);
    });
  });

  describe('getBannedCardReplacements', () => {
    test('should provide specific replacements for known cards', () => {
      const manaCryptReplacements = getBannedCardReplacements('Mana Crypt');
      expect(manaCryptReplacements).toContain('Sol Ring');
      expect(manaCryptReplacements).toContain('Arcane Signet');
    });

    test('should provide default replacements for unknown cards', () => {
      const unknownReplacements = getBannedCardReplacements('Unknown Banned Card');
      expect(unknownReplacements).toContain('Sol Ring');
      expect(unknownReplacements).toContain('Command Tower');
    });
  });

  describe('formatValidationResults', () => {
    test('should format validation results for display', () => {
      const mockResult = {
        isValid: false,
        violations: [
          { type: 'banned_card', severity: 'critical', cardName: 'Black Lotus' },
          { type: 'color_identity', severity: 'critical', cardName: 'Counterspell' }
        ],
        warnings: [],
        summary: { totalViolations: 2 }
      };

      const formatted = formatValidationResults(mockResult);
      expect(formatted.isValid).toBe(false);
      expect(formatted.groupedViolations.critical).toHaveLength(2);
      expect(formatted.displayMessage).toContain('❌');
      expect(formatted.quickFixes).toHaveLength(1); // Only banned card gets quick fix
    });

    test('should handle valid results', () => {
      const validResult = {
        isValid: true,
        violations: [],
        warnings: [],
        summary: {}
      };

      const formatted = formatValidationResults(validResult);
      expect(formatted.isValid).toBe(true);
      expect(formatted.displayMessage).toContain('✅');
    });

    test('should handle null input', () => {
      expect(formatValidationResults(null)).toBe(null);
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Integration Tests', () => {
    test('should handle real-world deck validation scenario', () => {
      const commander = {
        name: 'Atraxa, Praetors\' Voice',
        color_identity: ['W', 'U', 'B', 'G'],
        type_line: 'Legendary Creature — Phyrexian Angel Horror',
        legalities: { commander: 'legal' }
      };

      const deck = [
        // Legal cards
        { name: 'Sol Ring', color_identity: [], legalities: { commander: 'legal' } },
        { name: 'Command Tower', color_identity: [], legalities: { commander: 'legal' } },
        { name: 'Doubling Season', color_identity: ['G'], legalities: { commander: 'legal' } },
        
        // Banned card
        { name: 'Mana Crypt', color_identity: [], legalities: { commander: 'legal' } },
        
        // Color identity violation
        { name: 'Lightning Bolt', color_identity: ['R'], legalities: { commander: 'legal' } },
        
        // Add more cards to reach reasonable deck size
        ...Array.from({ length: 94 }, (_, i) => ({
          name: `Legal Card ${i + 1}`,
          color_identity: ['G'],
          legalities: { commander: 'legal' }
        }))
      ];

      const result = validateDeck(deck, commander);
      
      // Should catch both violations
      expect(result.isValid).toBe(false);
      expect(result.violations.some(v => v.type === 'banned_card')).toBe(true);
      expect(result.violations.some(v => v.type === 'color_identity')).toBe(true);
      expect(result.summary.totalCards).toBe(99);
    });

    test('should validate a perfect deck', () => {
      const commander = {
        name: 'Alesha, Who Smiles at Death',
        color_identity: ['R', 'W', 'B'],
        type_line: 'Legendary Creature — Human Warrior',
        legalities: { commander: 'legal' }
      };

      const perfectDeck = [
        // Mix of different card types
        { name: 'Sol Ring', color_identity: [], type_line: 'Artifact', legalities: { commander: 'legal' } },
        { name: 'Command Tower', color_identity: [], type_line: 'Land', legalities: { commander: 'legal' } },
        { name: 'Lightning Bolt', color_identity: ['R'], type_line: 'Instant', legalities: { commander: 'legal' } },
        { name: 'Swords to Plowshares', color_identity: ['W'], type_line: 'Instant', legalities: { commander: 'legal' } },
        { name: 'Thoughtseize', color_identity: ['B'], type_line: 'Sorcery', legalities: { commander: 'legal' } },
        
        // Add lands
        ...Array.from({ length: 35 }, (_, i) => ({
          name: `Land ${i + 1}`,
          color_identity: [],
          type_line: 'Land',
          legalities: { commander: 'legal' }
        })),
        
        // Add remaining cards
        ...Array.from({ length: 59 }, (_, i) => ({
          name: `Card ${i + 1}`,
          color_identity: ['R'],
          type_line: 'Creature',
          legalities: { commander: 'legal' }
        }))
      ];

      const result = validateDeck(perfectDeck, commander);
      expect(result.isValid).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.summary.totalCards).toBe(99);
      expect(result.summary.landCount).toBe(36); // Command Tower + 35 lands
    });
  });
}); 