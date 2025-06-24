import { useState, useEffect, useRef } from 'react';
import { useDeck } from '../context/DeckContext';
import { getOpenAIApiKey } from '../utils/openaiAPI';
import { useSubscription } from '../context/SubscriptionContext';
import { validateColorIdentity } from '../utils/deckValidator';
import { validateDeckWithAI } from '../services/deckValidationService.js';
import { generateSmartReplacements, applySmartReplacements } from '../services/smartReplacementService.js';

// Enhanced JSON parsing to handle comments from o3 model
const parseJSONWithComments = (jsonString) => {
  // Strategy 1: Try with minimal cleaning (most conservative)
  try {
    let cleanJson = jsonString;
    
    // Only remove markdown code fences and trailing commas
    cleanJson = cleanJson.replace(/```json\s*/g, '');
    cleanJson = cleanJson.replace(/```\s*/g, '');
    cleanJson = cleanJson.replace(/,(\s*[}\]])/g, '$1');
    cleanJson = cleanJson.trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.log('Strategy 1 (conservative) failed, trying strategy 2...');
  }
  
  // Strategy 2: Extract just the JSON array
  try {
    console.log('Attempting to extract JSON array from response...');
    
    const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      let extractedJson = arrayMatch[0];
      
      // Clean up the extracted JSON - only trailing commas
      extractedJson = extractedJson.replace(/,(\s*[}\]])/g, '$1');
      
      return JSON.parse(extractedJson);
    } else {
      throw new Error('No JSON array found in response');
    }
  } catch (error) {
    console.log('Strategy 2 (array extraction) failed, trying strategy 3...');
  }
  
  // Strategy 3: Try with very careful comment removal (last resort)
  try {
    let cleanJson = jsonString;
    
    // Remove markdown code fences
    cleanJson = cleanJson.replace(/```json\s*/g, '');
    cleanJson = cleanJson.replace(/```\s*/g, '');
    
    // Only remove C-style comments /* ... */ (safer than line comments)
    cleanJson = cleanJson.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // Remove trailing commas
    cleanJson = cleanJson.replace(/,(\s*[}\]])/g, '$1');
    
    // Clean up extra whitespace
    cleanJson = cleanJson.trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('All JSON parsing strategies failed:', error);
    console.error('Original string length:', jsonString.length);
    console.error('Original string preview:', jsonString.substring(0, 500) + '...');
    
    throw new Error('Failed to parse deck list from AI response');
  }
};

// Commander format banned cards list
const commanderBannedCards = [
  'Ancestral Recall',
  'Balance',
  'Biorhythm',
  'Black Lotus',
  'Braids, Cabal Minion',
  'Chaos Orb',
  'Coalition Victory',
  'Emrakul, the Aeons Torn',
  'Erayo, Soratami Ascendant',
  'Falling Star',
  'Fastbond',
  'Flash',
  'Gifts Ungiven',
  'Griselbrand',
  'Hullbreacher',
  'Iona, Shield of Emeria',
  'Karakas',
  'Leovold, Emissary of Trest',
  'Library of Alexandria',
  'Limited Resources',
  'Lutri, the Spellchaser',
  'Mana Crypt',
  'Mox Emerald',
  'Mox Jet',
  'Mox Pearl',
  'Mox Ruby',
  'Mox Sapphire',
  'Painter\'s Servant',
  'Panoptic Mirror',
  'Paradox Engine',
  'Primeval Titan',
  'Prophet of Kruphix',
  'Recurring Nightmare',
  'Rofellos, Llanowar Emissary',
  'Shahrazad',
  'Sundering Titan',
  'Sway of the Stars',
  'Sylvan Primordial',
  'Time Vault',
  'Time Walk',
  'Tinker',
  'Tolarian Academy',
  'Trade Secrets',
  'Upheaval',
  'Worldfire',
  'Yawgmoth\'s Bargain'
];

// Check if a card is legal in Commander format
const isLegalInCommander = (cardName) => {
  return !commanderBannedCards.some(banned => 
    banned.toLowerCase() === cardName.toLowerCase()
  );
};

// Validate card color identity against commander
const validateCardColorIdentity = (cardName, commanderColorIdentity) => {
  // Known problematic cards that violate color identity
  const knownViolations = {
    'Raugrin Triome': ['R', 'U', 'W'],
    'Talisman of Dominance': ['B', 'U'],
    'Enthusiastic Mechanaut': ['R', 'U'],
    'Savai Triome': ['R', 'W', 'B'],
    'Zagoth Triome': ['B', 'G', 'U'],
    'Ketria Triome': ['G', 'U', 'R'],
    'Indatha Triome': ['W', 'B', 'G'],
    'Talisman of Creativity': ['U', 'R'],
    'Talisman of Curiosity': ['G', 'U'],
    'Talisman of Hierarchy': ['W', 'B'],
    'Talisman of Impulse': ['R', 'G'],
    'Talisman of Indulgence': ['B', 'R'],
    'Talisman of Progress': ['W', 'U'],
    'Talisman of Resilience': ['B', 'G'],
    'Talisman of Unity': ['G', 'W'],
    'Talisman of Conviction': ['R', 'W']
  };
  
  if (knownViolations[cardName]) {
    const cardColors = knownViolations[cardName];
    const isValid = cardColors.every(color => commanderColorIdentity.includes(color));
    if (!isValid) {
      console.warn(`Color identity violation detected: ${cardName} requires [${cardColors.join(', ')}] but commander only allows [${commanderColorIdentity.join(', ')}]`);
    }
    return isValid;
  }
  
  return true; // Unknown cards pass initial check
};

/**
 * Hook for automatically building complete decks based on a commander
 */
