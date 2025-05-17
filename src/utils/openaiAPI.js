/**
 * Utility functions for interacting with the OpenAI API for card suggestions
 */

// Default API endpoint
const API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Get card suggestions from OpenAI based on the current deck and commander
 * 
 * @param {Object} commander - The deck's commander
 * @param {Array} currentDeck - Current cards in the deck
 * @param {Object} options - Additional options for the suggestion
 * @param {string} options.apiKey - OpenAI API key
 * @param {number} options.maxSuggestions - Maximum number of cards to suggest (default: 15)
 * @param {string} options.model - OpenAI model to use (default: gpt-4o)
 * @param {Array} options.categories - Card categories to focus on
 * @param {string} options.deckTheme - Deck theme or strategy
 * @returns {Promise<Array>} - Promise resolving to an array of suggested cards
 */
export const getSuggestions = async (commander, currentDeck, options = {}) => {
  const {
    maxSuggestions = 15,
    model = 'o4-mini',
    categories = [],
    temperature = 0.8,
    deckTheme = '',
  } = options;

  // Cap maxSuggestions to reasonable limits
  const requestedSuggestions = Math.min(Math.max(1, maxSuggestions), 100);
  
  // Handle missing API key
  const currentApiKey = getOpenAIApiKey();
  
  if (!currentApiKey) {
    throw new Error('AI service configuration error');
  }

  if (!commander) {
    throw new Error('Commander is required for AI suggestions');
  }

  // Prepare data about the deck for the prompt
  const deckStats = analyzeDeck(currentDeck);
  
  // Format category focus as MTG terminology
  const categoryFocus = categories.length > 0 ? 
    `Focus on suggesting cards in these categories: ${categories.join(', ')}.` : 
    '';
    
  // Add theme/strategy focus if provided
  const themeFocus = deckTheme ? 
    `The deck is focusing on a "${deckTheme}" strategy or theme.` : 
    '';

  // Format the deck data for the prompt
  const deckSummary = formatDeckForPrompt(commander, currentDeck, deckStats);

  // Enhanced prompt with more MTG context
  const prompt = `You are an expert Magic: The Gathering deck builder specialized in the Commander format with deep knowledge of card synergies, meta strategies, and powerful combos.

I'm building a Commander deck with ${commander.name} as my commander. ${themeFocus}

Here's information about my current deck:
${deckSummary}

Please suggest EXACTLY ${requestedSuggestions} unique cards that would significantly improve this deck. ${categoryFocus}

IMPORTANT: You must provide EXACTLY ${requestedSuggestions} card suggestions. No more, no less. If I'm asking for many suggestions (50+), include a variety of cards across different categories, including some less obvious choices.

For each suggestion:
1. Consider strong synergies with the commander's abilities
2. Evaluate how it complements the existing cards
3. Keep in mind the color identity restrictions
4. Think about the mana curve and card type distribution
5. Choose cards that align with Commander format power level and meta
6. Include a mix of budget options and higher-value cards
7. Ensure all cards are real MTG cards with precise spelling of names

Format your response as a JSON array of objects with these properties:
- name: The full card name (be very precise with spelling)
- reason: A brief explanation (1-2 sentences) of why this card fits well
- category: The primary category (one of: "Card Draw", "Ramp", "Removal", "Combo Piece", "Utility", "Finisher", "Protection", "Recursion", "Tutor", "Lands", "Synergy", "Control")

Only include the JSON array in your response, nothing else.`;

  try {
    // Make the API call to OpenAI
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentApiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert Magic: The Gathering deck builder assistant with deep knowledge of the Commander format, all card interactions, and optimal deck building strategies.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: Math.min(4000, 500 + (requestedSuggestions * 100)),
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const suggestionsText = data.choices[0]?.message?.content;

    if (!suggestionsText) {
      throw new Error('No suggestions received from OpenAI');
    }

    // Parse the JSON response
    try {
      // Extract the JSON part from the response (OpenAI might include markdown backticks)
      const jsonMatch = suggestionsText.match(/\\[.*?\\]/s) || 
                      suggestionsText.match(/\\{.*?\\}/s) ||
                      suggestionsText.match(/\[.*?\]/s) || 
                      suggestionsText.match(/\{.*?\}/s);
      
      const jsonText = jsonMatch ? jsonMatch[0] : suggestionsText;
      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse card suggestions from OpenAI');
    }
  } catch (error) {
    console.error('Error getting suggestions from OpenAI:', error);
    // Sanitize error messages for end users
    if (error.message.includes('API key')) {
      throw new Error('AI service configuration error');
    } else {
      throw error;
    }
  }
};

