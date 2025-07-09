import { useState, useEffect, useRef } from 'react';
import { useDeck } from '../context/DeckContext';
import { getOpenAIApiKey } from '../utils/openaiAPI';

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
    'Talisman of Conviction': ['R', 'W'],
    // Add the cards causing issues with Cid
    'Thopter Foundry': ['B', 'U', 'W'],
    'Time Sieve': ['B', 'U'],
    // Artifacts with off-color activated abilities
    'Cranial Plating': ['B'], // Has {B}{B}: Attach ability
    'Scuttlemutt': ['W', 'U', 'B', 'R', 'G'], // Has WUBRG activated abilities
    'Golem Artisan': ['W', 'U', 'R'], // Has colored activated abilities
    'Birthing Pod': ['G'], // Has green activated ability
    // Add other common color identity violators
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
    // Equipment with off-color abilities
    'Sword of Fire and Ice': ['R', 'U'],
    'Sword of Light and Shadow': ['W', 'B'],
    'Sword of War and Peace': ['R', 'W'],
    'Sword of Body and Mind': ['G', 'U'],
    'Sword of Feast and Famine': ['B', 'G'],
    'Sword of Truth and Justice': ['W', 'U']
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

// Check for obvious color violations based on card name patterns
const isObviousColorViolation = (cardName, commanderColorIdentity) => {
  if (!cardName || !Array.isArray(commanderColorIdentity)) return false;
  
  const lowerName = cardName.toLowerCase();
  
  // Obvious color indicators in card names
  const colorIndicators = {
    'B': ['swamp', 'black', 'dark', 'shadow', 'death', 'doom', 'demonic', 'diabolic', 'corrupt', 'plague', 'zombie', 'skeleton'],
    'R': ['mountain', 'red', 'fire', 'flame', 'burn', 'lightning', 'shock', 'goblin', 'dragon', 'rage'],
    'G': ['forest', 'green', 'nature', 'growth', 'wild', 'beast', 'elf', 'druid', 'giant', 'vine'],
    'U': ['island', 'blue', 'water', 'sea', 'mind', 'thought', 'counter', 'draw', 'wizard', 'merfolk'],
    'W': ['plains', 'white', 'holy', 'divine', 'angel', 'knight', 'soldier', 'heal', 'protect', 'serra']
  };
  
  // Check if card name contains indicators for colors not in commander identity
  for (const [color, indicators] of Object.entries(colorIndicators)) {
    if (!commanderColorIdentity.includes(color)) {
      for (const indicator of indicators) {
        if (lowerName.includes(indicator)) {
          // Additional checks to avoid false positives
          if (indicator === 'fire' && lowerName.includes('firebreathing')) continue; // Generic ability
          if (indicator === 'lightning' && lowerName.includes('lightning greaves')) continue; // Artifact
          return true;
        }
      }
    }
  }
  
  // Check for obvious guild/shard/wedge names that indicate multiple colors
  const multiColorIndicators = [
    'azorius', 'dimir', 'rakdos', 'gruul', 'selesnya', // Guilds
    'orzhov', 'izzet', 'golgari', 'boros', 'simic',
    'bant', 'esper', 'grixis', 'jund', 'naya', // Shards
    'abzan', 'jeskai', 'sultai', 'mardu', 'temur' // Wedges
  ];
  
  for (const indicator of multiColorIndicators) {
    if (lowerName.includes(indicator)) {
      return true; // These almost always indicate multi-color cards
    }
  }
  
  // Check for artifacts that commonly have off-color abilities
  const problematicArtifacts = [
    'plating', 'sword of', 'talisman', 'charm', 'pod', 'artisan'
  ];
  
  for (const artifact of problematicArtifacts) {
    if (lowerName.includes(artifact)) {
      // These artifact types often have color identity issues
      return true;
    }
  }
  
  return false;
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
  
  // Track automatically filtered color identity violations
  const [filteredColorViolations, setFilteredColorViolations] = useState([]);


  const deckContext = useDeck(); // Use the whole context object
  const { 
    commander, 
    addCard, 
    resetDeckExceptCommander,
    cards, // cards from context is a snapshot, ref will hold latest for async operations
    removeCard,
    mainDeckCardCount
  } = deckContext; // Destructure from deckContext if needed, or use deckContext.addCard etc.

  const getCurrentNonCommanderCardCount = () => {
    // Use the properly computed mainDeckCardCount from DeckContext
    return mainDeckCardCount || 0;
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
   * @param {Object} options - Additional options like custom budget
   * @returns {Object} - Object containing archetype rules and constraints
   */
  const getArchetypeRules = (deckStyle, options = {}) => {
    switch (deckStyle) {
      case 'competitive':
        return {
          maxBudget: 5000, // Higher budget for competitive
          distribution: {
            lands: { min: 34, max: 38 },
            ramp: { min: 10, max: 12 },
            draw: { min: 10, max: 15 },
            removal: { min: 8, max: 12 },
            protection: { min: 5, max: 8 },
            core: { min: 20, max: 25 }
          },
          powerLevel: 'high',
          prioritizeEfficiency: true,
          includeReservedList: true
        };

      case 'casual':
        return {
          maxBudget: 1000, // Moderate budget for casual
          distribution: {
            lands: { min: 36, max: 38 },
            ramp: { min: 8, max: 10 },
            draw: { min: 8, max: 12 },
            removal: { min: 6, max: 10 },
            protection: { min: 4, max: 6 },
            core: { min: 25, max: 30 }
          },
          powerLevel: 'medium',
          prioritizeEfficiency: false,
          includeReservedList: false
        };

      case 'budget':
        const customBudget = options.customBudget || 100;
        // Calculate max card price based on budget (5-15% of total budget)
        const maxCardPrice = Math.max(1, Math.min(customBudget * 0.1, 20));
        
        return {
          maxBudget: customBudget, // Use custom budget
          distribution: {
            lands: { min: 36, max: 38 },
            ramp: { min: 10, max: 12 }, // Increased ramp for budget decks
            draw: { min: 10, max: 12 }, // Increased draw to help find key pieces
            removal: { min: 8, max: 10 },
            protection: { min: 4, max: 6 },
            core: { min: 25, max: 30 }
          },
          powerLevel: customBudget <= 50 ? 'ultra-low' : customBudget <= 100 ? 'low' : customBudget <= 200 ? 'low-medium' : 'medium',
          prioritizeEfficiency: false,
          includeReservedList: false,
          preferBudgetOptions: true,
          maxCardPrice: maxCardPrice, // Dynamic max card price based on budget
          budgetPriorities: {
            lands: customBudget <= 50 ? 'basic' : customBudget <= 100 ? 'budget' : 'efficient', // Prefer basic lands for ultra-budget
            ramp: 'artifacts', // Prefer artifact ramp
            protection: 'targeted' // Prefer targeted protection over expensive global effects
          }
        };

      default:
        return getArchetypeRules('casual', options); // Default to casual rules
    }
  };

  /**
   * Build a complete deck using the three-stage pipeline
   * @param {string} deckStyle - The desired deck style/strategy
   * @param {Object} options - Additional options like custom budget
   */
  const buildCompleteDeck = async (deckStyle = 'competitive', options = {}) => {
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



    try {
      setIsLoading(true);
      setError(null);
      setPaywallBlocked(false);
      

      
      resetDeckExceptCommander();
      
      // Clear previous state
      setFilteredColorViolations([]);
      
      // STAGE 1: High-Quality Initial Generation with o3
      setBuildingStage('Generating initial deck structure...');
      setProgress(10);
      console.log('Stage 1: Starting comprehensive generation with o3');
      
      const archetypeRules = getArchetypeRules(deckStyle, options);
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
        setBuildingStage('Fixing validation issues...');
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
      // Note: Don't clear filteredColorViolations here so user can see the report
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
      `Keep the total deck cost under $${maxBudget}. Individual cards should not exceed $${archetypeRules.maxCardPrice || Math.floor(maxBudget * 0.1)} each. ${maxBudget <= 50 ? 'Prioritize commons and uncommons with high value.' : maxBudget <= 100 ? 'Focus on budget staples and efficient cards.' : maxBudget <= 200 ? 'Include mid-range staples while staying budget-conscious.' : 'Use premium cards but maintain cost awareness.'}` : '';

    const bracketConstraint = `Target power level should be between bracket ${targetBracket.min}-${targetBracket.max} (1=casual, 5=cEDH).`;

    // Format card distribution requirements
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

CRITICAL COLOR IDENTITY RULES:
- ONLY include cards that match the commander's color identity: ${commander.color_identity?.join(', ') || 'Colorless'}
- A card's color identity includes ALL mana symbols in its mana cost AND rules text
- Examples of FORBIDDEN cards for this commander:
  ${commander.color_identity?.includes('B') ? '' : '- NO Black cards (like Thoughtseize, Doom Blade, Demonic Tutor)'}
  ${commander.color_identity?.includes('R') ? '' : '- NO Red cards (like Lightning Bolt, Shock, Goblin Guide)'}
  ${commander.color_identity?.includes('G') ? '' : '- NO Green cards (like Llanowar Elves, Rampant Growth, Giant Growth)'}
  ${commander.color_identity?.includes('U') ? '' : '- NO Blue cards (like Counterspell, Brainstorm, Ponder)'}
  ${commander.color_identity?.includes('W') ? '' : '- NO White cards (like Swords to Plowshares, Wrath of God, Serra Angel)'}
- AVOID multi-colored cards that contain colors outside the commander's identity
- AVOID artifacts with colored mana symbols in their rules text

SPEED PRIORITY: Generate functional deck quickly. Focus on:
- Strong synergies with commander abilities
- Proper mana base foundation${deckStyle === 'budget' && maxBudget <= 100 ? ' (emphasize basic lands and budget duals)' : ''}
- Essential staples for the archetype
- ${distributionRequirements}
- ${powerLevelConstraint}
- ${budgetConstraint}
- ${efficiencyNote}

${deckStyle === 'budget' ? `
BUDGET-SPECIFIC GUIDELINES:
- Prefer artifact ramp like Sol Ring, Arcane Signet, Commander's Sphere, Mind Stone
- Include budget card draw like Divination, Sign in Blood, Read the Bones
- Use efficient removal like Swords to Plowshares, Path to Exile, Murder, Destroy Evil
- Avoid expensive cards like fetch lands, dual lands, tutors, and premium artifacts
- Focus on synergy over raw power level
- Consider budget alternatives: Command Tower over expensive duals, basic lands over shocklands
${maxBudget <= 50 ? '- Ultra-budget focus: prioritize cards under $1, use mostly basics for mana base' : ''}
${maxBudget <= 100 ? '- Budget-friendly: mix of budget staples and efficient cards under $5' : ''}
${maxBudget > 100 ? '- Higher budget: can include some mid-range staples and better manabase' : ''}
` : ''}

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

Categories must be one of: "Lands", "Ramp", "Draw", "Removal", "Protection", "Core"

CRITICAL: Ensure exactly 99 cards are included. Return only the JSON array, nothing else.`;

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

          // Enhanced color identity validation (basic validation)
          if (!validateCardColorIdentity(card.name, commander.color_identity)) {
            console.warn(`Color identity violation: ${card.name}`);
            return false;
          }

          // Additional check for obviously wrong color cards based on name patterns
          if (isObviousColorViolation(card.name, commander.color_identity)) {
            console.warn(`Obvious color violation detected: ${card.name}`);
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
   * Normalize card names to handle common misspellings and variations
   * @param {string} cardName - Original card name
   * @returns {string} Normalized card name
   */
  const normalizeCardName = (cardName) => {
    if (!cardName || typeof cardName !== 'string') return cardName;
    
    // Handle split/fuse cards first (cards with " // " in the name)
    if (cardName.includes(' // ')) {
      // For split cards, return the exact name as-is for Scryfall
      // Scryfall expects the full name with " // " format
      console.log(`Split card detected: ${cardName} - keeping exact format`);
      return cardName;
    }
    
    // Handle potential AI-generated split card variations
    if (cardName.includes(' / ') && !cardName.includes(' // ')) {
      // Convert single slash to double slash for proper Scryfall search
      const corrected = cardName.replace(' / ', ' // ');
      console.log(`Converting split card format: ${cardName} → ${corrected}`);
      return corrected;
    }
    
    // Common misspellings and their corrections
    const corrections = {
      'Felwar Stone': 'Fellwar Stone',
      'Comand Tower': 'Command Tower',
      'Comandeer\'s Sphere': 'Commander\'s Sphere',
      'Arcain Signet': 'Arcane Signet',
      'Ethereum Sculptor': 'Etherium Sculptor',
      'The Ozolith, Shattered Spire': 'The Ozolith', // The actual card name
      'Sejiri Glacier': 'Sejiri Refuge', // Likely meant Sejiri Refuge
      'Thriving Heath': 'Thriving Heath', // Already correct
      'Thriving Isle': 'Thriving Isle', // Already correct
      'Meandering River': 'Meandering River', // Already correct
      'Tranquil Cove': 'Tranquil Cove', // Already correct
      'Azorius Guildgate': 'Azorius Guildgate', // Already correct
      'Port Town': 'Port Town', // Already correct
      'Thought Vessel': 'Thought Vessel', // Already correct
      'Pristine Talisman': 'Pristine Talisman', // Already correct
      'Opaline Unicorn': 'Opaline Unicorn', // Already correct
      'Pyramid of the Pantheon': 'Pyramid of the Pantheon', // Already correct
      'Sky Sovereign Consul Flagship': 'Sky Sovereign, Consul Flagship', // Add comma
      
      // Common split card variations (in case AI generates them incorrectly)
      'Wear/Tear': 'Wear // Tear',
      'Fire/Ice': 'Fire // Ice',
      'Life/Death': 'Life // Death',
      'Order/Chaos': 'Order // Chaos',
      'Night/Day': 'Night // Day',
      'Research/Development': 'Research // Development',
      'Crime/Punishment': 'Crime // Punishment',
      'Supply/Demand': 'Supply // Demand',
      'Hide/Seek': 'Hide // Seek',
      'Hit/Run': 'Hit // Run',
      'Rise/Fall': 'Rise // Fall',
      'Bound/Determined': 'Bound // Determined',
      'Flesh/Blood': 'Flesh // Blood',
      'Pure/Simple': 'Pure // Simple',
      'Rough/Tumble': 'Rough // Tumble',
      'Stand/Deliver': 'Stand // Deliver',
      'Trial/Error': 'Trial // Error',
      'Turn/Burn': 'Turn // Burn',
      'Wear and Tear': 'Wear // Tear', // Common misname
      'Tooth/Nail': 'Tooth and Nail', // This is actually not a split card
      
      // Transform cards (double-faced cards) - AI sometimes adds both sides
      'Treasure Map // Treasure Cove': 'Treasure Map',
      'Treasure Cove': 'Treasure Map', // Search for front face
      'Search for Azcanta // Azcanta, the Sunken Ruin': 'Search for Azcanta',
      'Azcanta, the Sunken Ruin': 'Search for Azcanta',
      'Legion\'s Landing // Adanto, the First Fort': 'Legion\'s Landing',
      'Adanto, the First Fort': 'Legion\'s Landing',
      'Growing Rites of Itlimoc // Itlimoc, Cradle of the Sun': 'Growing Rites of Itlimoc',
      'Itlimoc, Cradle of the Sun': 'Growing Rites of Itlimoc',
      'Thaumatic Compass // Spires of Orazca': 'Thaumatic Compass',
      'Spires of Orazca': 'Thaumatic Compass',
      'Azcanta the Sunken Ruin': 'Search for Azcanta', // Without comma
      'Adanto the First Fort': 'Legion\'s Landing', // Without comma
      'Itlimoc Cradle of the Sun': 'Growing Rites of Itlimoc', // Without comma
      
      // Modal double-faced cards (from Zendikar Rising onwards)
      'Kazandu Mammoth // Kazandu Valley': 'Kazandu Mammoth',
      'Kazandu Valley': 'Kazandu Mammoth',
      'Bala Ged Recovery // Bala Ged Sanctuary': 'Bala Ged Recovery',
      'Bala Ged Sanctuary': 'Bala Ged Recovery',
      'Turntimber Symbiosis // Turntimber, Serpentine Wood': 'Turntimber Symbiosis',
      'Turntimber, Serpentine Wood': 'Turntimber Symbiosis',
      
      // Modal Double-Faced Lands (Zendikar Rising) - Map back faces to front faces
      'Needleverge Pathway': 'Hengate Pathway', // Red/White land
      'Hengate Pathway // Needleverge Pathway': 'Hengate Pathway',
      'Murkwater Pathway': 'Riverglide Pathway', // Blue/Black land  
      'Riverglide Pathway // Murkwater Pathway': 'Riverglide Pathway',
      'Lavaglide Pathway': 'Brightclimb Pathway', // White/Red land
      'Brightclimb Pathway // Lavaglide Pathway': 'Brightclimb Pathway',
      'Grimclimb Pathway': 'Clearwater Pathway', // Blue/Black land alt
      'Clearwater Pathway // Murkwater Pathway': 'Clearwater Pathway',
      'Branchloft Pathway': 'Cragcrown Pathway', // Red/Green land
      'Cragcrown Pathway // Timbercrown Pathway': 'Cragcrown Pathway',
      'Timbercrown Pathway': 'Cragcrown Pathway',
      'Boulderloft Pathway': 'Brightclimb Pathway', // White/Red alt
      'Darkbore Pathway': 'Clearwater Pathway', // Blue/Black alt
      
      // Kaldheim Modal Double-Faced Cards
      'Immersturm Skullcairn': 'Immersturm Raider',
      'Immersturm Raider // Immersturm Skullcairn': 'Immersturm Raider',
      'Gnottvold Slumbermound': 'Gnottvold Recluse', 
      'Gnottvold Recluse // Gnottvold Slumbermound': 'Gnottvold Recluse',
      
      // Strixhaven Modal Double-Faced Cards  
      'Pelakka Caverns': 'Pelakka Predation',
      'Pelakka Predation // Pelakka Caverns': 'Pelakka Predation',
      'Tangled Florahedron // Tangled Vale': 'Tangled Florahedron',
      'Tangled Vale': 'Tangled Florahedron'
    };
    
    const corrected = corrections[cardName] || cardName;
    if (corrected !== cardName) {
      console.log(`Card name correction: ${cardName} → ${corrected}`);
    }
    
    return corrected;
  };

  /**
   * Fetch card data with fallback to individual requests
   * @param {Array} cardList - List of cards to fetch
   * @returns {Map} Map of card names to card data
   */
  const fetchCardDataBatch = async (cardList) => {
    const cardMap = new Map();
    
    // Normalize card names first
    const normalizedCardList = cardList.map(card => ({
      ...card,
      originalName: card.name,
      name: normalizeCardName(card.name)
    }));
    
    // Debug: Log any cards that were normalized
    const normalizedCards = normalizedCardList.filter(card => card.name !== card.originalName);
    if (normalizedCards.length > 0) {
      console.log(`🔄 Normalized ${normalizedCards.length} card names:`, 
        normalizedCards.map(c => `${c.originalName} → ${c.name}`)
      );
    }
    
    console.log(`Fetching data for ${normalizedCardList.length} cards...`);
    
    // First try batch fetching
    try {
      console.log('Attempting batch fetch for', normalizedCardList.length, 'cards...');
      const batchSize = 75; // Scryfall's limit
      
      for (let i = 0; i < normalizedCardList.length; i += batchSize) {
        const batch = normalizedCardList.slice(i, i + batchSize);
        
        console.log(`Fetching batch ${Math.floor(i / batchSize) + 1} with ${batch.length} cards`);
        
        // Debug: Log what we're sending to Scryfall
        const requestPayload = {
          identifiers: batch.map(card => ({ name: card.name }))
        };
        
        // Log split cards and modal cards specifically
        const splitCardsInBatch = batch.filter(card => card.name.includes(' // '));
        const modalCardsInBatch = batch.filter(card => 
          card.originalName !== card.name && !card.name.includes(' // ')
        );
        
        if (splitCardsInBatch.length > 0) {
          console.log(`🔀 Split cards in batch ${Math.floor(i / batchSize) + 1}:`, 
            splitCardsInBatch.map(c => c.name)
          );
        }
        
        if (modalCardsInBatch.length > 0) {
          console.log(`🔄 Modal cards normalized in batch ${Math.floor(i / batchSize) + 1}:`, 
            modalCardsInBatch.map(c => `${c.originalName} → ${c.name}`)
          );
        }

        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            console.log(`Batch ${Math.floor(i / batchSize) + 1} returned ${data.data.length} cards`);
            data.data.forEach(card => {
              // Normalize card data for double-faced cards
              const normalizedCard = normalizeCardData(card);
              
              // Map both the original name and normalized name to the card data
              const originalCard = batch.find(c => c.name === card.name);
              if (originalCard) {
                cardMap.set(originalCard.originalName, normalizedCard);
                if (originalCard.originalName !== card.name) {
                  cardMap.set(card.name, normalizedCard); // Also map the correct name
                }
              }
            });
            
            // Log any cards that weren't found in this batch
            const notFoundInBatch = batch.filter(batchCard => 
              !data.data.some(foundCard => foundCard.name === batchCard.name)
            );
            if (notFoundInBatch.length > 0) {
              console.warn(`Batch ${Math.floor(i / batchSize) + 1} missing cards:`, notFoundInBatch.map(c => `${c.originalName} (searched as: ${c.name})`));
              
              // For debugging: Log the exact request that was sent for failed cards
              notFoundInBatch.forEach(card => {
                console.warn(`   🔍 Debug: Card "${card.name}" not found in Scryfall batch response`);
                console.warn(`   📝 Original name: "${card.originalName}"`);
                console.warn(`   🔄 Normalized name: "${card.name}"`);
                if (card.name.includes(' // ')) {
                  console.warn(`   ⚠️  Split card detected - this should work with Scryfall`);
                }
              });
            }
          }
        } else {
          console.warn(`Batch request ${Math.floor(i / batchSize) + 1} failed: ${response.status}`);
          throw new Error(`Batch request failed: ${response.status}`);
        }
        
        // Small delay between batches
        if (i + batchSize < normalizedCardList.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Batch fetch successful: ${cardMap.size} cards found out of ${normalizedCardList.length} requested`);
      
      // Log any cards that are still missing
      const missingCards = normalizedCardList.filter(card => !cardMap.has(card.originalName));
      if (missingCards.length > 0) {
        console.warn(`Missing cards after batch fetch:`, missingCards.map(c => `${c.originalName} (normalized: ${c.name})`));
        
        // Try individual searches for cards that failed in batch (likely split/transform cards)
        console.log(`🔄 Attempting individual searches for ${missingCards.length} cards that failed in batch...`);
        
        for (const missingCard of missingCards) {
          try {
            // For split cards and transform cards, use direct Scryfall exact search
            const exactUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(missingCard.name)}`;
            console.log(`🎯 Trying exact search for: ${missingCard.name}`);
            
            const exactResponse = await fetch(exactUrl);
            if (exactResponse.ok) {
              const exactCard = await exactResponse.json();
              const normalizedExactCard = normalizeCardData(exactCard);
              cardMap.set(missingCard.originalName, normalizedExactCard);
              if (missingCard.originalName !== missingCard.name) {
                cardMap.set(missingCard.name, normalizedExactCard);
              }
              console.log(`✅ Found ${missingCard.name} via exact search`);
            } else {
              console.warn(`❌ Exact search failed for ${missingCard.name}: ${exactResponse.status}`);
            }
            
            // Rate limiting between individual requests
            await new Promise(resolve => setTimeout(resolve, 100));
            
          } catch (error) {
            console.warn(`❌ Individual search error for ${missingCard.name}:`, error.message);
          }
        }
        
        console.log(`Individual search complete. Final card count: ${cardMap.size}`);
      }
      
      // CRITICAL: Filter out color identity violations using actual Scryfall data
      console.log('Filtering color identity violations using Scryfall data...');
      const { validCards, violations } = filterColorIdentityViolations(cardMap, commander.color_identity || []);
      
      // Store violations in state for user reporting
      setFilteredColorViolations(prev => [...prev, ...violations]);
      
      if (violations.length > 0) {
        console.log(`🚫 Automatically filtered out ${violations.length} color identity violations:`);
        violations.forEach(v => console.log(`   - ${v.cardName}: [${v.cardColorIdentity?.join(', ')}] violates commander identity [${commander.color_identity?.join(', ')}]`));
      }
      
      console.log(`✅ Final valid cards: ${validCards.size} out of ${cardMap.size} fetched`);
      return validCards;
      
    } catch (error) {
      console.warn('Batch fetch failed, falling back to individual requests:', error.message);
      
      // Fallback to individual card fetching with normalized names
      return await fetchCardsIndividually(normalizedCardList);
    }
  };

  /**
   * Fetch cards individually as fallback
   * @param {Array} cardList - List of cards to fetch (may include originalName property)
   * @returns {Map} Map of card names to card data
   */
  const fetchCardsIndividually = async (cardList) => {
    const cardMap = new Map();
    const { searchCardByName } = await import('../utils/scryfallAPI');
    
    console.log('Fetching cards individually...');
    
    for (let i = 0; i < cardList.length; i++) {
      const cardEntry = cardList[i];
      const searchName = cardEntry.name; // This should be the normalized name
      const originalName = cardEntry.originalName || cardEntry.name;
      
      try {
        let result = await searchCardByName(searchName);
        
        // If initial search failed and this is a split card, try exact name search
        if ((!result.data || result.data.length === 0) && searchName.includes(' // ')) {
          console.log(`🔄 Split card "${searchName}" not found, trying exact name search...`);
          try {
            const exactResponse = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(searchName)}`);
            if (exactResponse.ok) {
              const exactCard = await exactResponse.json();
              const normalizedExactCard = normalizeCardData(exactCard);
              result = { data: [normalizedExactCard] };
              console.log(`✅ Found "${searchName}" using exact search`);
            }
          } catch (exactError) {
            console.warn(`❌ Exact search also failed for "${searchName}":`, exactError.message);
          }
        }
        
        if (result.data && result.data.length > 0) {
          const card = result.data[0];
          const normalizedCard = normalizeCardData(card);
          // Map using the original name so addCardsFromBatchData can find it
          cardMap.set(originalName, normalizedCard);
          // Also map the normalized name if different
          if (originalName !== searchName) {
            cardMap.set(searchName, normalizedCard);
          }
          console.log(`✅ Successfully fetched: ${originalName}`);
        } else {
          console.warn(`❌ No data found for card: ${originalName} (searched as: ${searchName})`);
          // Create a minimal card object for basic lands and common cards
          const basicCard = createFallbackCard(originalName, cardEntry.category);
          if (basicCard) {
            cardMap.set(originalName, basicCard);
            console.log(`🆘 Using fallback data for: ${originalName}`);
          }
        }
        
        // Rate limiting - delay between requests
        if (i < cardList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.warn(`Failed to fetch ${originalName} (searched as: ${searchName}):`, error.message);
        // Create a fallback card for essential cards
        const basicCard = createFallbackCard(originalName, cardEntry.category);
        if (basicCard) {
          cardMap.set(originalName, basicCard);
        }
      }
    }
    
    console.log(`Individual fetch complete: ${cardMap.size} cards`);
    
    // Filter color identity violations for individually fetched cards too
    console.log('Filtering color identity violations from individually fetched cards...');
    const { validCards, violations } = filterColorIdentityViolations(cardMap, commander.color_identity || []);
    
    // Store violations in state for user reporting
    setFilteredColorViolations(prev => [...prev, ...violations]);
    
    if (violations.length > 0) {
      console.log(`🚫 Filtered out ${violations.length} color identity violations from individual fetch:`);
      violations.forEach(v => console.log(`   - ${v.cardName}: [${v.cardColorIdentity?.join(', ')}] violates commander identity [${commander.color_identity?.join(', ')}]`));
    }
    
    console.log(`✅ Final valid cards from individual fetch: ${validCards.size} out of ${cardMap.size} fetched`);
    return validCards;
  };
  
  /**
   * Normalize card data for double-faced cards to ensure proper image URIs and data
   * @param {Object} cardData - Raw card data from Scryfall
   * @returns {Object} Normalized card data with proper image URIs
   */
  const normalizeCardData = (cardData) => {
    if (!cardData) return cardData;
    
    // Handle split cards (like "Wear // Tear") - ensure they have image_uris
    if (cardData.name && cardData.name.includes(' // ') && !cardData.image_uris) {
      console.log(`🎴 Split card detected: ${cardData.name}, missing image_uris`);
      // For split cards, try to use layout-specific image handling
      if (cardData.layout === 'split' && cardData.id) {
        // Construct image URLs for split cards using Scryfall's image API
        const baseImageUrl = `https://cards.scryfall.io`;
        cardData.image_uris = {
          small: `${baseImageUrl}/small/front/${cardData.id}.jpg`,
          normal: `${baseImageUrl}/normal/front/${cardData.id}.jpg`,
          large: `${baseImageUrl}/large/front/${cardData.id}.jpg`,
          png: `${baseImageUrl}/png/front/${cardData.id}.png`,
          art_crop: `${baseImageUrl}/art_crop/front/${cardData.id}.jpg`,
          border_crop: `${baseImageUrl}/border_crop/front/${cardData.id}.jpg`
        };
        console.log(`📸 Generated image_uris for split card: ${cardData.name}`);
      }
    }
    
    // If this is a double-faced card with card_faces but no image_uris on the main object
    if (cardData.card_faces && cardData.card_faces.length > 0 && !cardData.image_uris) {
      // Use the first face's image_uris as the main image_uris
      const firstFace = cardData.card_faces[0];
      if (firstFace.image_uris) {
        cardData.image_uris = firstFace.image_uris;
        console.log(`📸 Added image_uris from first card face for: ${cardData.name}`);
      }
    }
    
    // For transform cards, ensure we have the front face name as the main name
    if (cardData.card_faces && cardData.card_faces.length >= 2) {
      const frontFace = cardData.card_faces[0];
      if (frontFace.name && frontFace.name !== cardData.name) {
        console.log(`🔄 Transform card detected: ${cardData.name}, front face: ${frontFace.name}`);
        // Keep the original name but ensure we have front face data
        cardData.front_face_name = frontFace.name;
      }
    }
    
    // Final fallback: if we still don't have image_uris and we have an ID, generate them
    if (!cardData.image_uris && cardData.id) {
      const baseImageUrl = `https://cards.scryfall.io`;
      cardData.image_uris = {
        small: `${baseImageUrl}/small/front/${cardData.id}.jpg`,
        normal: `${baseImageUrl}/normal/front/${cardData.id}.jpg`,
        large: `${baseImageUrl}/large/front/${cardData.id}.jpg`,
        png: `${baseImageUrl}/png/front/${cardData.id}.png`,
        art_crop: `${baseImageUrl}/art_crop/front/${cardData.id}.jpg`,
        border_crop: `${baseImageUrl}/border_crop/front/${cardData.id}.jpg`
      };
      console.log(`📸 Generated fallback image_uris for: ${cardData.name}`);
    }
    
    return cardData;
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
    
    // Basic lands are always allowed multiples (check this first, even if oracle_text is missing)
    if (card.type_line && card.type_line.includes('Basic') && card.type_line.includes('Land')) {
      return true;
    }
    
    // Check for the specific text that allows multiple copies
    if (card.oracle_text) {
      const multipleText = card.oracle_text.toLowerCase();
      return multipleText.includes('a deck can have any number of cards named') ||
             multipleText.includes('any number of cards named');
    }
    
    return false;
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
      'Etherium Sculptor': {
        mana_cost: '{1}{U}',
        type_line: 'Artifact Creature — Vedalken Artificer',
        colors: ['U'],
        color_identity: ['U'],
        cmc: 2
      },
      'Sky Sovereign, Consul Flagship': {
        mana_cost: '{5}',
        type_line: 'Legendary Artifact — Vehicle',
        colors: [],
        color_identity: [],
        cmc: 5
      },
      'The Ozolith': {
        mana_cost: '{1}',
        type_line: 'Legendary Artifact',
        colors: [],
        color_identity: [],
        cmc: 1
      },
      'Sejiri Refuge': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['W', 'U'],
        cmc: 0
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
      },
      'Commander\'s Sphere': {
        mana_cost: '{3}',
        type_line: 'Artifact',
        colors: [],
        color_identity: [],
        cmc: 3
      },
      'Thought Vessel': {
        mana_cost: '{2}',
        type_line: 'Artifact',
        colors: [],
        color_identity: [],
        cmc: 2
      },
      'Azorius Guildgate': {
        mana_cost: '',
        type_line: 'Land — Gate',
        colors: [],
        color_identity: ['W', 'U'],
        cmc: 0
      },
      'Tranquil Cove': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['W', 'U'],
        cmc: 0
      },
      'Meandering River': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['W', 'U'],
        cmc: 0
      },
      'Port Town': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['W', 'U'],
        cmc: 0
      },
      'Thriving Isle': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['U'],
        cmc: 0
      },
      'Thriving Heath': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['W'],
        cmc: 0
      },
      
      // Common split/fuse cards
      'Wear // Tear': {
        mana_cost: '{1}{R} // {W}',
        type_line: 'Instant // Instant',
        colors: ['R', 'W'],
        color_identity: ['R', 'W'],
        cmc: 2
      },
      'Fire // Ice': {
        mana_cost: '{1}{R} // {1}{U}',
        type_line: 'Instant // Instant',
        colors: ['R', 'U'],
        color_identity: ['R', 'U'],
        cmc: 2
      },
      'Life // Death': {
        mana_cost: '{G} // {1}{B}',
        type_line: 'Sorcery // Sorcery',
        colors: ['G', 'B'],
        color_identity: ['G', 'B'],
        cmc: 2
      },
      
      // Common transform cards (double-faced cards)
      'Treasure Map': {
        mana_cost: '{2}',
        type_line: 'Artifact',
        colors: [],
        color_identity: [],
        cmc: 2
      },
      'Search for Azcanta': {
        mana_cost: '{1}{U}',
        type_line: 'Legendary Enchantment',
        colors: ['U'],
        color_identity: ['U'],
        cmc: 2
      },
      'Legion\'s Landing': {
        mana_cost: '{W}',
        type_line: 'Legendary Enchantment',
        colors: ['W'],
        color_identity: ['W'],
        cmc: 1
      },
      'Growing Rites of Itlimoc': {
        mana_cost: '{2}{G}',
        type_line: 'Legendary Enchantment',
        colors: ['G'],
        color_identity: ['G'],
        cmc: 3
      },
      'Thaumatic Compass': {
        mana_cost: '{2}',
        type_line: 'Artifact',
        colors: [],
        color_identity: [],
        cmc: 2
      },
      
      // Modal double-faced cards
      'Kazandu Mammoth': {
        mana_cost: '{1}{G}{G}',
        type_line: 'Creature — Elephant',
        colors: ['G'],
        color_identity: ['G'],
        cmc: 3
      },
      'Bala Ged Recovery': {
        mana_cost: '{2}{G}',
        type_line: 'Sorcery',
        colors: ['G'],
        color_identity: ['G'],
        cmc: 3
      },
      'Turntimber Symbiosis': {
        mana_cost: '{4}{G}{G}{G}',
        type_line: 'Sorcery',
        colors: ['G'],
        color_identity: ['G'],
        cmc: 7
      },
      
      // Modal Double-Faced Lands (Zendikar Rising) - Front faces only
      'Hengate Pathway': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['R', 'W'],
        cmc: 0
      },
      'Riverglide Pathway': {
        mana_cost: '',
        type_line: 'Land', 
        colors: [],
        color_identity: ['U', 'B'],
        cmc: 0
      },
      'Brightclimb Pathway': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['W', 'R'], 
        cmc: 0
      },
      'Clearwater Pathway': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['U', 'B'],
        cmc: 0
      },
      'Cragcrown Pathway': {
        mana_cost: '',
        type_line: 'Land',
        colors: [],
        color_identity: ['R', 'G'],
        cmc: 0
      },
      
      // Other problematic modal cards
      'Pelakka Predation': {
        mana_cost: '{2}{B}',
        type_line: 'Sorcery',
        colors: ['B'],
        color_identity: ['B'],
        cmc: 3
      },
      'Tangled Florahedron': {
        mana_cost: '{1}{G}',
        type_line: 'Creature — Elemental',
        colors: ['G'],
        color_identity: ['G'],
        cmc: 2
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
   * @param {Map} cardDataMap - Pre-fetched card data (already filtered for color identity)
   * @param {Array} appliedFixes - Applied fixes for user feedback
   */
  const addCardsFromBatchData = async (cardList, cardDataMap, appliedFixes = []) => {
    let addedCount = 0;
    const missingCards = [];
    const colorViolationCards = [];
    const addedCards = new Set();

    console.log(`Starting to add ${cardList.length} cards to deck`);
    console.log(`Available card data for ${cardDataMap.size} cards after color identity filtering`);

    // First pass: Add all valid cards
    for (const card of cardList) {
      if (addedCount >= 99) break; // Stop if we've reached 99 cards
      
      const cardData = cardDataMap.get(card.name);
      if (cardData) {
        // Skip if we already added this card (singleton rule) unless it can have multiples
        if (addedCards.has(card.name) && !canHaveMultipleCopies(cardData)) {
          console.warn(`Skipping duplicate ${card.name} due to singleton rule`);
          missingCards.push(card);
          continue;
        }

        // Add category from original card list if not present
        const cardToAdd = {
          ...cardData,
          category: card.category || cardData.category || 'Other'
        };

        addCard(cardToAdd);
        addedCards.add(card.name);
        addedCount++;
        
        if (addedCount % 10 === 0) {
          console.log(`Added ${addedCount} cards so far...`);
        }
      } else {
        // Check if card exists in original fetched data but was filtered out
        const originalCardData = [...cardDataMap.entries()].find(([key, value]) => 
          key === card.name || key === card.originalName || value.name === card.name
        );
        
        if (originalCardData) {
          console.warn(`Card filtered out: ${card.name} (color identity violation - has [${originalCardData[1].color_identity?.join(', ')}], commander allows [${commander.color_identity?.join(', ')}])`);
          colorViolationCards.push(card);
        } else {
          console.warn(`Card not found: ${card.name} (not returned by Scryfall API - may be misspelled, not legal in Commander, or from unsupported set)`);
        }
        
        missingCards.push(card);
      }
    }

    console.log(`First pass complete: Added ${addedCount} cards`);
    console.log(`Missing cards: ${missingCards.length} (${colorViolationCards.length} likely color violations)`);

    // If we don't have enough cards, try to add basic lands and staples
    if (addedCount < 99) {
      const remainingCount = 99 - addedCount;
      console.log(`Only added ${addedCount} cards, need ${remainingCount} more cards to complete deck`);
      
      // First try basic lands
      const basicLandsNeeded = Math.min(remainingCount, Math.max(0, 36 - getCurrentBasicLandCount()));
      if (basicLandsNeeded > 0) {
        console.log(`Adding ${basicLandsNeeded} basic lands...`);
        const basicLands = await fetchBasicLands(commander.color_identity || [], basicLandsNeeded);
        
        for (const land of basicLands) {
          if (addedCount >= 99) break;
          
          if (land) {
            addCard(land);
            addedCount++;
          }
        }
        
        console.log(`After adding basic lands: ${addedCount} total cards`);
      }
      
      // Then try colorless staples that should be safe
      if (addedCount < 99) {
        const colorlessStaples = [
          'Sol Ring', 'Command Tower', 'Arcane Signet', 'Commander\'s Sphere', 
          'Thought Vessel', 'Mind Stone', 'Worn Powerstone', 'Hedron Archive',
          'Reliquary Tower', 'Rogue\'s Passage'
        ];
        
        console.log(`Adding colorless staples to reach 99 cards...`);
        for (const stapleName of colorlessStaples) {
          if (addedCount >= 99) break;
          if (addedCards.has(stapleName)) continue;
          
          const stapleCard = createFallbackCard(stapleName, 'Ramp');
          if (stapleCard) {
            addCard(stapleCard);
            addedCards.add(stapleName);
            addedCount++;
            console.log(`Added staple: ${stapleName}`);
          }
        }
      }
    }

    // Final check and logging
    const finalCount = getCurrentNonCommanderCardCount();
    console.log(`Deck building complete: ${finalCount} cards in deck (target: 99)`);
    
    if (finalCount < 99) {
      console.warn(`Warning: Deck only has ${finalCount} cards instead of 99`);
    } else if (finalCount === 99) {
      console.log(`✅ Successfully built complete 99-card deck`);
    }
    
    if (colorViolationCards.length > 0) {
      console.log(`📋 Cards filtered due to color identity violations: ${colorViolationCards.length}`);
      console.log(`   This is expected and prevents invalid cards from reaching the user.`);
    }
    
    if (missingCards.length > 0) {
      console.warn(`Cards that could not be added:`, missingCards.map(c => c.name));
    }
  };

  /**
   * Get current count of basic lands in deck
   * @returns {number} Number of basic lands currently in deck
   */
  const getCurrentBasicLandCount = () => {
    const basicLandNames = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'];
    return deckContext.cards.filter(card => 
      basicLandNames.some(basicName => card.name === basicName)
    ).reduce((sum, card) => sum + (card.quantity || 1), 0);
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
   * @param {number} maxCardPrice - Maximum allowed price per card
   * @returns {Object} - Validation result and any violations
   */
  const validateBudgetConstraints = (cardList, maxBudget, maxCardPrice = null) => {
    if (maxBudget === Infinity) return { valid: true, violations: [] };

    const totalCost = calculateDeckCost(cardList);
    const violations = [];

    if (totalCost > maxBudget) {
      violations.push({
        type: 'budget_exceeded',
        message: `Deck cost ($${totalCost.toFixed(2)}) exceeds budget limit of $${maxBudget.toFixed(2)}`,
        excess: totalCost - maxBudget,
        severity: 'high'
      });
    }

    // Check individual card prices if maxCardPrice is specified
    if (maxCardPrice) {
      const overPricedCards = cardList
        .filter(card => parseFloat(card.prices?.usd || 0) > maxCardPrice)
        .map(card => ({
          name: card.name,
          price: parseFloat(card.prices?.usd || 0),
          excess: parseFloat(card.prices?.usd || 0) - maxCardPrice
        }));

      if (overPricedCards.length > 0) {
        violations.push({
          type: 'card_price_exceeded',
          message: `${overPricedCards.length} cards exceed the maximum price of $${maxCardPrice.toFixed(2)}`,
          cards: overPricedCards,
          severity: 'medium'
        });
      }
    }

    // Find expensive cards that could be replaced (more than 15% of budget)
    const expensiveCards = cardList
      .filter(card => parseFloat(card.prices?.usd || 0) > maxBudget * 0.15)
      .map(card => ({
        name: card.name,
        price: parseFloat(card.prices?.usd || 0)
      }));

    if (expensiveCards.length > 0) {
      violations.push({
        type: 'expensive_cards',
        message: 'Found expensive cards that could be replaced with budget alternatives',
        cards: expensiveCards,
        severity: 'low'
      });
    }

    // Budget utilization feedback
    const utilizationPercent = (totalCost / maxBudget) * 100;
    let budgetFeedback = '';
    
    if (utilizationPercent < 70) {
      budgetFeedback = `Budget utilization: ${utilizationPercent.toFixed(1)}% - Consider adding more powerful cards within budget`;
    } else if (utilizationPercent > 90 && utilizationPercent <= 100) {
      budgetFeedback = `Budget utilization: ${utilizationPercent.toFixed(1)}% - Excellent budget optimization`;
    } else if (utilizationPercent > 100) {
      budgetFeedback = `Budget exceeded by ${(utilizationPercent - 100).toFixed(1)}%`;
    }

    return {
      valid: violations.filter(v => v.severity === 'high').length === 0,
      violations,
      totalCost,
      budgetUtilization: utilizationPercent,
      budgetFeedback
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
    const basicLandNames = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'];
    
    // Budget-friendly replacement options
    const duplicateReplacements = [
      // Mana rocks under $1
      'Mind Stone', 'Star Compass', 'Fellwar Stone',
      'Guardian Idol', 'Prismatic Lens', 'Ornithopter of Paradise',
      'Wayfarer\'s Bauble', 'Manakin', 'Millikin',
      
      // Budget lands under $1
      'Evolving Wilds', 'Terramorphic Expanse', 'Path of Ancestry',
      'Myriad Landscape', 'Unknown Shores', 'Shimmering Grotto',
      'Gateway Plaza', 'Rupture Spire', 'Transguild Promenade',
      
      // Budget utility under $1
      'Rogue\'s Passage', 'Reliquary Tower', 'Command Tower',
      'Exotic Orchard', 'Ash Barrens', 'Emergence Zone'
    ];
    let replacementIndex = 0;

    // Track basic land counts separately
    const basicLandCounts = new Map();

    for (const card of cardList) {
      const cardName = card.name;
      
      // Check if this card can have multiple copies (like Cid, Timeless Artificer)
      const canHaveMultiples = canHaveMultipleCopies(card) || basicLandNames.includes(cardName);
      
      if (canHaveMultiples) {
        // Basic lands and cards with "any number" text can have multiples
        if (basicLandNames.includes(cardName)) {
          const currentCount = basicLandCounts.get(cardName) || 0;
          
          // Allow up to 10 of each basic land type (reasonable for Commander)
          if (currentCount < 10) {
            validatedCards.push(card);
            basicLandCounts.set(cardName, currentCount + 1);
          } else {
            console.warn(`Too many ${cardName} (${currentCount + 1}), replacing with different basic land`);
            // Find a different basic land that fits the commander's color identity
            const alternativeBasicLand = findAlternativeBasicLand(cardName, commander.color_identity, basicLandCounts);
            if (alternativeBasicLand) {
              const altCard = {
                ...card,
                name: alternativeBasicLand,
                singleton_replacement: true,
                original_duplicate: cardName
              };
              validatedCards.push(altCard);
              basicLandCounts.set(alternativeBasicLand, (basicLandCounts.get(alternativeBasicLand) || 0) + 1);
            }
          }
        } else {
          // Cards like Cid, Timeless Artificer can have unlimited copies
          validatedCards.push(card);
        }
        continue;
      }
      
      // Check if we've seen this non-basic, non-multiple card before
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
          const replacementCard = {
            name: replacementName,
            category: card.category || 'Utility',
            singleton_replacement: true,
            original_duplicate: cardName
          };
          validatedCards.push(replacementCard);
          cardCounts.set(replacementName, 1);
        } else {
          // If we run out of replacements, add a basic land of the commander's color
          const basicLandName = getBasicLandForCommander(commander.color_identity);
          if (basicLandName) {
            validatedCards.push({
              name: basicLandName,
              category: 'Lands',
              singleton_replacement: true,
              original_duplicate: cardName
            });
            basicLandCounts.set(basicLandName, (basicLandCounts.get(basicLandName) || 0) + 1);
          } else {
            console.warn(`No more unique replacements available, skipping duplicate ${cardName}`);
          }
        }
      } else {
        // First occurrence of this non-basic card
        validatedCards.push(card);
        cardCounts.set(cardName, 1);
      }
    }
    
    return validatedCards;
  };

  /**
   * Find an alternative basic land when one type has too many copies
   * @param {string} originalLand - The basic land that has too many copies
   * @param {Array} colorIdentity - Commander's color identity
   * @param {Map} basicLandCounts - Current counts of basic lands
   * @returns {string|null} Alternative basic land name
   */
  const findAlternativeBasicLand = (originalLand, colorIdentity, basicLandCounts) => {
    const landToColor = {
      'Plains': 'W',
      'Island': 'U', 
      'Swamp': 'B',
      'Mountain': 'R',
      'Forest': 'G'
    };

    // Find basic lands that fit the color identity and have fewer copies
    const availableLands = Object.entries(landToColor)
      .filter(([landName, color]) => 
        colorIdentity.includes(color) && 
        landName !== originalLand &&
        (basicLandCounts.get(landName) || 0) < 10
      )
      .sort((a, b) => (basicLandCounts.get(a[0]) || 0) - (basicLandCounts.get(b[0]) || 0));

    return availableLands.length > 0 ? availableLands[0][0] : null;
  };

  /**
   * Get a basic land that fits the commander's color identity
   * @param {Array} colorIdentity - Commander's color identity
   * @returns {string|null} Basic land name
   */
  const getBasicLandForCommander = (colorIdentity) => {
    const landToColor = {
      'Plains': 'W',
      'Island': 'U',
      'Swamp': 'B', 
      'Mountain': 'R',
      'Forest': 'G'
    };

    // Find the first basic land that fits the color identity
    for (const [landName, color] of Object.entries(landToColor)) {
      if (colorIdentity.includes(color)) {
        return landName;
      }
    }

    // If no colors match (colorless commander), default to Plains
    return 'Plains';
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

    const { distribution, maxBudget, powerLevel, prioritizeEfficiency } = archetypeRules;
    
    const budgetConstraint = maxBudget ? 
      `Keep the total deck cost under $${maxBudget}. Individual cards should not exceed $${archetypeRules.maxCardPrice || Math.floor(maxBudget * 0.1)} each. ${maxBudget <= 50 ? 'Prioritize commons and uncommons with high value.' : maxBudget <= 100 ? 'Focus on budget staples and efficient cards.' : maxBudget <= 200 ? 'Include mid-range staples while staying budget-conscious.' : 'Use premium cards but maintain cost awareness.'}` : '';

    const powerLevelGuide = {
      'high': '4-5 (Highly optimized to cEDH)',
      'medium': '2-3 (Focused to Optimized)',
      'low': '1-2 (Casual to Focused)'
    };

    const powerLevelConstraint = `Target power level should be in bracket ${powerLevelGuide[powerLevel] || powerLevelGuide['medium']}.`;

    const distributionRequirements = Object.entries(distribution)
      .map(([category, { min, max }]) => `${category}: ${min}-${max} cards`)
      .join(', ');

    const efficiencyNote = prioritizeEfficiency ? 
      'Prioritize efficient, low-cost spells and powerful staples.' : 
      'Focus on synergy and theme over raw efficiency.';

    const prompt = `You are an expert Magic: The Gathering deck builder specialized in Commander format.

Build a complete 99-card Commander deck optimized for SPEED and broad synergy:

Commander: ${commander.name}
Color Identity: ${commander.color_identity?.join('') || 'Colorless'}
Commander Type: ${commander.type_line}
Commander Text: ${commander.oracle_text || 'No text available'}
Deck Style: ${deckStyle}

CRITICAL COLOR IDENTITY RULES:
- ONLY include cards that match the commander's color identity: ${commander.color_identity?.join(', ') || 'Colorless'}
- A card's color identity includes ALL mana symbols in its mana cost AND rules text
- Examples of FORBIDDEN cards for this commander:
  ${commander.color_identity?.includes('B') ? '' : '- NO Black cards (like Thoughtseize, Doom Blade, Demonic Tutor)'}
  ${commander.color_identity?.includes('R') ? '' : '- NO Red cards (like Lightning Bolt, Shock, Goblin Guide)'}
  ${commander.color_identity?.includes('G') ? '' : '- NO Green cards (like Llanowar Elves, Rampant Growth, Giant Growth)'}
  ${commander.color_identity?.includes('U') ? '' : '- NO Blue cards (like Counterspell, Brainstorm, Ponder)'}
  ${commander.color_identity?.includes('W') ? '' : '- NO White cards (like Swords to Plowshares, Wrath of God, Serra Angel)'}
- AVOID multi-colored cards that contain colors outside the commander's identity
- AVOID artifacts with colored mana symbols in their rules text

SPEED PRIORITY: Generate functional deck quickly. Focus on:
- Strong synergies with commander abilities
- Proper mana base foundation${deckStyle === 'budget' && maxBudget <= 100 ? ' (emphasize basic lands and budget duals)' : ''}
- Essential staples for the archetype
- ${distributionRequirements}
- ${powerLevelConstraint}
- ${budgetConstraint}
- ${efficiencyNote}

${deckStyle === 'budget' ? `
BUDGET-SPECIFIC GUIDELINES:
- Prefer artifact ramp like Sol Ring, Arcane Signet, Commander's Sphere, Mind Stone
- Include budget card draw like Divination, Sign in Blood, Read the Bones
- Use efficient removal like Swords to Plowshares, Path to Exile, Murder, Destroy Evil
- Avoid expensive cards like fetch lands, dual lands, tutors, and premium artifacts
- Focus on synergy over raw power level
- Consider budget alternatives: Command Tower over expensive duals, basic lands over shocklands
${maxBudget <= 50 ? '- Ultra-budget focus: prioritize cards under $1, use mostly basics for mana base' : ''}
${maxBudget <= 100 ? '- Budget-friendly: mix of budget staples and efficient cards under $5' : ''}
${maxBudget > 100 ? '- Higher budget: can include some mid-range staples and better manabase' : ''}
` : ''}

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

Categories must be one of: "Lands", "Ramp", "Draw", "Removal", "Protection", "Core"

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
      
      // Debug: Log the full response structure from o3
      console.log('🔍 OpenAI o3 API Response Debug:', {
        status: response.status,
        statusText: response.statusText,
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoice: data.choices?.[0],
        hasMessage: !!data.choices?.[0]?.message,
        hasContent: !!data.choices?.[0]?.message?.content,
        usage: data.usage,
        error: data.error,
        fullResponseKeys: Object.keys(data),
        fullData: data
      });

      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        console.error('❌ No response content from OpenAI o3. Full response:', data);
        throw new Error(`No response received from OpenAI o3. API returned: ${JSON.stringify(data, null, 2)}`);
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

  /**
   * Validate color identity using actual Scryfall card data
   * @param {Object} cardData - Card data from Scryfall
   * @param {Array} commanderColorIdentity - Commander's color identity
   * @returns {Object} Validation result
   */
  const validateColorIdentityFromScryfall = (cardData, commanderColorIdentity) => {
    if (!cardData || !Array.isArray(commanderColorIdentity)) {
      return { isValid: false, reason: 'Invalid input parameters' };
    }

    // Use actual Scryfall color_identity field
    if (cardData.color_identity && Array.isArray(cardData.color_identity)) {
      const cardColors = cardData.color_identity;
      const hasInvalidColors = cardColors.some(color => !commanderColorIdentity.includes(color));
      
      if (hasInvalidColors) {
        return {
          isValid: false,
          reason: `${cardData.name} has color identity [${cardColors.join(', ')}] which is not allowed in commander identity [${commanderColorIdentity.join(', ')}]`,
          cardColorIdentity: cardColors,
          commanderColorIdentity,
          violatingColors: cardColors.filter(color => !commanderColorIdentity.includes(color))
        };
      }
    }

    return { isValid: true, reason: 'Color identity compliant' };
  };

  /**
   * Filter out cards with color identity violations using Scryfall data
   * @param {Map} cardDataMap - Map of card names to Scryfall data
   * @param {Array} commanderColorIdentity - Commander's color identity
   * @returns {Map} Filtered card data map with only valid cards
   */
  const filterColorIdentityViolations = (cardDataMap, commanderColorIdentity) => {
    const validCards = new Map();
    const violations = [];

    for (const [cardName, cardData] of cardDataMap.entries()) {
      const validation = validateColorIdentityFromScryfall(cardData, commanderColorIdentity);
      
      if (validation.isValid) {
        validCards.set(cardName, cardData);
      } else {
        violations.push({
          cardName,
          reason: validation.reason,
          cardColorIdentity: validation.cardColorIdentity,
          violatingColors: validation.violatingColors
        });
        console.warn(`Filtered out color identity violation: ${validation.reason}`);
      }
    }

    if (violations.length > 0) {
      console.log(`Filtered out ${violations.length} color identity violations:`, violations);
    }

    return { validCards, violations };
  };

  return {
    buildCompleteDeck,
    isLoading,
    error,
    progress,
    paywallBlocked,
    clearPaywallBlocked,

    // Progressive UI state
    buildingStage,
    currentCards,
    currentViolations,
    appliedFixes,
    // Track automatically filtered color identity violations
    filteredColorViolations
  };
}; 