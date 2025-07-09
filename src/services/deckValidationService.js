/**
 * AI-powered deck validation service
 * Uses o3-2025-04-16 model for specialized validation scanning
 * Now integrates with centralized Commander legality service
 */

import { getOpenAIApiKey } from '../utils/openaiAPI.js';
import commanderLegalityService from './commanderLegalityService.js';

const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Validate a deck using AI to scan for violations and suggest replacements
 * @param {Array} cardList - List of cards to validate
 * @param {Object} commander - Commander card object
 * @param {Object} archetypeRules - Archetype rules including budget constraints
 * @returns {Object} Validation result with violations and replacement suggestions
 */
export const validateDeckWithAI = async (cardList, commander, archetypeRules = null) => {
  // First, run our centralized legality check
  const centralizedValidation = commanderLegalityService.validateDeck(cardList, commander);
  
  // Always perform land count validation for budget decks
  let landValidationResult = { violations: [] };
  if (archetypeRules) {
    landValidationResult = validateLandCount(cardList, commander, archetypeRules);
  } else {
    // Even without archetype rules, check for basic land count requirements
    const landCount = getLandCount(cardList);
    if (landCount < 30) {
      landValidationResult.violations.push({
        card: 'Insufficient Lands',
        violation_type: 'land_count',
        severity: 'critical',
        reason: `Deck has ${landCount} lands but needs at least 30-36 for proper mana base`,
        suggested_replacement: 'Add more basic lands',
        replacement_category: 'Lands'
      });
    }
  }
  
  // If we have critical violations from the centralized service, return those immediately
  if (!centralizedValidation.isValid && centralizedValidation.summary.criticalViolations > 0) {
    console.log('Centralized validation found critical violations, using those results');
    const formattedResult = formatForAIResponse(centralizedValidation);
    // Add any land violations to the result
    if (landValidationResult.violations.length > 0) {
      formattedResult.violations.push(...landValidationResult.violations);
      formattedResult.summary.total_violations += landValidationResult.violations.length;
    }
    return formattedResult;
  }

  // Build enhanced prompt that includes archetype-aware land count validation
  const getArchetypeLandGuidance = (archetypeRules) => {
    if (!archetypeRules) {
      return `
5. Land Count Validation: Ensure adequate land base (typically 36-38 lands)`;
    }
    
    const { deckStyle, distribution, maxBudget, landPools } = archetypeRules;
    const landRange = `${distribution?.lands?.min || 36}-${distribution?.lands?.max || 38}`;
    
    switch (deckStyle) {
      case 'competitive':
        return `
5. Land Count Validation: Ensure optimized land distribution for competitive play
   - Target land count: ${landRange} lands (aggressive strategy)
   - Focus on speed and efficiency
   - Prefer premium mana base options:
     * Fetch lands, shock lands, original duals
     * Command Tower, City of Brass, Mana Confluence
     * Fast lands and pain lands for early game
   - Avoid slow lands like gates and bounce lands`;
     
      case 'casual':
        return `
5. Land Count Validation: Ensure stable land distribution for casual multiplayer
   - Target land count: ${landRange} lands (stable gameplay)
   - Balance power level for fun interactions
   - Mix of budget and mid-tier lands:
     * Command Tower, Exotic Orchard, Reflecting Pool
     * Temple lands, bounce lands for card advantage
     * Some basic lands for consistency
   - Avoid overly expensive or oppressive lands`;
     
      case 'budget':
      default:
        return `
5. Land Count Validation: Ensure proper land distribution for budget decks
   - Target land count: ${landRange} lands
   - Budget constraint: $${maxBudget || 100} total budget
   - Prefer basic lands and budget-friendly options:
     * Basic lands (Plains, Island, Swamp, Mountain, Forest)
     * Command Tower, Exotic Orchard, Terramorphic Expanse
     * Evolving Wilds, Myriad Landscape
     * Guild gates and common dual lands
   - Avoid expensive lands like fetch lands, shock lands, original duals`;
    }
  };
  
  const landCountGuidance = getArchetypeLandGuidance(archetypeRules);

  const prompt = `VALIDATION EXPERT TASK: Scan this Commander deck for critical violations.

Commander: ${commander.name}
Color Identity: [${commander.color_identity?.join(', ') || 'Colorless'}]
Commander Colors: ${commander.colors?.join('') || 'Colorless'}
${archetypeRules ? `Deck Style: ${archetypeRules.deckStyle || 'Unknown'}` : ''}
${archetypeRules?.maxBudget ? `Budget Constraint: $${archetypeRules.maxBudget}` : ''}

SCAN FOR VIOLATIONS:
1. Color Identity: Cards with mana symbols outside commander colors
2. Format Legality: Banned cards in Commander format  
3. Singleton Rule: Duplicates (EXCEPT basic lands AND cards with "A deck can have any number of cards named...")
4. Basic Functionality: Missing essential card types${landCountGuidance}

IMPORTANT SINGLETON RULE EXCEPTIONS:
- Basic lands (Plains, Island, Swamp, Mountain, Forest, Wastes) can have multiple copies
- Cards with oracle text "A deck can have any number of cards named [card name]" can have multiple copies
- Examples: Cid, Timeless Artificer, Persistent Petitioners, Shadowborn Apostle, etc.

Deck List to Validate (${cardList.length} cards):
${JSON.stringify(cardList.map(card => ({ 
  name: card.name, 
  category: card.category 
})).slice(0, 50), null, 2)}${cardList.length > 50 ? '\n... (truncated for brevity)' : ''}

CURRENT LAND COUNT: ${getLandCount(cardList)} lands

KNOWN PROBLEM CARDS (check for these specifically):
- Recently banned: Mana Crypt, Dockside Extortionist, Jeweled Lotus, Nadu Winged Wisdom
- Color identity issues: Triomes, Talismans, hybrid lands
- Recently UNBANNED (April 2025): Gifts Ungiven, Sway of the Stars, Braids Cabal Minion, Coalition Victory, Panoptic Mirror
${archetypeRules?.maxBudget ? `- Budget violations: Cards over $${archetypeRules.maxCardPrice || Math.floor(archetypeRules.maxBudget * 0.1)}` : ''}

RESPONSE FORMAT (JSON only):
{
  "violations": [
    {
      "card": "Problematic Card Name",
      "violation_type": "color_identity|format_legality|singleton|functionality|land_count|budget_constraint",
      "severity": "critical|moderate|minor",
      "reason": "Specific explanation of the violation",
      "suggested_replacement": "Replacement Card Name",
      "replacement_category": "Same category as original"
    }
  ],
  "summary": {
    "total_violations": 3,
    "critical": 1,
    "moderate": 2,
    "deck_assessment": "Requires 3 replacements for legal play"
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
        model: 'o3-2025-04-16', // Specialized reasoning model for validation
        messages: [
          { 
            role: 'system', 
            content: 'You are a Magic: The Gathering rules expert specializing in Commander format validation. You have perfect knowledge of all banned cards, color identity rules, format restrictions, and optimal deck construction including mana bases. Return only valid JSON. Use the April 2025 updated banned list.'
          },
          { role: 'user', content: prompt }
        ],
        max_completion_tokens: 3000
        // Note: o3 model uses default temperature (1) - no temperature parameter needed
      })
    });

    if (!response.ok) {
      console.warn('AI validation failed, falling back to centralized validation');
      const formattedResult = formatForAIResponse(centralizedValidation);
      if (landValidationResult.violations.length > 0) {
        formattedResult.violations.push(...landValidationResult.violations);
        formattedResult.summary.total_violations += landValidationResult.violations.length;
      }
      return formattedResult;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.warn('Empty AI validation response, using centralized validation');
      const formattedResult = formatForAIResponse(centralizedValidation);
      if (landValidationResult.violations.length > 0) {
        formattedResult.violations.push(...landValidationResult.violations);
        formattedResult.summary.total_violations += landValidationResult.violations.length;
      }
      return formattedResult;
    }

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const aiValidationResult = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!aiValidationResult.violations || !Array.isArray(aiValidationResult.violations)) {
        throw new Error('Invalid validation result structure');
      }
      
      // Merge AI results with centralized validation and land validation
      const mergedResult = mergeValidationResults(aiValidationResult, centralizedValidation, landValidationResult);
      
      console.log(`AI validation completed with centralized backup: ${mergedResult.summary || 'No summary'}`);
      return mergedResult;
      
    } catch (parseError) {
      console.error('Failed to parse AI validation response:', parseError);
      const formattedResult = formatForAIResponse(centralizedValidation);
      if (landValidationResult.violations.length > 0) {
        formattedResult.violations.push(...landValidationResult.violations);
        formattedResult.summary.total_violations += landValidationResult.violations.length;
      }
      return formattedResult;
    }
    
  } catch (error) {
    console.error('AI validation service error:', error);
    const formattedResult = formatForAIResponse(centralizedValidation);
    if (landValidationResult.violations.length > 0) {
      formattedResult.violations.push(...landValidationResult.violations);
      formattedResult.summary.total_violations += landValidationResult.violations.length;
    }
    return formattedResult;
  }
};

/**
 * Validate land count for proper mana base
 * @param {Array} cardList - List of cards to validate
 * @param {Object} commander - Commander card object
 * @param {Object} archetypeRules - Archetype rules including distribution requirements
 * @returns {Object} Land validation result
 */
const validateLandCount = (cardList, commander, archetypeRules) => {
  const landCount = getLandCount(cardList);
  const violations = [];
  
  if (archetypeRules?.distribution?.lands) {
    const { min, max } = archetypeRules.distribution.lands;
    
    if (landCount < min) {
      violations.push({
        card: 'Insufficient Lands',
        violation_type: 'land_count',
        severity: 'critical',
        reason: `Deck has ${landCount} lands but needs at least ${min} for proper mana base`,
        suggested_replacement: getBudgetLandSuggestion(commander, archetypeRules),
        replacement_category: 'Lands'
      });
    } else if (landCount > max) {
      violations.push({
        card: 'Excessive Lands',
        violation_type: 'land_count',
        severity: 'moderate',
        reason: `Deck has ${landCount} lands but should have at most ${max} to maintain spell density`,
        suggested_replacement: 'Remove excess lands',
        replacement_category: 'Lands'
      });
    }
  }
  
  return { violations };
};

/**
 * Get the total land count in a deck
 * @param {Array} cardList - List of cards
 * @returns {number} Number of lands
 */
const getLandCount = (cardList) => {
  return cardList.filter(card => {
    const category = card.category?.toLowerCase() || '';
    const typeLine = card.type_line?.toLowerCase() || '';
    return category === 'lands' || 
           category === 'land' || 
           category.includes('land') ||
           typeLine.includes('land');
  }).length;
};

/**
 * Get archetype-appropriate land suggestion based on commander colors and deck style
 * @param {Object} commander - Commander card object
 * @param {Object} archetypeRules - Archetype rules
 * @returns {string} Suggested land name
 */
const getBudgetLandSuggestion = (commander, archetypeRules) => {
  const colorIdentity = commander.color_identity || [];
  const archetype = archetypeRules?.deckStyle || 'budget';
  const budget = archetypeRules?.maxBudget || 100;
  
  // Get archetype-specific land pools
  const landPools = archetypeRules?.landPools || {};
  
  switch (archetype) {
    case 'competitive':
      // Competitive decks prefer premium lands
      if (colorIdentity.length === 0) return 'Wastes';
      if (colorIdentity.length === 1) {
        const colorToLand = { 'W': 'Plains', 'U': 'Island', 'B': 'Swamp', 'R': 'Mountain', 'G': 'Forest' };
        return colorToLand[colorIdentity[0]] || 'Plains';
      }
      // Suggest premium utility lands for multicolor
      if (landPools.utility?.length > 0) {
        return landPools.utility[0]; // Command Tower, City of Brass, etc.
      }
      return 'Command Tower';
      
    case 'casual':
      // Casual decks prefer mid-tier lands
      if (colorIdentity.length === 0) return 'Wastes';
      if (colorIdentity.length === 1) {
        const colorToLand = { 'W': 'Plains', 'U': 'Island', 'B': 'Swamp', 'R': 'Mountain', 'G': 'Forest' };
        return colorToLand[colorIdentity[0]] || 'Plains';
      }
      // Suggest mid-tier utility lands for multicolor
      if (landPools.utility?.length > 0) {
        return landPools.utility[0]; // Command Tower, Exotic Orchard, etc.
      }
      return 'Exotic Orchard';
      
    case 'budget':
    default:
      // Budget decks prioritize cost-effective lands
      // For ultra-budget decks, prefer basic lands
      if (budget <= 50) {
        if (colorIdentity.length === 0) return 'Wastes';
        if (colorIdentity.length === 1) {
          const colorToLand = { 'W': 'Plains', 'U': 'Island', 'B': 'Swamp', 'R': 'Mountain', 'G': 'Forest' };
          return colorToLand[colorIdentity[0]] || 'Plains';
        }
        return 'Command Tower';
      }
      
      // For moderate budget decks, suggest budget-friendly utility lands
      if (budget <= 100) {
        if (colorIdentity.length <= 1) return 'Terramorphic Expanse';
        if (colorIdentity.length >= 2) return 'Exotic Orchard';
        return 'Evolving Wilds';
      }
      
      // For higher budget decks, suggest efficient budget lands
      return 'Myriad Landscape';
  }
};

/**
 * Format centralized validation results to match AI response format
 * @param {Object} centralizedResult - Result from centralized legality service
 * @returns {Object} Formatted result matching AI response structure
 */
const formatForAIResponse = (centralizedResult) => {
  const violations = centralizedResult.violations.map(violation => ({
    card: violation.cardName || 'Unknown Card',
    violation_type: violation.type,
    severity: violation.severity,
    reason: violation.message,
    suggested_replacement: commanderLegalityService.getBannedCardReplacements(violation.cardName || '')[0] || 'Sol Ring',
    replacement_category: 'Utility'
  }));

  return {
    violations,
    summary: {
      total_violations: violations.length,
      critical: violations.filter(v => v.severity === 'critical').length,
      moderate: violations.filter(v => v.severity === 'moderate').length,
      deck_assessment: centralizedResult.summary.deckAssessment || 'Validation completed'
    }
  };
};

/**
 * Merge AI validation results with centralized validation and land validation
 * @param {Object} aiResult - AI validation result
 * @param {Object} centralizedResult - Centralized validation result
 * @param {Object} landResult - Land validation result
 * @returns {Object} Merged validation result
 */
const mergeValidationResults = (aiResult, centralizedResult, landResult) => {
  const aiViolations = aiResult.violations || [];
  const centralizedViolations = centralizedResult.violations || [];
  const landViolations = landResult.violations || [];
  
  // Create a map of violations by card name to avoid duplicates
  const violationMap = new Map();
  
  // Add AI violations first
  aiViolations.forEach(violation => {
    violationMap.set(violation.card, violation);
  });
  
  // Add centralized violations that AI might have missed
  centralizedViolations.forEach(violation => {
    const cardName = violation.cardName || violation.card;
    if (!violationMap.has(cardName)) {
      violationMap.set(cardName, {
        card: cardName,
        violation_type: violation.type,
        severity: violation.severity,
        reason: violation.message,
        suggested_replacement: commanderLegalityService.getBannedCardReplacements(cardName)[0] || 'Sol Ring',
        replacement_category: 'Utility'
      });
    }
  });
  
  // Add land violations that AI might have missed
  landViolations.forEach(violation => {
    if (!violationMap.has(violation.card)) {
      violationMap.set(violation.card, violation);
    }
  });
  
  const mergedViolations = Array.from(violationMap.values());
  
  return {
    violations: mergedViolations,
    summary: {
      total_violations: mergedViolations.length,
      critical: mergedViolations.filter(v => v.severity === 'critical').length,
      moderate: mergedViolations.filter(v => v.severity === 'moderate').length,
      deck_assessment: aiResult.summary?.deck_assessment || 'Validation completed with enhanced checks'
    }
  };
};

/**
 * Fallback rule-based validation when AI validation fails
 * @param {Array} cardList - List of cards to validate
 * @param {Object} commander - Commander card object
 * @returns {Object} Validation result
 */
const fallbackValidation = (cardList, commander) => {
  // Use our centralized legality service for fallback validation
  const result = commanderLegalityService.validateDeck(cardList, commander);
  return formatForAIResponse(result);
};

/**
 * Apply validation fixes to a card list
 * @param {Array} cardList - Original card list
 * @param {Object} validationResult - Validation result with suggested fixes
 * @param {Object} commander - Commander card object
 * @returns {Array} Updated card list with fixes applied
 */
export const applyValidationFixes = async (cardList, validationResult, commander) => {
  let updatedList = [...cardList];
  const appliedFixes = [];
  
  if (!validationResult.violations || validationResult.violations.length === 0) {
    return updatedList;
  }
  
  for (const violation of validationResult.violations) {
    const cardIndex = updatedList.findIndex(card => card.name === violation.card);
    
    if (cardIndex !== -1) {
      try {
        // Try to fetch replacement card data from Scryfall
        const replacementData = await fetchCardFromScryfall(violation.suggested_replacement);
        
        // Validate the replacement card using our centralized service
        const replacementValidation = commanderLegalityService.validateCard(replacementData, commander);
        
        if (replacementValidation.isValid) {
          updatedList[cardIndex] = {
            ...replacementData,
            category: violation.replacement_category || updatedList[cardIndex].category,
            validation_fix: true,
            original_card: violation.card,
            fix_reason: violation.reason
          };
          
          appliedFixes.push({
            original: violation.card,
            replacement: violation.suggested_replacement,
            reason: violation.reason
          });
          
          console.log(`Applied fix: ${violation.card} → ${violation.suggested_replacement}`);
        } else {
          console.warn(`Replacement ${violation.suggested_replacement} is not valid, skipping fix`);
        }
        
      } catch (error) {
        console.warn(`Failed to fetch replacement ${violation.suggested_replacement}:`, error);
        
        // Use fallback replacement from centralized service
        const fallbackReplacements = commanderLegalityService.getBannedCardReplacements(violation.card);
        for (const fallbackCard of fallbackReplacements) {
          try {
            const fallbackData = await fetchCardFromScryfall(fallbackCard);
            const fallbackValidation = commanderLegalityService.validateCard(fallbackData, commander);
            
            if (fallbackValidation.isValid) {
              updatedList[cardIndex] = {
                ...fallbackData,
                category: violation.replacement_category || updatedList[cardIndex].category,
                validation_fix: true,
                original_card: violation.card,
                fix_reason: `Fallback replacement for ${violation.reason}`
              };
              
              appliedFixes.push({
                original: violation.card,
                replacement: fallbackCard,
                reason: `Fallback replacement`
              });
              
              console.log(`Applied fallback fix: ${violation.card} → ${fallbackCard}`);
              break;
            }
          } catch (fallbackError) {
            continue;
          }
        }
      }
    }
  }
  
  console.log(`Applied ${appliedFixes.length} validation fixes`);
  return updatedList;
};

/**
 * Fetch card data from Scryfall API
 * @param {string} cardName - Name of the card to fetch
 * @returns {Object} Card data from Scryfall
 */
const fetchCardFromScryfall = async (cardName) => {
  const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`);
  
  if (!response.ok) {
    throw new Error(`Card not found: ${cardName}`);
  }
  
  return await response.json();
};

