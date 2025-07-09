/**
 * Smart Card Replacement Service
 * Uses o3-2025-04-16 model for intelligent card replacement suggestions
 * Now integrates with centralized Commander legality service
 */

import { getOpenAIApiKey } from '../utils/openaiAPI.js';
import commanderLegalityService from './commanderLegalityService.js';

const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate smart replacement suggestions for problematic cards
 * @param {Array} problematicCards - List of cards that need replacement
 * @param {Object} commander - Commander card object
 * @param {Array} currentDeck - Current deck list for context
 * @returns {Object} Replacement suggestions with reasoning
 */
export const generateSmartReplacements = async (problematicCards, commander, currentDeck) => {
  // Use centralized service to get known good replacements for banned cards
  const quickReplacements = [];
  const needsAIHelp = [];
  
  problematicCards.forEach(card => {
    if (commanderLegalityService.isCardBanned(card.name)) {
      // Get quick replacements from centralized service
      const replacements = commanderLegalityService.getBannedCardReplacements(card.name);
      quickReplacements.push({
        original: card,
        replacements: replacements.map(name => ({ name, reason: 'Pre-validated replacement for banned card' }))
      });
    } else {
      // Needs AI analysis for complex replacements
      needsAIHelp.push(card);
    }
  });
  
  // If all cards have quick replacements, return those
  if (needsAIHelp.length === 0) {
    console.log('All replacements handled by centralized service');
    return formatQuickReplacements(quickReplacements, commander);
  }

  const prompt = `REPLACEMENT EXPERT TASK: Generate intelligent replacement suggestions for problematic cards.

Commander: ${commander.name}
Color Identity: [${commander.color_identity?.join(', ') || 'Colorless'}]
Commander Strategy: ${getCommanderStrategy(commander)}

Current Deck Context (${currentDeck.length} cards):
${JSON.stringify(currentDeck.map(card => ({ 
  name: card.name, 
  category: card.category,
  cmc: card.cmc 
})).slice(0, 30), null, 2)}${currentDeck.length > 30 ? '\n... (truncated for brevity)' : ''}

Cards Needing Replacement:
${JSON.stringify(needsAIHelp.map(card => ({
  name: card.name,
  category: card.category,
  cmc: card.cmc,
  reason: card.violation_reason || 'Unknown issue'
})), null, 2)}

REPLACEMENT CRITERIA:
1. Must be legal in Commander format (check 2025 banned list)
2. Must fit commander's color identity
3. Should maintain similar function/synergy
4. Consider mana curve balance
5. Prioritize cards that enhance commander strategy

BANNED CARDS TO AVOID:
- Black Lotus, Mox artifacts, Time Walk, Ancestral Recall
- Mana Crypt, Dockside Extortionist, Jeweled Lotus, Nadu Winged Wisdom
- Any card banned in Commander format

RECENTLY UNBANNED (April 2025) - These are now LEGAL:
- Gifts Ungiven, Sway of the Stars, Braids Cabal Minion, Coalition Victory, Panoptic Mirror

RESPONSE FORMAT (JSON only):
{
  "replacements": [
    {
      "original_card": "Problematic Card Name",
      "suggested_cards": [
        {
          "name": "Replacement Card Name",
          "reason": "Why this replacement fits (synergy, function, strategy)",
          "synergy_score": 9,
          "category": "Same or similar category",
          "cmc": 3
        }
      ],
      "replacement_reasoning": "Overall strategy for replacing this card"
    }
  ],
  "deck_analysis": {
    "mana_curve_impact": "How replacements affect the curve",
    "strategy_coherence": "How well replacements support commander strategy",
    "power_level": "Expected power level after replacements"
  }
}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getOpenAIApiKey()}`
      },
      body: JSON.stringify({
        model: 'o3-2025-04-16', // Advanced reasoning model for strategic replacements
        messages: [
          { 
            role: 'system', 
            content: 'You are a Magic: The Gathering deck building expert specializing in Commander format. You have deep knowledge of card synergies, mana curves, and strategic deck construction. Use the April 2025 updated banned list. Return only valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2500
        // Note: o3 model uses default temperature (1) - no temperature parameter needed
      })
    });

    if (!response.ok) {
      console.warn('AI replacement generation failed, using centralized fallback');
      return generateFallbackReplacements(problematicCards, commander, currentDeck);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn('Empty AI replacement response, using fallback');
      return generateFallbackReplacements(problematicCards, commander, currentDeck);
    }

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const aiReplacements = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!aiReplacements.replacements || !Array.isArray(aiReplacements.replacements)) {
        throw new Error('Invalid replacement result structure');
      }
      
      // Validate all suggested replacements using centralized service
      const validatedReplacements = await validateAIReplacements(aiReplacements, commander);
      
      // Combine with quick replacements
      const combinedResult = combineReplacements(quickReplacements, validatedReplacements, commander);
      
      console.log(`Smart replacements generated for ${problematicCards.length} cards`);
      return combinedResult;
      
    } catch (parseError) {
      console.error('Failed to parse AI replacement response:', parseError);
      return generateFallbackReplacements(problematicCards, commander, currentDeck);
    }
    
  } catch (error) {
    console.error('Smart replacement service error:', error);
    return generateFallbackReplacements(problematicCards, commander, currentDeck);
  }
};

