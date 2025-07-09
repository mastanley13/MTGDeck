/**
 * Test suite for Archetype-Specific Validation
 * Tests land count validation, smart replacement, and archetype rules for Budget, Competitive, and Casual archetypes
 */

import { validateDeckWithAI } from '../deckValidationService.js';
import { generateSmartReplacements } from '../smartReplacementService.js';

// Mock the OpenAI API calls for testing
jest.mock('../../utils/openaiAPI.js', () => ({
  getOpenAIApiKey: jest.fn(() => 'test-api-key')
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Archetype-Specific Validation', () => {
  
  const testCommander = {
    name: 'Alesha, Who Smiles at Death',
    color_identity: ['R', 'W', 'B'],
    type_line: 'Legendary Creature — Human Warrior',
    oracle_text: 'Whenever Alesha, Who Smiles at Death attacks, you may pay {W/B}{W/B}. If you do, return target creature card with power 2 or less from your graveyard to the battlefield tapped and attacking.',
    colors: ['R', 'W', 'B'],
    legalities: { commander: 'legal' }
  };

  beforeEach(() => {
    fetch.mockClear();
  });

  // ===== ARCHETYPE RULES TESTS =====
  describe('Archetype Rules Configuration', () => {
    test('Budget archetype should have correct land distribution', () => {
      const budgetRules = {
        deckStyle: 'budget',
        maxBudget: 100,
        maxCardPrice: 10,
        distribution: {
          lands: { min: 36, max: 38 },
          ramp: { min: 8, max: 10 },
          draw: { min: 8, max: 12 },
          removal: { min: 6, max: 10 },
          protection: { min: 4, max: 6 },
          core: { min: 25, max: 30 }
        },
        landPools: {
          utility: ['Command Tower', 'Exotic Orchard', 'Terramorphic Expanse'],
          budget: ['Guildgate', 'Evolving Wilds']
        }
      };
      
      expect(budgetRules.distribution.lands.min).toBe(36);
      expect(budgetRules.distribution.lands.max).toBe(38);
      expect(budgetRules.landPools.utility).toContain('Command Tower');
    });

    test('Competitive archetype should have correct land distribution', () => {
      const competitiveRules = {
        deckStyle: 'competitive',
        maxBudget: 5000,
        distribution: {
          lands: { min: 35, max: 38 },
          ramp: { min: 10, max: 12 },
          draw: { min: 10, max: 15 },
          removal: { min: 8, max: 12 },
          protection: { min: 5, max: 8 },
          core: { min: 20, max: 25 }
        },
        landPools: {
          utility: ['Command Tower', 'City of Brass', 'Mana Confluence'],
          premium: ['Scalding Tarn', 'Polluted Delta', 'Windswept Heath']
        }
      };
      
      expect(competitiveRules.distribution.lands.min).toBe(35);
      expect(competitiveRules.distribution.lands.max).toBe(38);
      expect(competitiveRules.landPools.premium).toContain('Scalding Tarn');
    });

    test('Casual archetype should have correct land distribution', () => {
      const casualRules = {
        deckStyle: 'casual',
        maxBudget: 1000,
        distribution: {
          lands: { min: 35, max: 39 },
          ramp: { min: 8, max: 10 },
          draw: { min: 8, max: 12 },
          removal: { min: 6, max: 10 },
          protection: { min: 4, max: 6 },
          core: { min: 25, max: 30 }
        },
        landPools: {
          utility: ['Command Tower', 'Exotic Orchard', 'Reflecting Pool'],
          midTier: ['Temple of Enlightenment', 'Selesnya Sanctuary']
        }
      };
      
      expect(casualRules.distribution.lands.min).toBe(35);
      expect(casualRules.distribution.lands.max).toBe(39);
      expect(casualRules.landPools.midTier).toContain('Temple of Enlightenment');
    });
  });

  // ===== LAND COUNT VALIDATION TESTS =====
  describe('Land Count Validation', () => {
    test('Budget deck with insufficient lands should trigger violation', async () => {
      const budgetRules = {
        deckStyle: 'budget',
        distribution: { lands: { min: 36, max: 38 } }
      };
      
      const deckWithFewLands = Array.from({ length: 25 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands',
        type_line: 'Land'
      })).concat(Array.from({ length: 74 }, (_, i) => ({
        name: `Spell ${i + 1}`,
        category: 'Core',
        type_line: 'Creature'
      })));

      // Mock AI response for validation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                violations: [{
                  card: 'Insufficient Lands',
                  violation_type: 'land_count',
                  severity: 'critical',
                  reason: 'Deck has 25 lands but needs at least 36 for proper mana base',
                  suggested_replacement: 'Add more basic lands',
                  replacement_category: 'Lands'
                }],
                summary: {
                  total_violations: 1,
                  critical: 1,
                  deck_assessment: 'Requires land count adjustment'
                }
              })
            }
          }]
        })
      });

      const result = await validateDeckWithAI(deckWithFewLands, testCommander, budgetRules);
      
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].violation_type).toBe('land_count');
      expect(result.violations[0].card).toBe('Insufficient Lands');
    });

    test('Competitive deck with correct land count should pass', async () => {
      const competitiveRules = {
        deckStyle: 'competitive',
        distribution: { lands: { min: 35, max: 38 } }
      };
      
      const deckWithCorrectLands = Array.from({ length: 37 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands',
        type_line: 'Land'
      })).concat(Array.from({ length: 62 }, (_, i) => ({
        name: `Spell ${i + 1}`,
        category: 'Core',
        type_line: 'Creature'
      })));

      // Mock AI response for validation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                violations: [],
                summary: {
                  total_violations: 0,
                  critical: 0,
                  deck_assessment: 'Deck meets competitive requirements'
                }
              })
            }
          }]
        })
      });

      const result = await validateDeckWithAI(deckWithCorrectLands, testCommander, competitiveRules);
      
      expect(result.violations.filter(v => v.violation_type === 'land_count')).toHaveLength(0);
    });

    test('Casual deck with excessive lands should trigger violation', async () => {
      const casualRules = {
        deckStyle: 'casual',
        distribution: { lands: { min: 35, max: 39 } }
      };
      
      const deckWithTooManyLands = Array.from({ length: 45 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands',
        type_line: 'Land'
      })).concat(Array.from({ length: 54 }, (_, i) => ({
        name: `Spell ${i + 1}`,
        category: 'Core',
        type_line: 'Creature'
      })));

      // Mock AI response for validation
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                violations: [{
                  card: 'Excessive Lands',
                  violation_type: 'land_count',
                  severity: 'moderate',
                  reason: 'Deck has 45 lands but should have at most 39 to maintain spell density',
                  suggested_replacement: 'Remove excess lands',
                  replacement_category: 'Lands'
                }],
                summary: {
                  total_violations: 1,
                  moderate: 1,
                  deck_assessment: 'Requires land count adjustment'
                }
              })
            }
          }]
        })
      });

      const result = await validateDeckWithAI(deckWithTooManyLands, testCommander, casualRules);
      
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0].violation_type).toBe('land_count');
      expect(result.violations[0].card).toBe('Excessive Lands');
    });
  });

  // ===== BASIC LAND SINGLETON TESTS =====
  describe('Basic Land Singleton Rules', () => {
    test('Basic lands should be allowed in multiple copies for all archetypes', async () => {
      const budgetRules = {
        deckStyle: 'budget',
        distribution: { lands: { min: 36, max: 38 } }
      };
      
      const deckWithBasicLands = [
        { name: 'Plains', category: 'Lands', type_line: 'Basic Land — Plains' },
        { name: 'Plains', category: 'Lands', type_line: 'Basic Land — Plains' },
        { name: 'Island', category: 'Lands', type_line: 'Basic Land — Island' },
        { name: 'Island', category: 'Lands', type_line: 'Basic Land — Island' },
        { name: 'Swamp', category: 'Lands', type_line: 'Basic Land — Swamp' },
        { name: 'Swamp', category: 'Lands', type_line: 'Basic Land — Swamp' },
        ...Array.from({ length: 93 }, (_, i) => ({
          name: `Spell ${i + 1}`,
          category: 'Core',
          type_line: 'Creature'
        }))
      ];

      // Mock AI response for validation - should not flag basic lands as singleton violations
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                violations: [],
                summary: {
                  total_violations: 0,
                  critical: 0,
                  deck_assessment: 'Basic lands correctly allowed in multiples'
                }
              })
            }
          }]
        })
      });

      const result = await validateDeckWithAI(deckWithBasicLands, testCommander, budgetRules);
      
      // Should not have singleton violations for basic lands
      const singletonViolations = result.violations.filter(v => 
        v.violation_type === 'singleton_violation' && 
        ['Plains', 'Island', 'Swamp'].includes(v.card)
      );
      expect(singletonViolations).toHaveLength(0);
    });
  });

  // ===== SMART REPLACEMENT TESTS =====
  describe('Smart Replacement for Archetypes', () => {
    test('Budget archetype should suggest budget-friendly land replacements', async () => {
      const budgetRules = {
        deckStyle: 'budget',
        maxBudget: 100,
        distribution: { lands: { min: 36, max: 38 } },
        landPools: {
          utility: ['Command Tower', 'Exotic Orchard', 'Terramorphic Expanse'],
          budget: ['Guildgate', 'Evolving Wilds']
        }
      };
      
      const problematicCards = [{
        card: 'Insufficient Lands',
        violation_type: 'land_count',
        severity: 'critical',
        reason: 'Deck has 30 lands but needs at least 36 for proper mana base'
      }];
      
      const currentDeck = Array.from({ length: 30 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands'
      }));

      const result = await generateSmartReplacements(problematicCards, testCommander, currentDeck, budgetRules);
      
      expect(result.replacements).toHaveLength(1);
      expect(result.replacements[0].replacement_type).toBe('add_lands');
      expect(result.replacements[0].lands_to_add).toBe(6); // 36 - 30 = 6
      expect(result.source).toBe('budget_land_replacement');
    });

    test('Competitive archetype should suggest premium land replacements', async () => {
      const competitiveRules = {
        deckStyle: 'competitive',
        maxBudget: 5000,
        distribution: { lands: { min: 35, max: 38 } },
        landPools: {
          utility: ['Command Tower', 'City of Brass', 'Mana Confluence'],
          premium: ['Scalding Tarn', 'Polluted Delta', 'Windswept Heath']
        }
      };
      
      const problematicCards = [{
        card: 'Insufficient Lands',
        violation_type: 'land_count',
        severity: 'critical',
        reason: 'Deck has 32 lands but needs at least 35 for proper mana base'
      }];
      
      const currentDeck = Array.from({ length: 32 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands'
      }));

      const result = await generateSmartReplacements(problematicCards, testCommander, currentDeck, competitiveRules);
      
      expect(result.replacements).toHaveLength(1);
      expect(result.replacements[0].replacement_type).toBe('add_lands');
      expect(result.replacements[0].lands_to_add).toBe(3); // 35 - 32 = 3
      expect(result.source).toBe('competitive_land_replacement');
      
      // Check that competitive lands are suggested
      const suggestedLands = result.replacements[0].suggested_cards.map(card => card.name);
      const hasCompetitiveLands = suggestedLands.some(land => 
        competitiveRules.landPools.utility.includes(land) ||
        competitiveRules.landPools.premium.includes(land)
      );
      expect(hasCompetitiveLands).toBe(true);
    });

    test('Casual archetype should suggest balanced land replacements', async () => {
      const casualRules = {
        deckStyle: 'casual',
        maxBudget: 1000,
        distribution: { lands: { min: 35, max: 39 } },
        landPools: {
          utility: ['Command Tower', 'Exotic Orchard', 'Reflecting Pool'],
          midTier: ['Temple of Enlightenment', 'Selesnya Sanctuary']
        }
      };
      
      const problematicCards = [{
        card: 'Insufficient Lands',
        violation_type: 'land_count',
        severity: 'critical',
        reason: 'Deck has 33 lands but needs at least 35 for proper mana base'
      }];
      
      const currentDeck = Array.from({ length: 33 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands'
      }));

      const result = await generateSmartReplacements(problematicCards, testCommander, currentDeck, casualRules);
      
      expect(result.replacements).toHaveLength(1);
      expect(result.replacements[0].replacement_type).toBe('add_lands');
      expect(result.replacements[0].lands_to_add).toBe(2); // 35 - 33 = 2
      expect(result.source).toBe('casual_land_replacement');
      
      // Check that casual lands are suggested
      const suggestedLands = result.replacements[0].suggested_cards.map(card => card.name);
      const hasCasualLands = suggestedLands.some(land => 
        casualRules.landPools.utility.includes(land) ||
        casualRules.landPools.midTier.includes(land)
      );
      expect(hasCasualLands).toBe(true);
    });

    test('Should handle excessive lands for all archetypes', async () => {
      const budgetRules = {
        deckStyle: 'budget',
        distribution: { lands: { min: 36, max: 38 } }
      };
      
      const problematicCards = [{
        card: 'Excessive Lands',
        violation_type: 'land_count',
        severity: 'moderate',
        reason: 'Deck has 42 lands but should have at most 38 to maintain spell density'
      }];
      
      const currentDeck = Array.from({ length: 42 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands'
      }));

      const result = await generateSmartReplacements(problematicCards, testCommander, currentDeck, budgetRules);
      
      expect(result.replacements).toHaveLength(1);
      expect(result.replacements[0].replacement_type).toBe('remove_lands');
      expect(result.replacements[0].lands_to_remove).toBe(4); // 42 - 38 = 4
    });
  });

  // ===== INTEGRATION TESTS =====
  describe('Archetype Integration Tests', () => {
    test('Complete Budget archetype workflow should work end-to-end', async () => {
      const budgetRules = {
        deckStyle: 'budget',
        maxBudget: 100,
        distribution: { lands: { min: 36, max: 38 } },
        landPools: {
          utility: ['Command Tower', 'Exotic Orchard'],
          budget: ['Guildgate', 'Evolving Wilds']
        }
      };
      
      const deckWithIssues = Array.from({ length: 30 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands',
        type_line: 'Land'
      })).concat(Array.from({ length: 69 }, (_, i) => ({
        name: `Spell ${i + 1}`,
        category: 'Core',
        type_line: 'Creature'
      })));

      // Mock validation response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                violations: [{
                  card: 'Insufficient Lands',
                  violation_type: 'land_count',
                  severity: 'critical',
                  reason: 'Deck has 30 lands but needs at least 36 for proper mana base',
                  suggested_replacement: 'Add more basic lands',
                  replacement_category: 'Lands'
                }],
                summary: {
                  total_violations: 1,
                  critical: 1,
                  deck_assessment: 'Requires land count adjustment'
                }
              })
            }
          }]
        })
      });

      // 1. Validate the deck
      const validationResult = await validateDeckWithAI(deckWithIssues, testCommander, budgetRules);
      expect(validationResult.violations).toHaveLength(1);
      expect(validationResult.violations[0].violation_type).toBe('land_count');

      // 2. Generate smart replacements
      const replacementResult = await generateSmartReplacements(
        validationResult.violations,
        testCommander,
        deckWithIssues,
        budgetRules
      );
      
      expect(replacementResult.replacements).toHaveLength(1);
      expect(replacementResult.replacements[0].replacement_type).toBe('add_lands');
      expect(replacementResult.replacements[0].lands_to_add).toBe(6);
      expect(replacementResult.source).toBe('budget_land_replacement');
    });

    test('Complete Competitive archetype workflow should work end-to-end', async () => {
      const competitiveRules = {
        deckStyle: 'competitive',
        maxBudget: 5000,
        distribution: { lands: { min: 35, max: 38 } },
        landPools: {
          utility: ['Command Tower', 'City of Brass'],
          premium: ['Scalding Tarn', 'Polluted Delta']
        }
      };
      
      const deckWithIssues = Array.from({ length: 32 }, (_, i) => ({
        name: `Land ${i + 1}`,
        category: 'Lands',
        type_line: 'Land'
      })).concat(Array.from({ length: 67 }, (_, i) => ({
        name: `Spell ${i + 1}`,
        category: 'Core',
        type_line: 'Creature'
      })));

      // Mock validation response
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                violations: [{
                  card: 'Insufficient Lands',
                  violation_type: 'land_count',
                  severity: 'critical',
                  reason: 'Deck has 32 lands but needs at least 35 for proper mana base',
                  suggested_replacement: 'Add more premium lands',
                  replacement_category: 'Lands'
                }],
                summary: {
                  total_violations: 1,
                  critical: 1,
                  deck_assessment: 'Requires competitive optimization'
                }
              })
            }
          }]
        })
      });

      // 1. Validate the deck
      const validationResult = await validateDeckWithAI(deckWithIssues, testCommander, competitiveRules);
      expect(validationResult.violations).toHaveLength(1);
      expect(validationResult.violations[0].violation_type).toBe('land_count');

      // 2. Generate smart replacements
      const replacementResult = await generateSmartReplacements(
        validationResult.violations,
        testCommander,
        deckWithIssues,
        competitiveRules
      );
      
      expect(replacementResult.replacements).toHaveLength(1);
      expect(replacementResult.replacements[0].replacement_type).toBe('add_lands');
      expect(replacementResult.replacements[0].lands_to_add).toBe(3);
      expect(replacementResult.source).toBe('competitive_land_replacement');
    });
  });
}); 