/**
 * Find a category-appropriate replacement card
 * @param {Object} originalCard - Original card object
 * @param {Object} commander - Commander card object
 * @returns {Object} Replacement card data
 */
const findCategoryReplacement = async (originalCard, commander) => {
  const categoryReplacements = {
    'Lands': ['Command Tower', 'Evolving Wilds', 'Terramorphic Expanse'],
    'Ramp': ['Sol Ring', 'Arcane Signet', 'Commander\'s Sphere'],
    'Card Draw': ['Rhystic Study', 'Divination', 'Sign in Blood'],
    'Removal': ['Swords to Plowshares', 'Path to Exile', 'Beast Within'],
    'Protection': ['Swiftfoot Boots', 'Lightning Greaves', 'Heroic Intervention']
  };
  
  const category = originalCard.category || 'Utility';
  const possibleReplacements = categoryReplacements[category] || categoryReplacements['Ramp'];
  
  // Try to fetch the first available replacement that passes validation
  for (const replacementName of possibleReplacements) {
    try {
      const cardData = await fetchCardFromScryfall(replacementName);
      const validation = commanderLegalityService.validateCard(cardData, commander);
      
      if (validation.isValid) {
        return cardData;
      }
    } catch (error) {
      continue;
    }
  }
  
  // Final fallback
  return await fetchCardFromScryfall('Sol Ring');
};

/**
 * Generate a basic land appropriate for the commander's color identity
 * @param {Array} colorIdentity - Commander's color identity
 * @returns {Object} Basic land card object
 */
const generateBasicLand = (colorIdentity) => {
  const basicLands = {
    'W': 'Plains',
    'U': 'Island', 
    'B': 'Swamp',
    'R': 'Mountain',
    'G': 'Forest'
  };
  
  // Pick the first color in the commander's identity
  const landType = basicLands[colorIdentity[0]] || 'Wastes';
  
  return {
    name: landType,
    type_line: `Basic Land — ${landType}`,
    color_identity: colorIdentity[0] ? [colorIdentity[0]] : [],
    mana_cost: '',
    cmc: 0,
    oracle_text: `{T}: Add {${colorIdentity[0] || 'C'}}.`,
    legalities: { commander: 'legal' },
    category: 'Lands'
  };
}; 