/**
 * Analyze the deck to get statistics for the prompt
 * 
 * @param {Array} deck - Array of cards in the deck
 * @returns {Object} - Object containing deck statistics
 */
function analyzeDeck(deck) {
  // Count cards by type
  const typeCount = {};
  // Calculate mana curve
  const manaCurve = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, '7+': 0 };
  // Count cards by color
  const colorCount = { W: 0, U: 0, B: 0, R: 0, G: 0, colorless: 0 };

  deck.forEach(card => {
    const quantity = card.quantity || 1;
    
    // Count by type
    const type = getCardType(card);
    typeCount[type] = (typeCount[type] || 0) + quantity;
    
    // Count by mana value
    const cmc = Math.floor(card.cmc || 0);
    if (cmc >= 7) {
      manaCurve['7+'] += quantity;
    } else {
      manaCurve[cmc] += quantity;
    }
    
    // Count by color
    if (card.colors && card.colors.length > 0) {
      card.colors.forEach(color => {
        if (colorCount[color] !== undefined) {
          colorCount[color] += quantity;
        }
      });
    } else {
      colorCount.colorless += quantity;
    }
  });

  return { typeCount, manaCurve, colorCount };
}

/**
 * Get the primary card type for categorization
 * 
 * @param {Object} card - Card object
 * @returns {string} - Card type category
 */
function getCardType(card) {
  const typeLine = card.type_line || '';
  
  if (typeLine.includes('Land')) {
    return 'Land';
  } else if (typeLine.includes('Creature')) {
    return 'Creature';
  } else if (typeLine.includes('Artifact')) {
    if (typeLine.includes('Creature')) {
      return 'Creature';
    }
    return 'Artifact';
  } else if (typeLine.includes('Enchantment')) {
    if (typeLine.includes('Creature')) {
      return 'Creature';
    }
    return 'Enchantment';
  } else if (typeLine.includes('Planeswalker')) {
    return 'Planeswalker';
  } else if (typeLine.includes('Instant')) {
    return 'Instant';
  } else if (typeLine.includes('Sorcery')) {
    return 'Sorcery';
  } else {
    return 'Other';
  }
}

/**
 * Format the deck data for the prompt
 * 
 * @param {Object} commander - Commander card object
 * @param {Array} deck - Array of cards in the deck
 * @param {Object} stats - Deck statistics
 * @returns {string} - Formatted deck summary for the prompt
 */
function formatDeckForPrompt(commander, deck, stats) {
  // Format commander info
  const commanderInfo = `
Commander: ${commander.name}
Color Identity: ${commander.color_identity?.join('') || 'Colorless'}
Commander Type: ${commander.type_line}
Commander Text: ${commander.oracle_text}`;

  // Format deck stats
  const deckSize = deck.reduce((count, card) => count + (card.quantity || 1), 0);
  const statsInfo = `
Deck Size: ${deckSize}/99 cards (excluding commander)
Card Types:
${Object.entries(stats.typeCount)
  .map(([type, count]) => `- ${type}: ${count} cards`)
  .join('\n')}

Mana Curve:
${Object.entries(stats.manaCurve)
  .map(([cmc, count]) => `- ${cmc} CMC: ${count} cards`)
  .join('\n')}

Color Distribution:
${Object.entries(stats.colorCount)
  .filter(([_, count]) => count > 0)
  .map(([color, count]) => `- ${color}: ${count} cards`)
  .join('\n')}`;

  // List some key cards for context (limit to 20 to keep prompt size reasonable)
  const keyCards = deck.slice(0, 20).map(card => card.name).join(', ');
  const keyCardsInfo = `
Some cards already in the deck:
${keyCards}${deck.length > 20 ? '... (and more)' : ''}`;

  return `${commanderInfo}\n${statsInfo}\n${keyCardsInfo}`;
}

/**
 * Get OpenAI API key from environment variables or localStorage
 * 
 * @returns {string|null} - OpenAI API key or null if not found
 */
export const getOpenAIApiKey = () => {
  // Retrieve the API key from Vite's environment variables
  const apiKeyFromEnv = import.meta.env.VITE_OPENAI_API_KEY;
  return apiKeyFromEnv || null; // Return null if not found
}; 