export const useAutoDeckBuilder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [paywallBlocked, setPaywallBlocked] = useState(false);
  
  // New state for progressive UI
  const [buildingStage, setBuildingStage] = useState('');
  const [currentCards, setCurrentCards] = useState([]);
  const [currentViolations, setCurrentViolations] = useState([]);
  const [appliedFixes, setAppliedFixes] = useState([]);

  const { canMakeAIRequest, incrementAIRequests, isPremium } = useSubscription();
  const deckContext = useDeck(); // Use the whole context object
  const { 
    commander, 
    addCard, 
    resetDeckExceptCommander,
    cards, // cards from context is a snapshot, ref will hold latest for async operations
    removeCard
  } = deckContext; // Destructure from deckContext if needed, or use deckContext.addCard etc.

  const currentDeckCardsRef = useRef([]);

  useEffect(() => {
    currentDeckCardsRef.current = deckContext.cards;
  }, [deckContext.cards]);

  const getCurrentNonCommanderCardCount = () => {
    return currentDeckCardsRef.current.reduce((sum, c) => sum + (c.quantity || 1), 0);
  };

  /**
   * Identify game-changing cards in a deck
   * @param {Array} cardList - List of cards to check
   * @returns {Array} - List of game-changing cards found
   */
  const identifyGameChangers = (cardList) => {
    const gameChangers = [
      // Extra turns
      'time warp', 'temporal manipulation', 'capture of jingzhou', 'temporal mastery',
      'walk the aeons', 'part the waterveil', 'karn\'s temporal sundering', 'alrund\'s epiphany',
      // Mass land destruction
      'armageddon', 'ravages of war', 'catastrophe', 'decree of annihilation',
      'jokulhaups', 'obliterate', 'wildfire',
      // Infinite combo enablers
      'food chain', 'dramatic reversal', 'isochron scepter', 'paradox engine',
      'helm of the host', 'kiki-jiki', 'splinter twin',
      // Stax pieces
      'winter orb', 'static orb', 'stasis', 'tangle wire', 'smokestack',
      // Game-ending effects
      'expropriate', 'craterhoof behemoth', 'triumph of the hordes', 'insurrection',
      'rise of the dark realms', 'omniscience', 'enter the infinite',
      // Powerful tutors
      'demonic tutor', 'vampiric tutor', 'imperial seal', 'grim tutor',
      'diabolic intent', 'enlightened tutor', 'mystical tutor', 'worldly tutor',
      // Fast mana
      'mana crypt', 'mana vault', 'chrome mox', 'mox diamond', 'grim monolith',
      // Card advantage engines
      'rhystic study', 'mystic remora', 'necropotence', 'sylvan library',
      // Mass resource denial
      'vorinclex', 'jin-gitaxias', 'void winnower', 'opposition agent'
    ];

    return cardList.filter(card => 
      gameChangers.some(gc => 
        card.name.toLowerCase().includes(gc.toLowerCase())
      )
    );
  };

  /**
   * Get archetype-specific rules and constraints for deck building
   * @param {string} deckStyle - The desired deck style/strategy
   * @returns {Object} - Object containing archetype rules and constraints
   */
  const getArchetypeRules = (deckStyle) => {
    const baseRules = {
      prompt: '',
      maxBudget: Infinity,
      targetBracket: { min: 1, max: 5 },
      maxGameChangers: Infinity,
      cardDistribution: {
        lands: { min: 32, max: 34 }, // Reduced land counts
        ramp: { min: 10, max: 12 },
        cardDraw: { min: 10, max: 12 },
        removal: { min: 8, max: 10 },
        boardWipes: { min: 3, max: 5 },
        protection: { min: 5, max: 8 },
        strategy: { min: 25, max: 30 }
      }
    };

    switch (deckStyle.toLowerCase()) {
      case 'competitive':
        return {
          ...baseRules,
          prompt: `
            Focus on high-efficiency staples and powerful synergies.
            Include multiple tutors for consistency.
            Prioritize fast mana and efficient interaction.
            Consider including game-winning combos.
            Optimize the mana base with fetch lands and shock lands.
          `,
          targetBracket: { min: 4, max: 5 },
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 30, max: 32 }, // Lower land count due to more efficient mana base
            ramp: { min: 12, max: 15 }, // More ramp for faster gameplay
            protection: { min: 8, max: 10 } // More protection for key pieces
          }
        };

      case 'casual':
        return {
          ...baseRules,
          prompt: `
            Focus on fun and interactive gameplay.
            Avoid mass land destruction and extra turns.
            Limit tutors to maintain variety in gameplay.
            Include more flavor-focused cards that fit the theme.
            Use a mix of removal to encourage interaction.
            Avoid game-changing effects that can create unfun experiences.
          `,
          targetBracket: { min: 1, max: 3 },
          maxGameChangers: 3, // Limit game changers for casual play
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 34, max: 36 }, // Slightly higher land count for more consistent casual play
            strategy: { min: 28, max: 35 } // More room for fun theme cards
          }
        };

      case 'budget':
        return {
          ...baseRules,
          prompt: `
            Keep the estimated deck cost under $150.
            Minimize expensive lands; favor basics and budget alternatives.
            Focus on efficient budget staples and synergistic commons/uncommons.
            Include budget-friendly removal and interaction options.
            Look for cost-effective alternatives to expensive staples.
          `,
          maxBudget: 150,
          targetBracket: { min: 1, max: 3 },
          maxGameChangers: 2, // Limited by budget naturally
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 34, max: 36 } // More basic lands
          }
        };

      case 'combo':
        return {
          ...baseRules,
          prompt: `
            Focus on assembling and protecting key combo pieces.
            Include tutors to find combo pieces consistently.
            Add redundant combo pieces and backup plans.
            Include protection spells to defend the combo.
            Balance combo pieces with interaction and control elements.
          `,
          targetBracket: { min: 3, max: 5 },
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 31, max: 33 }, // Lower land count to fit combo pieces
            protection: { min: 8, max: 12 }, // More protection for combo pieces
            strategy: { min: 28, max: 35 } // More room for combo pieces
          }
        };

      case 'aggro':
        return {
          ...baseRules,
          prompt: `
            Prioritize low-cost creatures and efficient threats.
            Include combat tricks and ways to push damage.
            Focus on haste enablers and extra combat effects.
            Add ways to break through board stalls.
            Keep the mana curve low and aggressive.
          `,
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 30, max: 32 }, // Lower land count for aggressive curve
            ramp: { min: 8, max: 10 }, // Less ramp needed
            strategy: { min: 30, max: 35 } // More creatures and combat tricks
          }
        };

      case 'control':
        return {
          ...baseRules,
          prompt: `
            Focus on counterspells and efficient removal.
            Include strong card advantage engines.
            Add board wipes and mass removal.
            Include recursion and value engines.
            Focus on maintaining card advantage and board control.
          `,
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 32, max: 34 }, // Standard land count
            cardDraw: { min: 12, max: 15 }, // More card draw
            removal: { min: 10, max: 12 }, // More removal
            boardWipes: { min: 5, max: 7 } // More board wipes
          }
        };

      case 'tribal':
        return {
          ...baseRules,
          prompt: `
            Focus on creatures sharing the commander's creature type.
            Include tribal support and anthem effects.
            Add tribal-specific card advantage and interaction.
            Include ways to protect and buff the tribe.
            Balance tribal synergies with general utility.
          `,
          cardDistribution: {
            ...baseRules.cardDistribution,
            lands: { min: 33, max: 35 }, // Standard land count
            strategy: { min: 30, max: 35 } // More creatures of the chosen type
          }
        };

      default:
        return baseRules;
    }
  };

  /**
   * Build a complete deck using the three-stage pipeline
   * @param {string} deckStyle - The desired deck style/strategy
   */
  const buildCompleteDeck = async (deckStyle = 'competitive') => {
    if (!commander) {
      setError('Please select a commander first');
      return false;
    }

    // Check API key and paywall limits
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      setError('OpenAI API key is not configured.');
      return false;
    }

    if (!isPremium && !canMakeAIRequest) {
      setPaywallBlocked(true);
      setError('AI request limit reached. Upgrade to Premium for unlimited deck building.');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      setPaywallBlocked(false);
      
      if (!isPremium) {
        incrementAIRequests();
      }
      
      resetDeckExceptCommander();
      
      // STAGE 1: High-Quality Initial Generation with o3
      setBuildingStage('Generating initial deck structure...');
      setProgress(10);
      console.log('Stage 1: Starting comprehensive generation with o3');
      
      const archetypeRules = getArchetypeRules(deckStyle);
      const stageOneStart = Date.now();
      const initialCards = await generateInitialDeckWithO3(commander, deckStyle, archetypeRules);
      console.log(`Stage 1 completed in ${Date.now() - stageOneStart}ms`);
      
      setCurrentCards(initialCards);
      setProgress(35);
      
      // STAGE 2: AI Validation Scanner with o3
      setBuildingStage('Scanning for validation issues...');
      console.log('Stage 2: Starting validation scan with o3');
      
      const stageTwoStart = Date.now();
      const validationResult = await validateDeckWithAI(initialCards, commander);
      console.log(`Stage 2 completed in ${Date.now() - stageTwoStart}ms`);
      
      setCurrentViolations(validationResult.violations || []);
      setProgress(60);
      
      let finalCardList = initialCards;
      
      // STAGE 3: Smart Replacement with o3 (only if violations found)
      if (validationResult.violations && validationResult.violations.length > 0) {
        setBuildingStage(`Fixing ${validationResult.violations.length} validation issues...`);
        console.log(`Stage 3: Fixing ${validationResult.violations.length} violations with o3`);
        
        const stageThreeStart = Date.now();
        
        // Convert violations to problematic cards format
        const problematicCards = validationResult.violations.map(violation => ({
          name: violation.card || violation.cardName,
          category: violation.replacement_category || 'Unknown',
          cmc: 2, // Default CMC, could be improved with actual card data
          violation_reason: violation.reason || violation.message
        }));
        
        const replacements = await generateSmartReplacements(
          problematicCards, 
          commander, 
          initialCards
        );
        
        const fixedCards = applySmartReplacements(initialCards, replacements);
        console.log(`Stage 3 completed in ${Date.now() - stageThreeStart}ms`);
        
        // Additional singleton validation after replacements
        const singletonValidatedCards = validateAndFixSingletonViolations(fixedCards);
        if (singletonValidatedCards.length !== fixedCards.length) {
          console.log(`Fixed ${fixedCards.length - singletonValidatedCards.length} additional singleton violations`);
        }
        
        setAppliedFixes(replacements?.replacements || []);
        setCurrentCards(singletonValidatedCards);
        finalCardList = singletonValidatedCards;
        setProgress(85);
        
        // Optional final validation pass for critical violations
        if (validationResult.summary && validationResult.summary.critical > 0) {
          setBuildingStage('Final validation check...');
          const finalValidation = await validateDeckWithAI(fixedCards, commander);
          
          if (finalValidation.violations && finalValidation.violations.length > 0) {
            console.warn('Some violations remain after smart replacement:', finalValidation.violations);
          }
        }
      } else {
        console.log('Stage 3: No violations found, skipping replacement stage');
      }
      
      setProgress(90);
      
      // STAGE 4: Fetch Card Data and Build Final Deck
      setBuildingStage('Fetching card data and building deck...');
      console.log('Stage 4: Building final deck');
      
      const stageFourStart = Date.now();
      const cardDataMap = await fetchCardDataBatch(finalCardList);
      await addCardsFromBatchData(finalCardList, cardDataMap, appliedFixes);
      console.log(`Stage 4 completed in ${Date.now() - stageFourStart}ms`);
      
      setBuildingStage('Deck complete!');
      setProgress(100);
      
      console.log('Three-stage deck building completed successfully');
      return true;
      
    } catch (error) {
      console.error('Three-stage deck building error:', error);
      setError(error.message || 'Failed to build deck');
      return false;
    } finally {
      setIsLoading(false);
      setBuildingStage('');
      setProgress(0);
      setCurrentCards([]);
      setCurrentViolations([]);
      setAppliedFixes([]);
    }
  };

  /**
   * Generate a complete deck using AI based on commander and style
   * @param {Object} commander - Commander card object
   * @param {string} deckStyle - Desired deck style (competitive, casual, budget, etc.)
   * @param {Object} archetypeRules - Archetype-specific rules and constraints
   * @returns {Array} - Array of card objects with names and categories
   */
  const generateDeckWithAI = async (commander, deckStyle, archetypeRules) => {
    if (!commander) {
      throw new Error('Commander is required for AI deck generation');
    }

    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    // Build the prompt based on archetype rules
    const { prompt: archetypePrompt, cardDistribution, maxBudget, targetBracket } = archetypeRules;
    
    const budgetConstraint = maxBudget !== Infinity ? 
      `Keep the total deck cost under $${maxBudget}.` : '';

    const bracketConstraint = `Target power level should be between bracket ${targetBracket.min}-${targetBracket.max} (1=casual, 5=cEDH).`;

    // Format card distribution requirements
    const distributionRequirements = Object.entries(cardDistribution)
      .map(([category, { min, max }]) => `${category}: ${min}-${max} cards`)
      .join(', ');

    const prompt = `You are an expert Magic: The Gathering deck builder specialized in the Commander format.

Build a complete 99-card Commander deck with the following specifications:

Commander: ${commander.name}
Color Identity: ${commander.color_identity?.join('') || 'Colorless'}
Commander Type: ${commander.type_line}
Commander Text: ${commander.oracle_text || 'No text available'}
Deck Style: ${deckStyle}

Requirements:
- Exactly 99 cards (excluding the commander)
- All cards must be legal in Commander format
- All cards must fit within the commander's color identity
- ${bracketConstraint}
- ${budgetConstraint}
- Card distribution target: ${distributionRequirements}

${archetypePrompt}

Additional Guidelines:
- Include staple cards appropriate for the power level
- Ensure proper mana base with appropriate lands
- Include ramp, card draw, removal, and protection
- Focus on synergies with the commander's abilities and strategy
- All card names must be spelled exactly as they appear on official Magic cards

Format your response as a JSON array of objects with these properties:
- name: The exact card name (be very precise with spelling)
- category: One of: "Lands", "Ramp", "Card Draw", "Removal", "Board Wipes", "Protection", "Strategy", "Utility", "Finisher"

Only include the JSON array in your response, nothing else. Ensure exactly 99 cards are included.`;

    try {
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert Magic: The Gathering deck builder with comprehensive knowledge of all cards, formats, and optimal deck construction strategies for Commander format.'
            },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 8000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        throw new Error('No response received from OpenAI');
      }

      // Parse the JSON response using the enhanced parser
      try {
        // Extract JSON from the response (handle markdown backticks)
        const jsonMatch = responseText.match(/\[[\s\S]*\]/) || 
                          responseText.match(/\{[\s\S]*\}/);
        
        const jsonText = jsonMatch ? jsonMatch[0] : responseText;
        const cardList = parseJSONWithComments(jsonText);

        // Validate the response
        if (!Array.isArray(cardList)) {
          throw new Error('AI response is not an array');
        }

        if (cardList.length === 0) {
          throw new Error('AI returned empty card list');
        }

        // Validate each card entry
        const validatedCards = cardList.filter(card => {
          if (!card.name || typeof card.name !== 'string') {
            console.warn('Invalid card entry (missing name):', card);
            return false;
          }
          
          // Check for banned cards
          if (!isLegalInCommander(card.name)) {
            console.warn(`Skipping banned card: ${card.name}`);
            return false;
          }

          // Check color identity (basic validation)
          if (!validateCardColorIdentity(card.name, commander.color_identity)) {
            console.warn(`Color identity violation: ${card.name}`);
            return false;
          }

          return true;
        });

        console.log(`AI generated ${cardList.length} cards, ${validatedCards.length} passed validation`);

        if (validatedCards.length < 50) {
          throw new Error(`Too few valid cards generated (${validatedCards.length}). Please try again.`);
        }

        return validatedCards;

      } catch (parseError) {
        console.error('Error parsing AI deck response:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse deck list from AI response');
      }

    } catch (error) {
      console.error('Error generating deck with AI:', error);
      if (error.message.includes('API key')) {
        throw new Error('AI service configuration error');
      }
      throw error;
    }
  };

  /**
   * Generate initial deck quickly using AI
   */
  const generateInitialDeckFast = async (commander, deckStyle, archetypeRules) => {
    try {
      // Generate deck without caching
      const cards = await generateDeckWithAI(commander, deckStyle, archetypeRules);
      return cards;
    } catch (error) {
      console.error('Failed to generate initial deck:', error);
      throw error;
    }
  };

  /**
   * Fetch card data with fallback to individual requests
   * @param {Array} cardList - List of cards to fetch
   * @returns {Map} Map of card names to card data
   */
  const fetchCardDataBatch = async (cardList) => {
    const cardMap = new Map();
    
    // First try batch fetching
    try {
      console.log('Attempting batch fetch for', cardList.length, 'cards...');
      const batchSize = 75; // Scryfall's limit
      
      for (let i = 0; i < cardList.length; i += batchSize) {
        const batch = cardList.slice(i, i + batchSize);
        
        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifiers: batch.map(card => ({ name: card.name }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            data.data.forEach(card => {
              cardMap.set(card.name, card);
            });
          }
          } else {
          throw new Error(`Batch request failed: ${response.status}`);
        }
        
        // Small delay between batches
        if (i + batchSize < cardList.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Batch fetch successful: ${cardMap.size} cards`);
      return cardMap;
      
    } catch (error) {
      console.warn('Batch fetch failed, falling back to individual requests:', error.message);
      
      // Fallback to individual card fetching
      return await fetchCardsIndividually(cardList);
    }
  };

  /**
   * Fetch cards individually as fallback
   * @param {Array} cardList - List of cards to fetch
   * @returns {Map} Map of card names to card data
   */
  const fetchCardsIndividually = async (cardList) => {
    const cardMap = new Map();
    const { searchCardByName } = await import('../utils/scryfallAPI');
    
    console.log('Fetching cards individually...');
    
    for (let i = 0; i < cardList.length; i++) {
      const cardEntry = cardList[i];
      
      try {
        const result = await searchCardByName(cardEntry.name);
        
        if (result.data && result.data.length > 0) {
          const card = result.data[0];
          cardMap.set(cardEntry.name, card);
    } else {
          console.warn(`No data found for card: ${cardEntry.name}`);
          // Create a minimal card object for basic lands and common cards
          const basicCard = createFallbackCard(cardEntry.name, cardEntry.category);
          if (basicCard) {
            cardMap.set(cardEntry.name, basicCard);
          }
        }
        
        // Rate limiting - delay between requests
        if (i < cardList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.warn(`Failed to fetch ${cardEntry.name}:`, error.message);
        // Create a fallback card for essential cards
        const basicCard = createFallbackCard(cardEntry.name, cardEntry.category);
        if (basicCard) {
          cardMap.set(cardEntry.name, basicCard);
        }
      }
    }
    
    console.log(`Individual fetch complete: ${cardMap.size} cards`);
    return cardMap;
  };
  
  /**
   * Create a minimal fallback card object for essential cards
   * @param {string} name - Card name
   * @param {string} category - Card category
   * @returns {Object|null} Basic card object or null
   */
  const createFallbackCard = (name, category) => {
    // Only create fallbacks for essential cards
    const essentialCards = {
      'Sol Ring': { 
        mana_cost: '{1}', 
        type_line: 'Artifact', 
        colors: [],
        color_identity: [],
        cmc: 1
      },
      'Command Tower': { 
        mana_cost: '', 
        type_line: 'Land', 
        colors: [],
        color_identity: [],
        cmc: 0
      },
      'Arcane Signet': { 
        mana_cost: '{2}', 
        type_line: 'Artifact', 
        colors: [],
        color_identity: [],
        cmc: 2
      },
      'Plains': { 
        mana_cost: '', 
        type_line: 'Basic Land — Plains', 
        colors: [],
        color_identity: ['W'],
        cmc: 0
      },
      'Island': { 
        mana_cost: '', 
        type_line: 'Basic Land — Island', 
        colors: [],
        color_identity: ['U'],
        cmc: 0
      },
      'Swamp': { 
        mana_cost: '', 
        type_line: 'Basic Land — Swamp', 
        colors: [],
        color_identity: ['B'],
        cmc: 0
      },
      'Mountain': { 
        mana_cost: '', 
        type_line: 'Basic Land — Mountain', 
        colors: [],
        color_identity: ['R'],
        cmc: 0
      },
      'Forest': { 
        mana_cost: '', 
        type_line: 'Basic Land — Forest', 
        colors: [],
        color_identity: ['G'],
        cmc: 0
      }
    };
    
    const cardData = essentialCards[name];
    if (cardData) {
      return {
        id: `fallback-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: name,
        ...cardData,
        oracle_text: `Fallback card data for ${name}`,
        prices: { usd: '0.00' },
        legalities: { commander: 'legal' },
        set: 'fallback',
        set_name: 'Fallback Set',
        rarity: 'common',
        ai_category: category,
        _fallback: true
      };
    }
    
    return null;
  };
  
  /**
   * Add cards to deck using pre-fetched data
   * @param {Array} cardList - List of cards to add
   * @param {Map} cardDataMap - Pre-fetched card data
   * @param {Array} appliedFixes - Applied fixes for user feedback
   */
  const addCardsFromBatchData = async (cardList, cardDataMap, appliedFixes = []) => {
    resetDeckExceptCommander();
    
    let addedCount = 0;
    const targetCount = 99;
    
    console.log(`Starting deck assembly with ${cardList.length} cards and ${cardDataMap.size} fetched data entries`);
    
    for (const cardEntry of cardList) {
      if (addedCount >= targetCount) break;
      
      const cardData = cardDataMap.get(cardEntry.name);
      if (cardData) {
        try {
          // Add metadata from our processing
          const enhancedCard = {
            ...cardData,
            ai_category: cardEntry.category,
            ai_replacement: appliedFixes.some(fix => fix.replacement === cardEntry.name)
          };
          
          addCard(enhancedCard);
          addedCount++;
          
          if (addedCount % 10 === 0) {
            console.log(`Added ${addedCount} cards so far...`);
          }
        } catch (error) {
          if (error.message?.includes('quota exceeded')) {
            addCard(cardData, false); // Skip caching
            addedCount++;
          } else {
            console.warn(`Failed to add ${cardEntry.name}:`, error);
          }
        }
      } else {
        console.warn(`No data found for card: ${cardEntry.name}`);
      }
    }
    
    console.log(`Successfully added ${addedCount} cards from generated list`);
    
    // Fill remaining slots with basic lands if needed
    if (addedCount < 99) {
      const missingCount = 99 - addedCount;
      console.log(`Adding ${missingCount} basic lands to complete deck`);
      
      try {
        const basicLands = await fetchBasicLands(commander.color_identity, missingCount);
        for (const land of basicLands) {
          if (getCurrentNonCommanderCardCount() < 99) {
            try {
              addCard(land, false); // Skip caching for basic lands
              addedCount++;
            } catch (error) {
              console.error('Error adding basic land:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch basic lands, using fallback generation:', error);
        const basicLands = generateBasicLands(commander.color_identity, missingCount);
        for (const land of basicLands) {
          if (getCurrentNonCommanderCardCount() < 99) {
            try {
              addCard(land, false); // Skip caching for basic lands
              addedCount++;
            } catch (error) {
              console.error('Error adding fallback basic land:', error);
            }
          }
        }
      }
    }
    
    const finalCount = getCurrentNonCommanderCardCount();
    console.log(`Deck assembly complete: ${finalCount} cards added (target: 99)`);
    
    if (finalCount < 99) {
      console.warn(`Warning: Deck only has ${finalCount} cards instead of 99`);
    }
  };
  
  /**
   * Analyze commander's strategy and synergies
   */
  const analyzeCommander = async (commander, deckStyle) => {
    try {
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      const aiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIApiKey()}`
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16',
          messages: [
            { 
              role: 'system', 
              content: 'You are a Magic: The Gathering deck building expert.'
            },
            { 
              role: 'user', 
              content: `Analyze this commander for a ${deckStyle} deck:
                Name: ${commander.name}
                Type: ${commander.type_line || ''}
                Text: ${commander.oracle_text || ''}
                Colors: ${commander.colors?.join('') || ''}`
            }
          ],
          max_completion_tokens: 2000
        })
      });

      const aiData = await aiResponse.json();
      
      // Debug response
      console.error('o3 Response Debug:', {
        status: aiResponse.status,
        choices: aiData.choices,
        usage: aiData.usage,
        finish_reason: aiData.choices?.[0]?.finish_reason
      });

      const content = aiData.choices?.[0]?.message?.content;
      
      if (!content) {
        return await analyzeCommanderFallback(commander, deckStyle);
      }
      
      return content;
    } catch (error) {
      console.error('Error analyzing commander with o3:', error);
      return await analyzeCommanderFallback(commander, deckStyle);
    }
  };
  
  const analyzeCommanderFallback = async (commander, deckStyle) => {
    try {
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      const aiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIApiKey()}`
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16',
          messages: [
            { 
              role: 'system', 
              content: 'You are a Magic: The Gathering deck building expert.'
            },
            { 
              role: 'user', 
              content: `Analyze this commander for a ${deckStyle} deck:
                Name: ${commander.name}
                Type: ${commander.type_line || ''}
                Text: ${commander.oracle_text || ''}
                Colors: ${commander.colors?.join('') || ''}`
            }
          ],
          max_completion_tokens: 2000
        })
      });
      
      const aiData = await aiResponse.json();
      return aiData.choices?.[0]?.message?.content || 
        "Standard commander deck focused on the commander's color identity and abilities.";
    } catch (error) {
      console.error('Fallback analysis also failed:', error);
      return "Standard commander deck focused on the commander's color identity and abilities.";
    }
  };
  
  /**
   * Generate basic land objects based on color identity
   * @param {Array} colorIdentity - Color identity array (e.g., ['W', 'U'])
   * @param {number} count - Number of lands to generate
   * @returns {Array} - Array of basic land objects
   */
  const generateBasicLands = (colorIdentity, count) => {
    const lands = [];
    const colors = colorIdentity || [];
    
    if (colors.length === 0) {
      // Colorless commander - just add Wastes
      lands.push({
        name: "Wastes",
        quantity: count,
        category: "Land"
      });
      return lands;
    }
    
    // Calculate distribution based on color identity
    const landsPerColor = Math.floor(count / colors.length);
    let remaining = count - (landsPerColor * colors.length);
    
    const colorToLand = {
      'W': 'Plains',
      'U': 'Island',
      'B': 'Swamp',
      'R': 'Mountain',
      'G': 'Forest'
    };
    
    // Add lands for each color
    for (const color of colors) {
      const landName = colorToLand[color];
      const extraLand = remaining > 0 ? 1 : 0;
      if (extraLand) remaining--;
      
      if (landName) {
        lands.push({
          name: landName,
          quantity: landsPerColor + extraLand,
          category: "Land"
        });
      }
    }
    
    return lands;
  };
  
  /**
   * Fetch basic land card objects from Scryfall
   * @param {Array} colorIdentity - Color identity array
   * @param {number} count - Number of lands to fetch
   * @returns {Array} - Array of land card objects from Scryfall
   */
  const fetchBasicLands = async (colorIdentity, count) => {
    // Define basic land types and their colors
    const landTypes = {
      'Plains': 'W',
      'Island': 'U',
      'Swamp': 'B',
      'Mountain': 'R',
      'Forest': 'G'
    };

    // Filter lands by color identity
    const availableLands = Object.entries(landTypes)
      .filter(([_, color]) => colorIdentity.includes(color))
      .map(([name]) => name);

    if (availableLands.length === 0) {
      // If no colors match (colorless commander), just use Plains
      availableLands.push('Plains');
    }

    // Calculate distribution
    const landsPerType = Math.floor(count / availableLands.length);
    const remainder = count % availableLands.length;

    // Build the land list
    const lands = [];
    for (const landName of availableLands) {
      // Fetch the basic land data
      try {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(landName)}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${landName}`);
        }
        const landData = await response.json();
        
        // Add the base number of lands
        const numToAdd = landName === availableLands[0] ? 
          landsPerType + remainder : // Add remainder to first land type
          landsPerType;
        
        for (let i = 0; i < numToAdd; i++) {
          lands.push({
            ...landData,
            category: 'Lands',
            quantity: 1
          });
        }
      } catch (error) {
        console.error(`Error fetching ${landName}:`, error);
      }
    }

    return lands;
  };
  
  /**
   * Calculate the total cost of a deck
   * @param {Array} cardList - List of cards with price information
   * @returns {number} - Total deck cost in USD
   */
  const calculateDeckCost = (cardList) => {
    return cardList.reduce((total, card) => {
      const price = card.prices?.usd || 0;
      const quantity = card.quantity || 1;
      return total + (parseFloat(price) * quantity);
    }, 0);
  };

  /**
   * Validate if a card list meets the budget constraints
   * @param {Array} cardList - List of cards to validate
   * @param {number} maxBudget - Maximum allowed budget
   * @returns {Object} - Validation result and any violations
   */
  const validateBudgetConstraints = (cardList, maxBudget) => {
    if (maxBudget === Infinity) return { valid: true, violations: [] };

    const totalCost = calculateDeckCost(cardList);
    const violations = [];

    if (totalCost > maxBudget) {
      violations.push({
        type: 'budget',
        message: `Deck cost ($${totalCost.toFixed(2)}) exceeds budget limit of $${maxBudget.toFixed(2)}`,
        excess: totalCost - maxBudget
      });
    }

    // Find expensive cards that could be replaced
    const expensiveCards = cardList
      .filter(card => parseFloat(card.prices?.usd || 0) > maxBudget * 0.1) // Cards costing more than 10% of budget
      .map(card => ({
        name: card.name,
        price: parseFloat(card.prices?.usd || 0)
      }));

    if (expensiveCards.length > 0) {
      violations.push({
        type: 'expensive_cards',
        message: 'Found expensive cards that could be replaced with budget alternatives',
        cards: expensiveCards
      });
    }

    return {
      valid: violations.length === 0,
      violations,
      totalCost
    };
  };

  /**
   * Validate if a card list meets the archetype distribution requirements
   * @param {Array} cardList - List of cards to validate
   * @param {Object} distribution - Required card distribution
   * @returns {Object} - Validation result and any violations
   */
  const validateCardDistribution = (cardList, distribution) => {
    const counts = {
      lands: 0,
      ramp: 0,
      cardDraw: 0,
      removal: 0,
      boardWipes: 0,
      protection: 0,
      strategy: 0
    };

    // Count cards by category
    cardList.forEach(card => {
      const category = card.category?.toLowerCase() || '';
      
      // Map categories to our distribution keys
      if (category.includes('land')) {
        counts.lands++;
      } else if (category.includes('ramp')) {
        counts.ramp++;
      } else if (category.includes('card draw') || category.includes('draw')) {
        counts.cardDraw++;
      } else if (category.includes('removal') && !category.includes('board wipe')) {
        counts.removal++;
      } else if (category.includes('board wipe') || category.includes('boardwipe')) {
        counts.boardWipes++;
      } else if (category.includes('protection')) {
        counts.protection++;
      } else if (category.includes('strategy') || category.includes('utility') || category.includes('finisher')) {
        counts.strategy++;
      }
    });

    // Check for violations
    const violations = [];
    Object.entries(distribution).forEach(([category, { min, max }]) => {
      const count = counts[category.toLowerCase().replace(/[^a-z]/g, '')];
      if (count < min) {
        violations.push({
          category,
          type: 'below_minimum',
          current: count,
          required: min
        });
      } else if (count > max) {
        violations.push({
          category,
          type: 'above_maximum',
          current: count,
          required: max
        });
      }
    });

    return {
      valid: violations.length === 0,
      violations,
      counts
    };
  };

  /**
   * Fix distribution violations by adjusting the card list
   * @param {Array} cardList - Original card list
   * @param {Object} distributionValidation - Distribution validation results
   * @param {Object} archetypeRules - Current archetype rules
   * @returns {Array} - Updated card list with fixed distribution
   */
  const fixDistributionViolations = async (cardList, distributionValidation, archetypeRules) => {
    const { violations, counts } = distributionValidation;
    let updatedCardList = [...cardList];

    // Helper function to build Scryfall query based on category
    const buildSearchQuery = (category) => {
      const baseQuery = `f:commander id:${commander.color_identity.join('')}`;
      switch (category.toLowerCase()) {
        case 'lands':
          return `${baseQuery} t:land`;
        case 'ramp':
          return `${baseQuery} (o:"add {" or o:"search your library for a" t:land)`;
        case 'carddraw':
          return `${baseQuery} o:"draw a card"`;
        case 'removal':
          return `${baseQuery} (o:destroy or o:exile)`;
        case 'boardwipes':
          return `${baseQuery} (o:"destroy all" or o:"exile all")`;
        case 'protection':
          return `${baseQuery} (o:hexproof or o:indestructible or o:protection)`;
        case 'strategy':
          return `${baseQuery} -t:land -o:"add {" -o:"draw a card" -o:destroy -o:exile`;
        default:
          return baseQuery;
      }
    };

    for (const violation of violations) {
      const category = violation.category.toLowerCase().replace(/[^a-z]/g, '');
      
      if (violation.type === 'below_minimum') {
        const cardsNeeded = violation.required - violation.current;
        
        try {
          // Build appropriate search query for the category
          const searchQuery = buildSearchQuery(category);
          const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&order=edhrec`);
          
          if (!response.ok) {
            console.warn(`Failed to fetch cards for ${category}:`, response.status);
            continue;
          }

          const data = await response.json();
          if (!data.data?.length) continue;

          // Add cards until we meet the minimum
          let addedCount = 0;
          for (const card of data.data) {
            if (addedCount >= cardsNeeded) break;
            
            // Skip if we already have this card
            if (updatedCardList.some(c => c.name === card.name)) continue;
            
            // Add the card with proper category
            updatedCardList.push({
              ...card,
              category: violation.category,
              quantity: 1
            });
            addedCount++;
          }
        } catch (error) {
          console.error(`Error fixing distribution for ${category}:`, error);
        }
      } else if (violation.type === 'above_maximum') {
        // Remove excess cards from this category
        const excessCount = violation.current - violation.required;
        const categoryCards = updatedCardList.filter(card => 
          card.category?.toLowerCase().includes(category)
        );
        
        // Sort by EDHREC rank (if available) to keep the better cards
        categoryCards.sort((a, b) => (a.edhrec_rank || 9999) - (b.edhrec_rank || 9999));
        
        // Remove the lowest ranked excess cards
        const cardsToRemove = categoryCards.slice(-excessCount);
        updatedCardList = updatedCardList.filter(card => 
          !cardsToRemove.some(rc => rc.name === card.name)
        );
      }
    }

    return updatedCardList;
  };

  /**
   * Validate and enforce bracket requirements
   * @param {Array} cardList - List of cards to validate
   * @param {Object} targetBracket - Target bracket range {min, max}
   * @returns {Array} - Updated card list meeting bracket requirements
   */
  const enforceBracketRequirements = async (cardList, targetBracket) => {
    // Define power level indicators
    const powerIndicators = {
      high: [
        'force of', 'mana crypt', 'mana vault', 'demonic tutor', 'vampiric tutor',
        'cyclonic rift', 'rhystic study', 'mystic remora', 'necropotence',
        'craterhoof behemoth', 'expropriate', 'time warp', 'armageddon'
      ],
      medium: [
        'cultivate', 'kodama\'s reach', 'counterspell', 'swords to plowshares',
        'path to exile', 'lightning greaves', 'swiftfoot boots', 'sol ring'
      ]
    };

    let powerScore = 0;
    const cardNames = cardList.map(card => card.name.toLowerCase());

    // Calculate power score
    cardNames.forEach(name => {
      if (powerIndicators.high.some(card => name.includes(card))) {
        powerScore += 2;
      } else if (powerIndicators.medium.some(card => name.includes(card))) {
        powerScore += 1;
      }
    });

    // Convert power score to bracket (1-5)
    const currentBracket = Math.min(5, Math.max(1, Math.ceil(powerScore / 5)));

    // If bracket is too high, remove powerful cards
    if (currentBracket > targetBracket.max) {
      const cardsToRemove = cardList.filter(card => 
        powerIndicators.high.some(indicator => 
          card.name.toLowerCase().includes(indicator)
        )
      );

      // Replace powerful cards with more casual alternatives
      for (const card of cardsToRemove) {
        try {
          const category = card.category;
          const searchQuery = `f:commander -${powerIndicators.high.join(' -')} id:${commander.color_identity.join('')}`;
          
          const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&order=edhrec`);
          const data = await response.json();
          
          if (data.data && data.data.length > 0) {
            const replacement = data.data[0];
            const index = cardList.findIndex(c => c.name === card.name);
            if (index !== -1) {
              cardList[index] = { ...replacement, category, quantity: 1 };
            }
          }
        } catch (error) {
          console.error(`Error finding replacement for ${card.name}:`, error);
        }
      }
    }

    return cardList;
  };

  // Clear paywall blocked state
  const clearPaywallBlocked = () => {
    setPaywallBlocked(false);
    setError(null);
  };

  /**
   * Validate and fix singleton violations in a card list
   * @param {Array} cardList - List of cards to validate
   * @returns {Array} - Fixed card list with singleton violations resolved
   */
  const validateAndFixSingletonViolations = (cardList) => {
    const cardCounts = new Map();
    const validatedCards = [];
    const duplicateReplacements = [
      'Arcane Signet', 'Commander\'s Sphere', 'Mind Stone', 'Fellwar Stone',
      'Worn Powerstone', 'Hedron Archive', 'Thran Dynamo', 'Gilded Lotus',
      'Swiftfoot Boots', 'Lightning Greaves', 'Wayfarer\'s Bauble',
      'Evolving Wilds', 'Terramorphic Expanse', 'Myriad Landscape',
      'Chromatic Lantern', 'Burnished Hart', 'Solemn Simulacrum',
      'Thought Vessel', 'Pristine Talisman', 'Opaline Unicorn',
      'Rupture Spire', 'Transguild Promenade', 'Gateway Plaza'
    ];
    let replacementIndex = 0;

    for (const card of cardList) {
      const cardName = card.name;
      
      // Basic lands are exempt from singleton rule
      const isBasicLand = card.type_line && 
        card.type_line.includes('Basic') && 
        card.type_line.includes('Land');
      
      if (isBasicLand) {
        validatedCards.push(card);
        continue;
      }
      
      // Check if we've seen this card before
      if (cardCounts.has(cardName)) {
        console.warn(`Singleton violation detected: ${cardName} appears multiple times, replacing duplicate`);
        
        // Find a replacement that hasn't been used
        let replacementName = null;
        while (replacementIndex < duplicateReplacements.length) {
          const candidate = duplicateReplacements[replacementIndex];
          if (!cardCounts.has(candidate)) {
            replacementName = candidate;
            break;
          }
          replacementIndex++;
        }
        
        if (replacementName) {
          // Create replacement card
          const replacementCard = createFallbackCard(replacementName, card.category || 'Utility');
          if (replacementCard) {
            validatedCards.push({
              ...replacementCard,
              singleton_replacement: true,
              original_duplicate: cardName
            });
            cardCounts.set(replacementName, 1);
          }
        } else {
          console.warn(`No more unique replacements available, skipping duplicate ${cardName}`);
        }
      } else {
        // First occurrence of this card
        validatedCards.push(card);
        cardCounts.set(cardName, 1);
      }
    }
    
    return validatedCards;
  };

  /**
   * Generate initial deck using o3 for superior quality and comprehensive analysis (Stage 1)
   */
  const generateInitialDeckWithO3 = async (commander, deckStyle, archetypeRules) => {
    if (!commander) {
      throw new Error('Commander is required for AI deck generation');
    }

    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const { prompt: archetypePrompt, cardDistribution, maxBudget, targetBracket } = archetypeRules;
    
    const budgetConstraint = maxBudget !== Infinity ? 
      `Keep the total deck cost under $${maxBudget}.` : '';

    const bracketConstraint = `Target power level should be between bracket ${targetBracket.min}-${targetBracket.max} (1=casual, 5=cEDH).`;

    const distributionRequirements = Object.entries(cardDistribution)
      .map(([category, { min, max }]) => `${category}: ${min}-${max} cards`)
      .join(', ');

    const prompt = `You are an expert Magic: The Gathering deck builder specialized in Commander format.

Build a complete 99-card Commander deck optimized for SPEED and broad synergy:

Commander: ${commander.name}
Color Identity: ${commander.color_identity?.join('') || 'Colorless'}
Commander Type: ${commander.type_line}
Commander Text: ${commander.oracle_text || 'No text available'}
Deck Style: ${deckStyle}

SPEED PRIORITY: Generate functional deck quickly. Focus on:
- Strong synergies with commander abilities
- Proper mana base foundation (32-34 lands)
- Essential staples for the archetype
- ${distributionRequirements}
- ${bracketConstraint}
- ${budgetConstraint}

${archetypePrompt}

IMPORTANT GUIDELINES:
- Include staple cards appropriate for the power level
- Don't worry about perfect validation - we'll fix issues later
- Focus on deck function over edge case compliance
- All card names must be spelled exactly as they appear on official Magic cards
- For double-faced cards, use only the front face name (e.g., "Brightclimb Pathway" not "Brightclimb Pathway // Grimclimb Pathway")

FORMAT REQUIREMENTS:
- Return ONLY a valid JSON array
- NO comments, explanations, or text outside the JSON
- NO // characters except in card names where absolutely necessary
- Use this exact format for each card:

{"name": "Card Name", "category": "Category"}

Categories must be one of: "Lands", "Ramp", "Card Draw", "Removal", "Board Wipes", "Protection", "Strategy", "Utility", "Finisher"

CRITICAL: Ensure exactly 99 cards are included. Return only the JSON array, nothing else.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'o3-2025-04-16', // Use o3 for superior deck generation quality
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert MTG deck builder with deep knowledge of all cards and synergies. Generate highly optimized decks with perfect card choices and strategic coherence.'
            },
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 8000 // Large token limit for comprehensive deck generation
          // Note: o3 model uses default temperature (1) - no temperature parameter needed
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        throw new Error('No response received from OpenAI');
      }

      // Parse the JSON response
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/) || 
                          responseText.match(/\{[\s\S]*\}/);
        
        const jsonText = jsonMatch ? jsonMatch[0] : responseText;
        const cardList = parseJSONWithComments(jsonText);

        // Basic validation
        if (!Array.isArray(cardList)) {
          throw new Error('AI response is not an array');
        }

        if (cardList.length === 0) {
          throw new Error('AI returned empty card list');
        }

        console.log(`Stage 1 completed: Generated ${cardList.length} cards`);
        return cardList;

      } catch (parseError) {
        console.error('Error parsing AI deck response:', parseError);
        console.error('Raw response:', responseText);
        throw new Error('Failed to parse deck list from AI response');
      }

    } catch (error) {
      console.error('Error generating deck with o3:', error);
      if (error.message.includes('API key')) {
        throw new Error('AI service configuration error');
      }
      throw error;
    }
  };

  return {
    buildCompleteDeck,
    isLoading,
    error,
    progress,
    paywallBlocked,
    clearPaywallBlocked,
    canMakeAIRequest,
    isPremium,
    // Progressive UI state
    buildingStage,
    currentCards,
    currentViolations,
    appliedFixes
  };
}; 