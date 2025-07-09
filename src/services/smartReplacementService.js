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
 * @param {Object} archetypeRules - Archetype rules for budget constraints
 * @returns {Object} Replacement suggestions with reasoning
 */
export const generateSmartReplacements = async (problematicCards, commander, currentDeck, archetypeRules = null) => {
  // Handle land count violations first - now supports all archetypes
  const landViolations = problematicCards.filter(card => 
    card.violation_type === 'land_count' ||
    card.card === 'Insufficient Lands' ||
    card.card === 'Excessive Lands' ||
    card.reason?.includes('land') || 
    card.violation_reason?.includes('land') || 
    card.category?.toLowerCase().includes('land')
  );
  
  if (landViolations.length > 0 && archetypeRules) {
    const landReplacements = await generateArchetypeLandReplacements(landViolations, commander, currentDeck, archetypeRules);
    // If we only have land violations, return land replacements immediately
    if (landViolations.length === problematicCards.length) {
      return landReplacements;
    }
  }
  
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

  // Build enhanced prompt with archetype-specific considerations
  const getArchetypeGuidance = (archetypeRules) => {
    if (!archetypeRules) return '';
    
    const { deckStyle, maxBudget, maxCardPrice } = archetypeRules;
    
    switch (deckStyle) {
      case 'competitive':
        return `
  
COMPETITIVE DECK CONSTRAINTS:
- Focus on efficiency and speed for cEDH play
- Prioritize powerful staples and premium cards
- For lands: Prefer fetch lands, shock lands, original duals, premium utility lands
- For spells: Include tutors, fast mana, powerful staples
- Optimize for early game impact and combo potential`;

      case 'casual':
        return `
  
CASUAL DECK CONSTRAINTS:
- Balance power level for fun multiplayer games
- Focus on theme coherence and interesting interactions
- For lands: Mix of budget and mid-tier lands, avoid overly expensive options
- For spells: Prioritize synergy and flavor over raw power
- Avoid oppressive or unfun cards`;

      case 'budget':
        return `
  
BUDGET DECK CONSTRAINTS:
- Total budget: $${maxBudget || 100}
- Max card price: $${maxCardPrice || Math.floor((maxBudget || 100) * 0.1)}
- Prefer commons/uncommons with high value
- For lands: Prioritize basic lands, Command Tower, Exotic Orchard, guild gates
- For spells: Focus on efficient, budget-friendly alternatives
- Avoid expensive staples like fetch lands, tutors, premium artifacts`;

      default:
        return '';
    }
  };
  
  const archetypeGuidance = getArchetypeGuidance(archetypeRules);

  const prompt = `REPLACEMENT EXPERT TASK: Generate intelligent replacement suggestions for problematic cards.

Commander: ${commander.name}
Color Identity: [${commander.color_identity?.join(', ') || 'Colorless'}]
Commander Strategy: ${getCommanderStrategy(commander)}
${archetypeRules ? `Deck Style: ${archetypeRules.deckStyle || 'Unknown'}` : ''}${archetypeGuidance}

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
${archetypeRules?.deckStyle === 'budget' ? `6. Must fit within budget constraints (individual cards under $${archetypeRules.maxCardPrice || Math.floor((archetypeRules.maxBudget || 100) * 0.1)})` : ''}
${archetypeRules?.deckStyle === 'competitive' ? `6. Prioritize efficiency and power level for cEDH play` : ''}
${archetypeRules?.deckStyle === 'casual' ? `6. Balance power level for fun multiplayer interactions` : ''}

ARCHETYPE-SPECIFIC LAND REPLACEMENT LOGIC:
${archetypeRules?.deckStyle === 'competitive' ? `- For competitive decks: Prefer fetch lands, shock lands, original duals, premium utility lands
- Minimize basics, maximize efficiency and speed
- Include fast mana sources and premium fixing` : ''}
${archetypeRules?.deckStyle === 'casual' ? `- For casual decks: Mix of budget and mid-tier lands for stable gameplay
- Include Temple lands, bounce lands, some basic lands
- Avoid overly expensive or oppressive lands` : ''}
${archetypeRules?.deckStyle === 'budget' ? `- For budget decks: Prefer basic lands, Command Tower, Exotic Orchard, guild gates
- Avoid expensive lands like fetch lands, shock lands, original duals` : ''}
- For insufficient lands: Add appropriate lands based on archetype and color identity
- For excessive lands: Remove utility lands, keep essential mana sources
- Consider color fixing needs based on commander's color identity

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
            content: 'You are a Magic: The Gathering deck building expert specializing in Commander format. You have deep knowledge of card synergies, mana curves, strategic deck construction, and budget-conscious deck building. Use the April 2025 updated banned list. Return only valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 2500
        // Note: o3 model uses default temperature (1) - no temperature parameter needed
      })
    });

    if (!response.ok) {
      console.warn('AI replacement generation failed, using centralized fallback');
      return generateFallbackReplacements(problematicCards, commander, currentDeck, archetypeRules);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn('Empty AI replacement response, using fallback');
      return generateFallbackReplacements(problematicCards, commander, currentDeck, archetypeRules);
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
      return generateFallbackReplacements(problematicCards, commander, currentDeck, archetypeRules);
    }
    
  } catch (error) {
    console.error('Smart replacement service error:', error);
    return generateFallbackReplacements(problematicCards, commander, currentDeck, archetypeRules);
  }
};

/**
 * Generate budget-friendly land replacements for land count violations
 * @param {Array} landViolations - Land-related violations
 * @param {Object} commander - Commander card object
 * @param {Array} currentDeck - Current deck list
 * @param {Object} archetypeRules - Archetype rules
 * @returns {Object} Land replacement suggestions
 */
const generateArchetypeLandReplacements = async (landViolations, commander, currentDeck, archetypeRules) => {
  const colorIdentity = commander.color_identity || [];
  const archetype = archetypeRules.deckStyle || 'budget';
  const currentLandCount = currentDeck.filter(card => {
    const category = card.category?.toLowerCase() || '';
    const typeLine = card.type_line?.toLowerCase() || '';
    return category === 'lands' || 
           category === 'land' || 
           category.includes('land') ||
           typeLine.includes('land');
  }).length;
  
  const targetLandCount = archetypeRules.distribution?.lands?.min || 36;
  const maxLandCount = archetypeRules.distribution?.lands?.max || 38;
  const replacements = [];
  
  for (const violation of landViolations) {
    const isInsufficientLands = violation.violation_type === 'land_count' ||
                                violation.card === 'Insufficient Lands' ||
                                violation.reason?.includes('at least') || 
                                violation.reason?.includes('needs') ||
                                violation.reason?.includes('Insufficient');
    
    const isExcessiveLands = violation.card === 'Excessive Lands' ||
                            violation.reason?.includes('at most') ||
                            violation.reason?.includes('too many') ||
                            violation.reason?.includes('excessive');
    
    if (isInsufficientLands) {
      // Calculate how many lands we need to add
      const landsNeeded = targetLandCount - currentLandCount;
      console.log(`Land violation: Need ${landsNeeded} more lands (current: ${currentLandCount}, target: ${targetLandCount})`);
      
      if (landsNeeded > 0) {
        // Generate the exact number of lands needed based on archetype
        const neededLands = getArchetypeLandSuggestions(commander, archetypeRules, landsNeeded);
        
        const archetypeDescription = {
          budget: `budget-friendly lands under $${archetypeRules.maxBudget || 100} budget`,
          competitive: `premium lands for competitive play`,
          casual: `balanced lands for casual multiplayer`
        };
        
        replacements.push({
          original_card: violation.card || 'Insufficient Lands',
          suggested_cards: neededLands.map((landName, index) => ({
            name: landName,
            reason: `${archetype} land ${index + 1}/${landsNeeded} for ${colorIdentity.length > 1 ? 'multicolor' : 'monocolor'} mana base - ${archetypeDescription[archetype]}`,
            synergy_score: archetype === 'competitive' ? 9 : archetype === 'casual' ? 7 : 8,
            category: 'Lands',
            cmc: 0,
            quantity: 1
          })),
          replacement_reasoning: `Adding ${landsNeeded} ${archetype}-appropriate lands to reach proper land count for ${colorIdentity.length}-color deck`,
          replacement_type: 'add_lands',
          lands_to_add: landsNeeded
        });
      }
    } else if (isExcessiveLands) {
      // Remove excessive lands - suggest removing utility lands first
      const excessLands = currentLandCount - maxLandCount;
      
      replacements.push({
        original_card: violation.card || 'Excessive Lands',
        suggested_cards: [{
          name: 'Remove utility lands',
          reason: `Removing ${excessLands} excess lands to maintain spell density while keeping essential mana sources`,
          synergy_score: 6,
          category: 'Remove',
          cmc: 0,
          quantity: excessLands
        }],
        replacement_reasoning: `Reducing land count by ${excessLands} to optimal level for deck consistency`,
        replacement_type: 'remove_lands',
        lands_to_remove: excessLands
      });
    }
  }
  
  const archetypeAnalysis = {
    budget: {
      mana_curve_impact: 'Improved mana consistency within budget constraints',
      strategy_coherence: 'Enhanced budget mana base supports commander strategy',
      power_level: 'Optimized for budget deck performance'
    },
    competitive: {
      mana_curve_impact: 'Optimized mana consistency for aggressive strategy',
      strategy_coherence: 'Premium mana base enables competitive play',
      power_level: 'High-powered mana base for cEDH performance'
    },
    casual: {
      mana_curve_impact: 'Stable mana consistency for multiplayer games',
      strategy_coherence: 'Balanced mana base supports fun interactions',
      power_level: 'Moderate power level appropriate for casual play'
    }
  };
  
  return {
    replacements,
    deck_analysis: archetypeAnalysis[archetype] || archetypeAnalysis.budget,
    source: `${archetype}_land_replacement`
  };
};

/**
 * Get archetype-appropriate land suggestions based on commander and deck style
 * @param {Object} commander - Commander card object
 * @param {Object} archetypeRules - Archetype rules
 * @param {number} count - Number of suggestions needed
 * @returns {Array} Array of land names
 */
const getArchetypeLandSuggestions = (commander, archetypeRules, count = 1) => {
  const colorIdentity = commander.color_identity || [];
  const archetype = archetypeRules.deckStyle || 'budget';
  const budget = archetypeRules.maxBudget || 100;
  const landPools = archetypeRules.landPools || {};
  const suggestions = [];
  
  // Get basic lands for this commander
  const basicLands = [];
  const colorToLand = { 'W': 'Plains', 'U': 'Island', 'B': 'Swamp', 'R': 'Mountain', 'G': 'Forest' };
  colorIdentity.forEach(color => {
    if (colorToLand[color]) {
      basicLands.push(colorToLand[color]);
    }
  });
  
  // If no colors, use Wastes
  if (basicLands.length === 0) {
    basicLands.push('Wastes');
  }
  
  // Define archetype-specific land generation strategies
  switch (archetype) {
    case 'competitive':
      // Competitive: Premium lands, minimal basics
      const competitiveLands = [
        ...(landPools.utility || ['Command Tower', 'City of Brass', 'Mana Confluence']),
        ...(landPools.premium || ['Scalding Tarn', 'Polluted Delta', 'Windswept Heath']),
        ...(landPools.shocklands || ['Steam Vents', 'Hallowed Fountain', 'Blood Crypt']),
        ...basicLands
      ];
      
      for (let i = 0; i < count; i++) {
        if (i < Math.floor(count * 0.2)) {
          // 20% basic lands for consistency
          suggestions.push(basicLands[i % basicLands.length]);
        } else {
          // 80% premium/utility lands
          const premiumLands = competitiveLands.filter(land => !basicLands.includes(land));
          suggestions.push(premiumLands[i % premiumLands.length] || 'Command Tower');
        }
      }
      break;
      
    case 'casual':
      // Casual: Mix of budget and mid-tier lands
      const casualLands = [
        ...(landPools.utility || ['Command Tower', 'Exotic Orchard', 'Reflecting Pool']),
        ...(landPools.midTier || ['Temple of Enlightenment', 'Selesnya Sanctuary', 'Azorius Chancery']),
        ...basicLands
      ];
      
      for (let i = 0; i < count; i++) {
        if (i < Math.floor(count * 0.5)) {
          // 50% basic lands for stability
          suggestions.push(basicLands[i % basicLands.length]);
        } else {
          // 50% utility/mid-tier lands
          const utilityLands = casualLands.filter(land => !basicLands.includes(land));
          suggestions.push(utilityLands[i % utilityLands.length] || 'Exotic Orchard');
        }
      }
      break;
      
    case 'budget':
    default:
      // Budget: Mostly basics with budget utility lands
      const budgetLands = [
        ...(landPools.utility || ['Command Tower', 'Exotic Orchard', 'Terramorphic Expanse']),
        ...(landPools.budget || ['Guildgate', 'Evolving Wilds']),
        ...basicLands
      ];
      
      // Budget strategy depends on budget level
      for (let i = 0; i < count; i++) {
        if (budget <= 50) {
          // Ultra-budget: Mostly basic lands
          if (i < Math.floor(count * 0.8)) {
            // 80% basic lands
            suggestions.push(basicLands[i % basicLands.length]);
          } else {
            // 20% utility lands
            const utilityLands = budgetLands.filter(land => !basicLands.includes(land));
            suggestions.push(utilityLands[i % utilityLands.length] || 'Command Tower');
          }
        } else if (budget <= 100) {
          // Budget: Mix of basics and utility
          if (i < Math.floor(count * 0.6)) {
            // 60% basic lands
            suggestions.push(basicLands[i % basicLands.length]);
          } else {
            // 40% utility lands
            const utilityLands = budgetLands.filter(land => !basicLands.includes(land));
            suggestions.push(utilityLands[i % utilityLands.length] || 'Command Tower');
          }
        } else {
          // Higher budget: More utility lands
          if (i < Math.floor(count * 0.4)) {
            // 40% basic lands
            suggestions.push(basicLands[i % basicLands.length]);
          } else {
            // 60% utility lands
            const utilityLands = budgetLands.filter(land => !basicLands.includes(land));
            suggestions.push(utilityLands[i % utilityLands.length] || 'Command Tower');
          }
        }
      }
      break;
  }
  
  return suggestions;
};

/**
 * Get budget-friendly category fallbacks
 * @param {string} category - Card category
 * @param {Array} colorIdentity - Commander color identity
 * @param {Object} archetypeRules - Archetype rules
 * @returns {Array} Budget-friendly card names
 */
const getBudgetCategoryFallbacks = (category, colorIdentity, archetypeRules) => {
  const budget = archetypeRules?.maxBudget || 100;
  const fallbacks = [];
  
  switch (category?.toLowerCase()) {
    case 'lands':
      return getArchetypeLandSuggestions({ color_identity: colorIdentity }, archetypeRules, 5);
    
    case 'ramp':
      fallbacks.push('Sol Ring', 'Arcane Signet', 'Commander\'s Sphere', 'Mind Stone', 'Worn Powerstone');
      if (colorIdentity.includes('G')) {
        fallbacks.push('Cultivate', 'Kodama\'s Reach', 'Rampant Growth', 'Explosive Vegetation');
      }
      if (budget > 50) {
        fallbacks.push('Thran Dynamo', 'Gilded Lotus', 'Chromatic Lantern');
      }
      break;
    
    case 'card draw':
    case 'draw':
      if (colorIdentity.includes('U')) {
        fallbacks.push('Divination', 'Ponder', 'Preordain', 'Brainstorm');
      }
      if (colorIdentity.includes('B')) {
        fallbacks.push('Sign in Blood', 'Read the Bones', 'Night\'s Whisper');
      }
      if (colorIdentity.includes('G')) {
        fallbacks.push('Harmonize', 'Beast Whisperer', 'Elvish Visionary');
      }
      fallbacks.push('Phyrexian Arena', 'Rhystic Study', 'Mystic Remora');
      break;
    
    case 'removal':
      if (colorIdentity.includes('W')) {
        fallbacks.push('Swords to Plowshares', 'Path to Exile', 'Wrath of God', 'Day of Judgment');
      }
      if (colorIdentity.includes('B')) {
        fallbacks.push('Murder', 'Doom Blade', 'Hero\'s Downfall', 'Toxic Deluge');
      }
      if (colorIdentity.includes('R')) {
        fallbacks.push('Lightning Bolt', 'Shock', 'Blasphemous Act', 'Pyroclasm');
      }
      if (colorIdentity.includes('G')) {
        fallbacks.push('Beast Within', 'Krosan Grip', 'Naturalize');
      }
      fallbacks.push('Chaos Warp', 'Generous Gift', 'Cyclonic Rift');
      break;
    
    case 'protection':
      fallbacks.push('Lightning Greaves', 'Swiftfoot Boots', 'Heroic Intervention', 'Teferi\'s Protection');
      if (colorIdentity.includes('U')) {
        fallbacks.push('Counterspell', 'Negate', 'Swan Song');
      }
      if (colorIdentity.includes('W')) {
        fallbacks.push('Ghostly Prison', 'Propaganda', 'Sphere of Safety');
      }
      break;
    
    case 'utility':
    case 'core':
    case 'strategy':
    default:
      fallbacks.push('Sol Ring', 'Lightning Greaves', 'Swiftfoot Boots', 'Command Tower');
      if (colorIdentity.includes('U')) {
        fallbacks.push('Counterspell', 'Ponder');
      }
      if (colorIdentity.includes('W')) {
        fallbacks.push('Swords to Plowshares', 'Wrath of God');
      }
      if (colorIdentity.includes('B')) {
        fallbacks.push('Sign in Blood', 'Murder');
      }
      if (colorIdentity.includes('R')) {
        fallbacks.push('Lightning Bolt', 'Blasphemous Act');
      }
      if (colorIdentity.includes('G')) {
        fallbacks.push('Cultivate', 'Beast Within');
      }
      break;
  }
  
  return fallbacks;
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
 * @param {Object} archetypeRules - Archetype rules
 * @returns {Object} Fallback replacement suggestions
 */
const generateFallbackReplacements = async (problematicCards, commander, currentDeck, archetypeRules) => {
  const replacements = [];
  const usedSuggestions = new Set(); // Track used suggestions to avoid duplicates
  
  // Collect existing card names in deck
  const existingCards = new Set(currentDeck.map(card => card.name));
  
  for (const card of problematicCards) {
    const suggestions = [];
    
    // Handle land violations with budget-aware replacements
    if (card.violation_reason?.includes('land') || card.category?.toLowerCase().includes('land')) {
      const landSuggestions = getBudgetLandSuggestions(commander, archetypeRules, 3);
      for (const landName of landSuggestions) {
        if (!usedSuggestions.has(landName) && !existingCards.has(landName)) {
          suggestions.push({
            name: landName,
            reason: `Budget-friendly land replacement for ${commander.color_identity?.join('') || 'colorless'} deck`,
            synergy_score: 7,
            category: 'Lands',
            cmc: 0
          });
          usedSuggestions.add(landName);
        }
      }
    }
    // Try centralized service first
    else if (commanderLegalityService.isCardBanned(card.name)) {
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
      // Category-based fallback with budget considerations
      let categoryReplacements = getCategoryFallbacks(card.category, commander.color_identity);
      
      // For budget decks, prefer cheaper alternatives
      if (archetypeRules?.deckStyle === 'budget') {
        const budgetFallbacks = getBudgetCategoryFallbacks(card.category, commander.color_identity || [], archetypeRules);
        categoryReplacements = [...budgetFallbacks, ...categoryReplacements]; // Add budget options first
      }
      
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
    // Handle land count violations that require adding lands
    if (replacement.replacement_type === 'add_lands' && replacement.lands_to_add > 0) {
      console.log(`Adding ${replacement.lands_to_add} lands to fix land count violation`);
      
      // Add each suggested land to the deck
      replacement.suggested_cards.forEach(suggestion => {
        const newCard = {
          name: suggestion.name,
          category: 'Lands',
          cmc: 0,
          type_line: 'Land',
          color_identity: [],
          legalities: { commander: 'legal' },
          land_count_fix: true,
          replacement_info: {
            original: replacement.original_card,
            reason: suggestion.reason,
            synergy_score: suggestion.synergy_score
          }
        };
        
        updatedDeck.push(newCard);
        usedReplacements.add(suggestion.name);
        originalCardNames.add(suggestion.name);
        
        appliedReplacements.push({
          original: replacement.original_card,
          replacement: suggestion.name,
          reason: suggestion.reason,
          action: 'added_land'
        });
      });
      
      return; // Skip normal replacement logic for land additions
    }
    
    // Handle land count violations that require removing lands
    if (replacement.replacement_type === 'remove_lands' && replacement.lands_to_remove > 0) {
      console.log(`Removing ${replacement.lands_to_remove} excess lands`);
      
      // Find lands to remove (prioritize utility lands over basics)
      const landCards = updatedDeck.filter(card => {
        const category = card.category?.toLowerCase() || '';
        const typeLine = card.type_line?.toLowerCase() || '';
        return category === 'lands' || 
               category === 'land' || 
               category.includes('land') ||
               typeLine.includes('land');
      });
      
      const utilityLands = landCards.filter(card => 
        !['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name)
      );
      
      const basicLands = landCards.filter(card => 
        ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest', 'Wastes'].includes(card.name)
      );
      
      // Remove utility lands first, then basic lands if needed
      let removed = 0;
      const landsToRemove = [...utilityLands, ...basicLands];
      
      for (const land of landsToRemove) {
        if (removed >= replacement.lands_to_remove) break;
        
        const index = updatedDeck.findIndex(card => card.name === land.name);
        if (index !== -1) {
          updatedDeck.splice(index, 1);
          removed++;
          
          appliedReplacements.push({
            original: land.name,
            replacement: null,
            reason: 'Removed to fix excessive land count',
            action: 'removed_land'
          });
        }
      }
      
      return; // Skip normal replacement logic for land removals
    }
    
    // Normal 1:1 replacement logic
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
          reason: bestReplacement.reason,
          action: 'replaced'
        });
      } else {
        console.error(`No valid replacement found for ${replacement.original_card}`);
      }
    }
  });
  
  console.log(`Applied ${appliedReplacements.length} smart replacements with singleton validation`);
  console.log(`Final deck size: ${updatedDeck.length} cards`);
  
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