/**
 * Format quick replacements from centralized service
 * @param {Array} quickReplacements - Pre-validated replacements
 * @param {Object} commander - Commander card object
 * @returns {Object} Formatted replacement result
 */
const formatQuickReplacements = (quickReplacements, commander) => {
  const replacements = quickReplacements.map(replacement => ({
    original_card: replacement.original.name,
    suggested_cards: replacement.replacements.map(rep => ({
      name: rep.name,
      reason: rep.reason,
      synergy_score: 8, // Good default for pre-validated cards
      category: replacement.original.category || 'Utility',
      cmc: replacement.original.cmc || 2
    })),
    replacement_reasoning: `Replacing banned card with format-legal alternative`
  }));

  return {
    replacements,
    deck_analysis: {
      mana_curve_impact: 'Minimal impact - replacements chosen for similar costs',
      strategy_coherence: 'Maintained - replacements support similar strategies',
      power_level: 'Adjusted to legal power level for format'
    },
    source: 'centralized_service'
  };
};

/**
 * Validate AI-generated replacements using centralized service
 * @param {Object} aiReplacements - AI-generated replacement suggestions
 * @param {Object} commander - Commander card object
 * @returns {Object} Validated replacement suggestions
 */
const validateAIReplacements = async (aiReplacements, commander) => {
  const validatedReplacements = [];
  
  for (const replacement of aiReplacements.replacements) {
    const validatedSuggestions = [];
    
    for (const suggestion of replacement.suggested_cards) {
      try {
        // Check if the suggested card is legal using centralized service
        if (commanderLegalityService.isCardBanned(suggestion.name)) {
          console.warn(`AI suggested banned card: ${suggestion.name}, skipping`);
          continue;
        }
        
        // Try to fetch card data to validate color identity
        const cardData = await fetchCardFromScryfall(suggestion.name);
        if (cardData) {
          const validation = commanderLegalityService.validateCard(cardData, commander);
          
          if (validation.isValid) {
            validatedSuggestions.push({
              ...suggestion,
              validated: true,
              scryfall_data: cardData
            });
          } else {
            console.warn(`AI suggested invalid card: ${suggestion.name} - ${validation.violations[0]?.message}`);
          }
        }
        
      } catch (error) {
        console.warn(`Failed to validate AI suggestion ${suggestion.name}:`, error);
      }
    }
    
    // If no valid suggestions, add fallback from centralized service
    if (validatedSuggestions.length === 0) {
      const fallbacks = commanderLegalityService.getBannedCardReplacements(replacement.original_card);
      for (const fallback of fallbacks.slice(0, 2)) {
        try {
          const cardData = await fetchCardFromScryfall(fallback);
          if (cardData) {
            validatedSuggestions.push({
              name: fallback,
              reason: 'Fallback replacement from centralized service',
              synergy_score: 7,
              category: 'Utility',
              cmc: cardData.cmc || 2,
              validated: true,
              scryfall_data: cardData
            });
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    if (validatedSuggestions.length > 0) {
      validatedReplacements.push({
        ...replacement,
        suggested_cards: validatedSuggestions
      });
    }
  }
  
  return {
    ...aiReplacements,
    replacements: validatedReplacements
  };
};

/**
 * Combine quick replacements with AI replacements
 * @param {Array} quickReplacements - Pre-validated replacements
 * @param {Object} aiReplacements - AI-generated replacements
 * @param {Object} commander - Commander card object
 * @returns {Object} Combined replacement result
 */
const combineReplacements = (quickReplacements, aiReplacements, commander) => {
  const allReplacements = [
    ...formatQuickReplacements(quickReplacements, commander).replacements,
    ...aiReplacements.replacements
  ];
  
  return {
    replacements: allReplacements,
    deck_analysis: aiReplacements.deck_analysis || {
      mana_curve_impact: 'Analyzed for optimal curve balance',
      strategy_coherence: 'Replacements chosen to support commander strategy',
      power_level: 'Balanced for competitive casual play'
    },
    source: 'combined_ai_and_centralized'
  };
};

/**
 * Generate fallback replacements when AI fails
 * @param {Array} problematicCards - Cards needing replacement
 * @param {Object} commander - Commander card object
 * @param {Array} currentDeck - Current deck for context
 * @returns {Object} Fallback replacement suggestions
 */
const generateFallbackReplacements = async (problematicCards, commander, currentDeck) => {
  const replacements = [];
  const usedSuggestions = new Set(); // Track used suggestions to avoid duplicates
  
  // Collect existing card names in deck
  const existingCards = new Set(currentDeck.map(card => card.name));
  
  for (const card of problematicCards) {
    const suggestions = [];
    
    // Try centralized service first
    if (commanderLegalityService.isCardBanned(card.name)) {
      const bannedReplacements = commanderLegalityService.getBannedCardReplacements(card.name);
      for (const replacement of bannedReplacements) {
        // Only add if not already used and not in existing deck
        if (!usedSuggestions.has(replacement) && !existingCards.has(replacement)) {
          suggestions.push({
            name: replacement,
            reason: 'Format-legal replacement for banned card',
            synergy_score: 7,
            category: card.category || 'Utility',
            cmc: card.cmc || 2
          });
          usedSuggestions.add(replacement);
          
          if (suggestions.length >= 3) break; // Limit to 3 suggestions per card
        }
      }
    } else {
      // Category-based fallback
      const categoryReplacements = getCategoryFallbacks(card.category, commander.color_identity);
      for (const replacement of categoryReplacements) {
        // Only add if not already used and not in existing deck
        if (!usedSuggestions.has(replacement) && !existingCards.has(replacement)) {
          suggestions.push({
            name: replacement,
            reason: `Category-appropriate replacement for ${card.category || 'utility'}`,
            synergy_score: 6,
            category: card.category || 'Utility',
            cmc: card.cmc || 2
          });
          usedSuggestions.add(replacement);
          
          if (suggestions.length >= 3) break; // Limit to 3 suggestions per card
        }
      }
    }
    
    // If no unique suggestions found, generate alternatives
    if (suggestions.length === 0) {
      const alternativeSuggestion = generateUniqueFallback(card, usedSuggestions, existingCards);
      if (alternativeSuggestion) {
        suggestions.push(alternativeSuggestion);
        usedSuggestions.add(alternativeSuggestion.name);
      }
    }
    
    if (suggestions.length > 0) {
      replacements.push({
        original_card: card.name,
        suggested_cards: suggestions,
        replacement_reasoning: 'Fallback replacement using category-based logic with singleton validation'
      });
    }
  }
  
  return {
    replacements,
    deck_analysis: {
      mana_curve_impact: 'Replacements chosen for similar mana costs',
      strategy_coherence: 'Basic synergy maintained through category matching',
      power_level: 'Conservative replacements for format legality'
    },
    source: 'fallback_centralized'
  };
};

/**
 * Generate a unique fallback replacement when standard options are exhausted
 * @param {Object} originalCard - Original card being replaced
 * @param {Set} usedSuggestions - Already used suggestion names
 * @param {Set} existingCards - Cards already in deck
 * @returns {Object|null} Unique fallback suggestion
 */
const generateUniqueFallback = (originalCard, usedSuggestions, existingCards) => {
  // Extended unique fallback options
  const uniqueFallbacks = [
    'Thought Vessel', 'Pristine Talisman', 'Opaline Unicorn', 'Pyramid of the Pantheon',
    'Rupture Spire', 'Transguild Promenade', 'Gateway Plaza', 'Ash Barrens',
    'Meteor Golem', 'Duplicant', 'Steel Hellkite', 'Burnished Hart',
    'Solemn Simulacrum', 'Pilgrim\'s Eye', 'Treasure Hunter', 'Scrap Trawler'
  ];
  
  for (const fallback of uniqueFallbacks) {
    if (!usedSuggestions.has(fallback) && !existingCards.has(fallback)) {
      return {
        name: fallback,
        reason: `Unique fallback replacement for ${originalCard.name}`,
        synergy_score: 5,
        category: originalCard.category || 'Utility',
        cmc: originalCard.cmc || 3
      };
    }
  }
  
  return null;
};

/**
 * Get category-based fallback replacements
 * @param {string} category - Card category
 * @param {Array} colorIdentity - Commander's color identity
 * @returns {Array} List of replacement card names
 */
const getCategoryFallbacks = (category, colorIdentity) => {
  const categoryMap = {
    'Lands': ['Command Tower', 'Evolving Wilds', 'Terramorphic Expanse', 'Myriad Landscape'],
    'Ramp': ['Sol Ring', 'Arcane Signet', 'Commander\'s Sphere', 'Mind Stone'],
    'Card Draw': ['Rhystic Study', 'Phyrexian Arena', 'Divination', 'Sign in Blood'],
    'Removal': ['Swords to Plowshares', 'Path to Exile', 'Beast Within', 'Generous Gift'],
    'Protection': ['Swiftfoot Boots', 'Lightning Greaves', 'Heroic Intervention', 'Teferi\'s Protection'],
    'Creatures': ['Solemn Simulacrum', 'Eternal Witness', 'Reclamation Sage', 'Wood Elves'],
    'Utility': ['Sol Ring', 'Command Tower', 'Arcane Signet', 'Commander\'s Sphere']
  };
  
  const baseReplacements = categoryMap[category] || categoryMap['Utility'];
  
  // Filter by color identity if needed
  // For now, return base replacements - could be enhanced with color filtering
  return baseReplacements;
};

/**
 * Determine commander strategy based on card data
 * @param {Object} commander - Commander card object
 * @returns {string} Strategy description
 */
const getCommanderStrategy = (commander) => {
  const name = commander.name?.toLowerCase() || '';
  const oracle = commander.oracle_text?.toLowerCase() || '';
  const types = commander.type_line?.toLowerCase() || '';
  
  // Basic strategy detection
  if (oracle.includes('counter') || oracle.includes('+1/+1')) {
    return 'Counters and +1/+1 synergy';
  } else if (oracle.includes('graveyard') || oracle.includes('exile')) {
    return 'Graveyard value and recursion';
  } else if (oracle.includes('token') || oracle.includes('create')) {
    return 'Token generation and go-wide';
  } else if (oracle.includes('artifact') || name.includes('artifact')) {
    return 'Artifact synergy and value';
  } else if (types.includes('voltron') || oracle.includes('equipment')) {
    return 'Voltron and equipment';
  } else if (oracle.includes('spells') || oracle.includes('instant')) {
    return 'Spellslinger and instant/sorcery value';
  }
  
  return 'Midrange value and synergy';
};

/**
 * Fetch card data from Scryfall API
 * @param {string} cardName - Name of the card to fetch
 * @returns {Object|null} Card data from Scryfall or null if not found
 */
const fetchCardFromScryfall = async (cardName) => {
  try {
    const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching card ${cardName}:`, error);
    return null;
  }
};

/**
 * Apply smart replacements to a deck
 * @param {Array} deck - Current deck list
 * @param {Object} replacementResult - Result from generateSmartReplacements
 * @returns {Array} Updated deck with replacements applied
 */
export const applySmartReplacements = (deck, replacementResult) => {
  let updatedDeck = [...deck];
  const appliedReplacements = [];
  const usedReplacements = new Set(); // Track used replacement cards to prevent duplicates
  
  // First pass: collect all card names currently in the deck (excluding cards being replaced)
  const originalCardNames = new Set();
  const cardsBeingReplaced = new Set(replacementResult.replacements.map(r => r.original_card));
  
  updatedDeck.forEach(card => {
    if (!cardsBeingReplaced.has(card.name)) {
      originalCardNames.add(card.name);
    }
  });
  
  replacementResult.replacements.forEach(replacement => {
    const cardIndex = updatedDeck.findIndex(card => card.name === replacement.original_card);
    
    if (cardIndex !== -1 && replacement.suggested_cards.length > 0) {
      // Find the first suggestion that isn't already used
      let bestReplacement = null;
      
      for (const suggestion of replacement.suggested_cards) {
        const cardName = suggestion.name;
        
        // Check if this replacement is already used or exists in deck
        if (!usedReplacements.has(cardName) && !originalCardNames.has(cardName)) {
          bestReplacement = suggestion;
          break;
        }
      }
      
      // If no unique replacement found, try to find alternatives
      if (!bestReplacement) {
        console.warn(`All suggested replacements for ${replacement.original_card} are already in deck, finding alternative`);
        bestReplacement = findAlternativeReplacement(replacement.original_card, usedReplacements, originalCardNames);
      }
      
      if (bestReplacement) {
        // Use Scryfall data if available, otherwise create basic card object
        const newCard = bestReplacement.scryfall_data || {
          name: bestReplacement.name,
          cmc: bestReplacement.cmc,
          type_line: 'Unknown',
          category: bestReplacement.category,
          color_identity: [],
          legalities: { commander: 'legal' }
        };
        
        // Preserve category from original card
        newCard.category = updatedDeck[cardIndex].category;
        newCard.replacement_info = {
          original: replacement.original_card,
          reason: bestReplacement.reason,
          synergy_score: bestReplacement.synergy_score
        };
        
        updatedDeck[cardIndex] = newCard;
        usedReplacements.add(bestReplacement.name);
        originalCardNames.add(bestReplacement.name);
        
        appliedReplacements.push({
          original: replacement.original_card,
          replacement: bestReplacement.name,
          reason: bestReplacement.reason
        });
      } else {
        console.error(`No valid replacement found for ${replacement.original_card}`);
      }
    }
  });
  
  console.log(`Applied ${appliedReplacements.length} smart replacements with singleton validation`);
  return updatedDeck;
};

/**
 * Find an alternative replacement when primary suggestions are already used
 * @param {string} originalCard - Original card being replaced
 * @param {Set} usedReplacements - Set of already used replacement names
 * @param {Set} originalCardNames - Set of card names already in deck
 * @returns {Object|null} Alternative replacement suggestion
 */
const findAlternativeReplacement = (originalCard, usedReplacements, originalCardNames) => {
  // Extended fallback list with more variety
  const extendedFallbacks = [
    'Sol Ring', 'Arcane Signet', 'Commander\'s Sphere', 'Mind Stone', 'Fellwar Stone',
    'Command Tower', 'Evolving Wilds', 'Terramorphic Expanse', 'Myriad Landscape',
    'Swiftfoot Boots', 'Lightning Greaves', 'Worn Powerstone', 'Hedron Archive',
    'Thran Dynamo', 'Gilded Lotus', 'Chromatic Lantern', 'Wayfarer\'s Bauble',
    'Rampant Growth', 'Cultivate', 'Kodama\'s Reach', 'Farseek'
  ];
  
  // Find first unused fallback
  for (const fallback of extendedFallbacks) {
    if (!usedReplacements.has(fallback) && !originalCardNames.has(fallback)) {
      return {
        name: fallback,
        reason: `Alternative replacement to avoid singleton violation`,
        synergy_score: 6,
        category: 'Utility',
        cmc: 2
      };
    }
  }
  
  // If all fallbacks are used, generate a unique generic card name
  let counter = 1;
  while (true) {
    const genericName = `Generic Replacement ${counter}`;
    if (!usedReplacements.has(genericName) && !originalCardNames.has(genericName)) {
      return {
        name: genericName,
        reason: 'Emergency replacement to avoid singleton violation',
        synergy_score: 5,
        category: 'Utility',
        cmc: 2
      };
    }
    counter++;
  }
}; 