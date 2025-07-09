import { 
  detectDeckFormat, 
  resolveCardName, 
  detectCommanderFromCards,
  parseByFormat,
  importDeckFromText,
  extractDeckName,
  validateImportResult
} from '../deckImportService';

// Mock the dependencies
jest.mock('../utils/cardCache', () => ({
  getCachedCard: jest.fn(),
  cacheCard: jest.fn()
}));

jest.mock('../utils/scryfallAPI', () => ({
  getCardById: jest.fn(),
  searchCards: jest.fn()
}));

jest.mock('./deckValidationService', () => ({
  validateDeckWithAI: jest.fn()
}));

describe('Deck Import Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('detectDeckFormat', () => {
    test('detects Moxfield format', () => {
      const content = 'Commander: Alesha, Who Smiles at Death\n\n1 Sol Ring\n1 Command Tower';
      expect(detectDeckFormat(content)).toBe('moxfield');
    });

    test('detects EDHREC format', () => {
      const content = '1x Alesha, Who Smiles at Death *CMDR*\n1x Sol Ring\n1x Command Tower';
      expect(detectDeckFormat(content)).toBe('edhrec');
    });

    test('detects Archidekt format', () => {
      const content = 'Commander (1)\n1 Alesha, Who Smiles at Death\n\nMainboard (99)\n1 Sol Ring';
      expect(detectDeckFormat(content)).toBe('archidekt');
    });

    test('detects TappedOut format', () => {
      const content = '1x Alesha, Who Smiles at Death *CMDR*\n1x Sol Ring';
      expect(detectDeckFormat(content)).toBe('tappedout');
    });

    test('detects MTGGoldfish format', () => {
      const content = 'Deck\nSideboard\n1 Sol Ring';
      expect(detectDeckFormat(content)).toBe('mtggoldfish');
    });

    test('defaults to generic format', () => {
      const content = '1 Sol Ring\n1 Command Tower';
      expect(detectDeckFormat(content)).toBe('generic');
    });
  });

  describe('detectCommanderFromCards', () => {
    test('detects single legendary creature as commander', () => {
      const cards = [
        { name: 'Sol Ring', type_line: 'Artifact' },
        { name: 'Alesha, Who Smiles at Death', type_line: 'Legendary Creature — Human Warrior' }
      ];
      const commander = detectCommanderFromCards(cards);
      expect(commander.name).toBe('Alesha, Who Smiles at Death');
    });

    test('detects planeswalker that can be commander', () => {
      const cards = [
        { name: 'Sol Ring', type_line: 'Artifact' },
        { 
          name: 'Jace, Vryn\'s Prodigy', 
          type_line: 'Legendary Creature — Human Wizard',
          oracle_text: 'This can be your commander.'
        }
      ];
      const commander = detectCommanderFromCards(cards);
      expect(commander.name).toBe('Jace, Vryn\'s Prodigy');
    });

    test('returns first legendary creature when multiple exist', () => {
      const cards = [
        { name: 'Alesha, Who Smiles at Death', type_line: 'Legendary Creature — Human Warrior' },
        { name: 'Zurgo Bellstriker', type_line: 'Legendary Creature — Orc Warrior' }
      ];
      const commander = detectCommanderFromCards(cards);
      expect(commander.name).toBe('Alesha, Who Smiles at Death');
    });

    test('returns null when no commanders found', () => {
      const cards = [
        { name: 'Sol Ring', type_line: 'Artifact' },
        { name: 'Lightning Bolt', type_line: 'Instant' }
      ];
      const commander = detectCommanderFromCards(cards);
      expect(commander).toBeNull();
    });
  });

  describe('parseByFormat', () => {
    test('parses Moxfield format correctly', async () => {
      const content = `Commander: Alesha, Who Smiles at Death

Main:
1 Sol Ring
1 Command Tower
2 Mountain`;

      const result = await parseByFormat(content, 'moxfield');
      
      expect(result.commander).toBe('Alesha, Who Smiles at Death');
      expect(result.cards).toHaveLength(3);
      expect(result.cards[0]).toEqual({ name: 'Sol Ring', quantity: 1 });
      expect(result.cards[1]).toEqual({ name: 'Command Tower', quantity: 1 });
      expect(result.cards[2]).toEqual({ name: 'Mountain', quantity: 2 });
    });

    test('parses EDHREC format correctly', async () => {
      const content = `1x Alesha, Who Smiles at Death *CMDR*
1x Sol Ring
1x Command Tower
2x Mountain`;

      const result = await parseByFormat(content, 'edhrec');
      
      expect(result.commander).toBe('Alesha, Who Smiles at Death');
      expect(result.cards).toHaveLength(3);
      expect(result.cards[0]).toEqual({ name: 'Sol Ring', quantity: 1 });
    });

    test('parses generic format correctly', async () => {
      const content = `// My Alesha Deck
// Commander
1 Alesha, Who Smiles at Death

// Main Deck
1 Sol Ring
1 Command Tower`;

      const result = await parseByFormat(content, 'generic');
      
      expect(result.commander).toBe('Alesha, Who Smiles at Death');
      expect(result.cards).toHaveLength(2);
    });
  });

  describe('extractDeckName', () => {
    test('extracts deck name from comment', () => {
      const content = `// My Awesome Alesha Deck
1 Sol Ring
1 Command Tower`;
      
      const name = extractDeckName(content);
      expect(name).toBe('My Awesome Alesha Deck');
    });

    test('extracts deck name from hash comment', () => {
      const content = `# Alesha Aggro Build
1 Sol Ring`;
      
      const name = extractDeckName(content);
      expect(name).toBe('Alesha Aggro Build');
    });

    test('ignores commander comments', () => {
      const content = `// Commander: Alesha
// My Deck
1 Sol Ring`;
      
      const name = extractDeckName(content);
      expect(name).toBe('My Deck');
    });

    test('returns null when no name found', () => {
      const content = `1 Sol Ring
1 Command Tower`;
      
      const name = extractDeckName(content);
      expect(name).toBeNull();
    });
  });

  describe('validateImportResult', () => {
    test('validates successful import', () => {
      const importResult = {
        commander: { name: 'Alesha, Who Smiles at Death' },
        cards: new Array(99).fill({ name: 'Sol Ring' }),
        unresolvedCards: []
      };

      const validation = validateImportResult(importResult);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.warnings).toHaveLength(0);
    });

    test('identifies missing commander error', () => {
      const importResult = {
        commander: null,
        cards: [{ name: 'Sol Ring' }],
        unresolvedCards: []
      };

      const validation = validateImportResult(importResult);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No commander found in import');
    });

    test('identifies no cards error', () => {
      const importResult = {
        commander: { name: 'Alesha, Who Smiles at Death' },
        cards: [],
        unresolvedCards: []
      };

      const validation = validateImportResult(importResult);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('No cards found in import');
    });

    test('warns about unresolved cards', () => {
      const importResult = {
        commander: { name: 'Alesha, Who Smiles at Death' },
        cards: [{ name: 'Sol Ring' }],
        unresolvedCards: ['Fake Card', 'Another Fake']
      };

      const validation = validateImportResult(importResult);
      
      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toContain('2 cards could not be resolved');
    });

    test('warns about deck size', () => {
      const importResult = {
        commander: { name: 'Alesha, Who Smiles at Death' },
        cards: new Array(30).fill({ name: 'Sol Ring' }),
        unresolvedCards: []
      };

      const validation = validateImportResult(importResult);
      
      expect(validation.warnings).toContain('Deck has fewer than 50 cards (typical minimum for Commander)');
    });

    test('warns about oversized deck', () => {
      const importResult = {
        commander: { name: 'Alesha, Who Smiles at Death' },
        cards: new Array(120).fill({ name: 'Sol Ring' }),
        unresolvedCards: []
      };

      const validation = validateImportResult(importResult);
      
      expect(validation.warnings).toContain('Deck has more than 100 cards (typical maximum for Commander)');
    });
  });

  describe('integration tests', () => {
    test('imports complete deck successfully', async () => {
      // Mock successful card resolution
      const { getCachedCard } = require('../utils/cardCache');
      const { getCardById } = require('../utils/scryfallAPI');
      
      getCachedCard.mockReturnValue(null);
      getCardById.mockImplementation((_, name) => {
        if (name === 'Alesha, Who Smiles at Death') {
          return Promise.resolve({
            id: 'alesha-id',
            name: 'Alesha, Who Smiles at Death',
            type_line: 'Legendary Creature — Human Warrior',
            color_identity: ['R', 'W', 'B']
          });
        }
        if (name === 'Sol Ring') {
          return Promise.resolve({
            id: 'sol-ring-id',
            name: 'Sol Ring',
            type_line: 'Artifact',
            color_identity: []
          });
        }
        return Promise.reject(new Error('Card not found'));
      });

      const deckContent = `Commander: Alesha, Who Smiles at Death
      
1 Sol Ring
1 Command Tower`;

      const result = await importDeckFromText(deckContent, { validateDeck: false });

      expect(result.commander).toBeTruthy();
      expect(result.commander.name).toBe('Alesha, Who Smiles at Death');
      expect(result.cards).toHaveLength(1); // Sol Ring resolved, Command Tower failed
      expect(result.unresolvedCards).toContain('Command Tower');
      expect(result.format).toBe('moxfield');
    });
  });
}); 