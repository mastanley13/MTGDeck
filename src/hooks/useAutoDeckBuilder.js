import { useState, useEffect, useRef } from 'react';
import { useDeck } from '../context/DeckContext';
import { getOpenAIApiKey } from '../utils/openaiAPI';
import { useSubscription } from '../context/SubscriptionContext';
import { validateColorIdentity } from '../utils/deckValidator';

/**
 * Hook for automatically building complete decks based on a commander
 */
export const useAutoDeckBuilder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [paywallBlocked, setPaywallBlocked] = useState(false);
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
            Keep the estimated deck cost under $250.
            Minimize expensive lands; favor basics and budget alternatives.
            Focus on efficient budget staples and synergistic commons/uncommons.
            Include budget-friendly removal and interaction options.
            Look for cost-effective alternatives to expensive staples.
          `,
          maxBudget: 250,
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
   * Build a complete competitive deck based on the selected commander
   * @param {string} deckStyle - The desired deck style/strategy
   */
  const buildCompleteDeck = async (deckStyle = 'competitive') => {
    if (!commander) {
      setError('Please select a commander first');
      return false;
    }

    // Check API key availability
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      setError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      return false;
    }

    // Check paywall limits before making multiple AI requests
    if (!isPremium && !canMakeAIRequest) {
      setPaywallBlocked(true);
      setError('AI request limit reached. Upgrade to Premium for unlimited deck building.');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);
      setPaywallBlocked(false);
      setProgress(10);
      
      // Increment AI request counter for the main deck building request
      if (!isPremium) {
        incrementAIRequests();
      }
      
      // First clear the deck except for the commander
      resetDeckExceptCommander();
      
      // Get archetype-specific rules
      const archetypeRules = getArchetypeRules(deckStyle);
      
      // Analyze commander to better understand its strategy
      const commanderAnalysis = await analyzeCommander(commander, deckStyle);
      setProgress(25);

      // Create a prompt for the AI to build a deck
      const { min: minLands, max: maxLands } = archetypeRules.cardDistribution.lands;
      const { min: minRamp, max: maxRamp } = archetypeRules.cardDistribution.ramp;
      const { min: minDraw, max: maxDraw } = archetypeRules.cardDistribution.cardDraw;
      const { min: minRemoval, max: maxRemoval } = archetypeRules.cardDistribution.removal;
      const { min: minWipes, max: maxWipes } = archetypeRules.cardDistribution.boardWipes;
      const { min: minProtection, max: maxProtection } = archetypeRules.cardDistribution.protection;
      const { min: minStrategy, max: maxStrategy } = archetypeRules.cardDistribution.strategy;

      const prompt = `
        Create a COMMANDER deck for ${commander.name} with EXACTLY 99 cards (NOT including the commander).
        
        Commander: ${commander.name} (${commander.type_line || ''})
        Commander analysis: ${commanderAnalysis}
        
        Color identity: ${commander.color_identity?.join('') || ''}
        Deck style: ${deckStyle}
        
        ${archetypeRules.prompt}
        
        IMPORTANT RULES:
        1. The deck MUST contain EXACTLY 99 cards TOTAL. DO NOT include the commander in this count.
        2. All cards must be within the commander's color identity (${commander.color_identity?.join('') || ''})
        3. Follow Commander format rules (singleton, color identity restrictions)
        4. Ensure a proper mana curve with adequate low-cost cards
        ${archetypeRules.maxBudget !== Infinity ? `5. Keep total deck cost under $${archetypeRules.maxBudget}` : ''}
        
        Card distribution:
        - ${minLands}-${maxLands} lands (including non-basics appropriate for the color identity)
        - ${minRamp}-${maxRamp} ramp spells (mana rocks, dorks, land search)
        - ${minDraw}-${maxDraw} card draw/advantage sources
        - ${minRemoval}-${maxRemoval} targeted removal spells
        - ${minWipes}-${maxWipes} board wipes/mass removal
        - ${minProtection}-${maxProtection} protection/interaction cards
        - ${minStrategy}-${maxStrategy} cards that directly support the commander's strategy
        
        Format response as a JSON array with EXACTLY 99 card objects with this structure:
        {
          "name": "Exact Card Name",
          "quantity": 1,
          "category": "Land, Ramp, Card Draw, Removal, Board Wipe, Protection, Strategy, Utility, Finisher"
        }
        
        Basic lands can have quantity > 1, all other cards must have quantity of 1.
        DOUBLE-CHECK your response to make sure it contains EXACTLY 99 cards total.
        COUNT all quantities to ensure the TOTAL is EXACTLY 99 cards.
      `;
      
      // Call OpenAI API with fallback models
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      setProgress(35);
      
      const models = ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'];
      let response;
      let lastError;
      
      for (const model of models) {
        try {
          console.log(`Trying OpenAI model: ${model}`);
          response = await fetch(API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getOpenAIApiKey()}`
            },
            body: JSON.stringify({
              model: model,
              messages: [
                { 
                  role: 'system', 
                  content: 'You are a Magic: The Gathering deck building expert specializing in optimized Commander decks. You have deep knowledge of all MTG cards, their synergies, and competitive deck construction principles. Your most important job is to create EXACTLY 99 cards for a Commander deck.'
                },
                { 
                  role: 'user', 
                  content: prompt 
                }
              ],
              temperature: 0.7,
              max_tokens: 4000
            })
          });
          
          if (response.ok) {
            console.log(`Successfully using model: ${model}`);
            break;
          } else {
            const errorData = await response.json();
            console.warn(`Model ${model} failed:`, errorData);
            lastError = errorData;
          }
        } catch (error) {
          console.warn(`Model ${model} failed with error:`, error);
          lastError = error;
        }
      }
      
      // Check if we got a successful response
      if (!response || !response.ok) {
        console.error('All OpenAI models failed. Last error:', lastError);
        throw new Error(`OpenAI API error: ${lastError?.error?.message || lastError?.message || 'All models failed'}`);
      }
      
      const data = await response.json();
      console.log('OpenAI API Response:', data); // Debug logging
      setProgress(60);
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        // Parse the message content as JSON and add cards to deck
        const content = data.choices[0].message.content;
        
        // Extract JSON from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Could not parse card list from response');
        }
        
        let cardList;
        try {
          cardList = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          throw new Error('Failed to parse card data');
        }
        
        // Verify card count
        const totalCards = cardList.reduce((sum, card) => sum + (card.quantity || 1), 0);
        console.log(`AI suggested ${cardList.length} unique cards (${totalCards} total with quantities)`);
        
        if (totalCards !== 99) {
          console.warn(`Card count mismatch: AI suggested ${totalCards} cards instead of 99`);
          
          // Adjust the card list to have exactly 99 cards
          if (totalCards > 99) {
            cardList = trimCardList(cardList, 99);
          } else if (totalCards < 99) {
            cardList = addBasicLands(cardList, 99 - totalCards, commander.color_identity);
          }
          
          // Double-check our fix worked
          const adjustedCount = cardList.reduce((sum, card) => sum + (card.quantity || 1), 0);
          console.log(`Adjusted card count: ${adjustedCount}`);
          
          if (adjustedCount !== 99) {
            console.error(`Failed to adjust card count to 99, got ${adjustedCount}`);
            // As a last resort, forcibly add or remove cards
            if (adjustedCount < 99) {
              const forceBasicLands = generateBasicLands(commander.color_identity, 99 - adjustedCount);
              cardList = [...cardList, ...forceBasicLands];
            } else if (adjustedCount > 99) {
              // Sort by least important first
              cardList.sort((a, b) => {
                if (a.category.toLowerCase().includes('land') && !b.category.toLowerCase().includes('land')) 
                  return 1;
                if (!a.category.toLowerCase().includes('land') && b.category.toLowerCase().includes('land')) 
                  return -1;
                return 0;
              });
              // Trim to exactly 99 cards
              let currentTotal = 0;
              cardList = cardList.filter(card => {
                const qty = card.quantity || 1;
                if (currentTotal + qty <= 99) {
                  currentTotal += qty;
                  return true;
                }
                return false;
              });
            }
          }
        }
        
        // Validate color identity before adding cards to deck
        console.log('Validating color identity for AI-generated deck...');
        const validationResult = validateColorIdentity(commander, cardList);
        
        if (!validationResult.valid && validationResult.violations.length > 0) {
          console.warn(`Found ${validationResult.violations.length} color identity violations:`, validationResult.violations);
          
          // Filter out violating cards
          const validCards = cardList.filter(card => {
            const cardColors = card.color_identity || [];
            const commanderColors = commander.color_identity || [];
            return cardColors.every(color => commanderColors.includes(color));
          });
          
          const removedCount = cardList.length - validCards.length;
          if (removedCount > 0) {
            console.log(`Removed ${removedCount} cards due to color identity violations`);
            cardList = validCards;
            
            // Recalculate total and add basic lands if needed
            const newTotal = cardList.reduce((sum, card) => sum + (card.quantity || 1), 0);
            if (newTotal < 99) {
              const shortfall = 99 - newTotal;
              console.log(`Adding ${shortfall} basic lands to compensate for removed cards`);
              cardList = addBasicLands(cardList, shortfall, commander.color_identity);
            }
          }
        } else {
          console.log('All AI-suggested cards pass color identity validation');
        }
        
        // Fetch actual card data and add to deck
        setProgress(70);
        await addCardsFromList(cardList, setProgress, deckStyle);
        
        // Make a final check after all cards are added
        setTimeout(() => {
          const finalCardCount = getCurrentNonCommanderCardCount(); // Use ref-based count
          if (finalCardCount !== 99) {
            console.warn(`After processing, ended up with ${finalCardCount} cards instead of 99 (expected 99).`);
            // setError might be too strong if DeckContext cap worked, but AI suggested wrong number initially.
            // setError(`Generated ${finalCardCount} cards instead of 99. DeckContext cap might have intervened.`);
          } else {
            console.log("Successfully created a 99-card Commander deck (as per current context count)!");
          }
        }, 1000); // Give time for state to update
        
        return true; // Successful completion
      } else {
        console.error('Unexpected API response structure:', data);
        throw new Error(`Invalid response from API. Expected choices array but got: ${JSON.stringify(data).substring(0, 200)}...`);
      }
    } catch (error) {
      console.error('Error building deck:', error);
      setError(error.message || 'Failed to build deck');
      return false;
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  /**
   * Remove excess cards to bring the deck down to the target count
   * @param {number} excessCount - Number of cards to remove
   */
  const removeExcessCards = async (excessCount, currentActualCards) => {
    // Get current cards (excluding commander)
    const cardsToRemoveFrom = [...currentActualCards]; // Use passed cards
    let remainingToRemove = excessCount;
    
    if (cardsToRemoveFrom.length === 0) { // Changed from currentCards.length <=1 as commander is not in this list
      console.warn("No cards to remove for removeExcessCards.");
      return;
    }
    
    // First try to find non-lands to remove
    const nonLands = cardsToRemoveFrom.filter(card => 
      !card.type_line?.toLowerCase().includes('land') && 
      card.id !== commander.id // commander should not be in currentActualCards anyway if it's just the 99
    );
    
    // Then lands as fallback
    const lands = cardsToRemoveFrom.filter(card => 
      card.type_line?.toLowerCase().includes('land') && 
      !card.type_line?.toLowerCase().includes('legendary')
    );
    
    // Remove cards
    if (nonLands.length >= remainingToRemove) {
      // Remove non-lands first
      for (let i = 0; i < remainingToRemove; i++) {
        if (i < nonLands.length) {
          if (nonLands[i].id !== commander?.id) { // commander might be null
            await removeSingleCard(nonLands[i].id);
          }
        }
      }
    } else {
      // Remove all non-lands first
      for (let i = 0; i < nonLands.length; i++) {
        if (nonLands[i].id !== commander?.id) {
          await removeSingleCard(nonLands[i].id);
        }
      }
      
      // Then remove lands to reach the target
      remainingToRemove -= nonLands.length;
      for (let i = 0; i < remainingToRemove; i++) {
        if (i < lands.length) {
          await removeSingleCard(lands[i].id);
        }
      }
    }
  };
  
  /**
   * Helper function to remove a card from the deck
   * @param {string} cardId - Card ID to remove
   */
  const removeSingleCard = async (cardId) => {
    return new Promise(resolve => {
      try {
        removeCard(cardId); // Uses removeCard from deckContext destructuring
        resolve();
      } catch (error) {
        console.error('Error removing card:', error);
        resolve(); // Continue despite errors
      }
    });
  };
  
  /**
   * Trim a card list to the target count
   * @param {Array} cardList - List of cards
   * @param {number} targetCount - Target number of cards
   * @returns {Array} - Trimmed card list
   */
  const trimCardList = (cardList, targetCount) => {
    let currentTotal = cardList.reduce((sum, card) => sum + (card.quantity || 1), 0);
    if (currentTotal <= targetCount) return cardList;
    
    // First, separate cards into categories
    const lands = cardList.filter(card => card.category.toLowerCase().includes('land'));
    const nonLands = cardList.filter(card => !card.category.toLowerCase().includes('land'));
    
    // Sort non-lands by some priority (assuming excess cards should be removed from the bottom)
    nonLands.sort((a, b) => {
      // Priority ranking of categories (higher = more important)
      const categoryRank = {
        'ramp': 5,
        'card draw': 5,
        'removal': 4,
        'protection': 4,
        'strategy': 3,
        'utility': 2,
        'finisher': 2,
        'board wipe': 1
      };
      
      // Get rank (default to 0 if category not found)
      const rankA = Object.entries(categoryRank).find(([key]) => a.category.toLowerCase().includes(key))?.[1] || 0;
      const rankB = Object.entries(categoryRank).find(([key]) => b.category.toLowerCase().includes(key))?.[1] || 0;
      
      return rankB - rankA; // Higher priority cards first
    });
    
    // Start with all lands and add non-lands until we reach the target
    let result = [...lands];
    currentTotal = result.reduce((sum, card) => sum + (card.quantity || 1), 0);
    
    // Add non-lands until we reach the target
    for (const card of nonLands) {
      const cardCount = card.quantity || 1;
      if (currentTotal + cardCount <= targetCount) {
        result.push(card);
        currentTotal += cardCount;
      }
      
      if (currentTotal >= targetCount) break;
    }
    
    // If we still don't have enough cards, adjust basic land quantities
    if (currentTotal < targetCount) {
      const basicLands = result.filter(card => card.name.match(/^(Plains|Island|Swamp|Mountain|Forest|Wastes)$/));
      
      if (basicLands.length > 0) {
        // Distribute the remaining cards among basic lands
        const remaining = targetCount - currentTotal;
        const addPerLand = Math.floor(remaining / basicLands.length);
        let leftover = remaining % basicLands.length;
        
        for (const land of basicLands) {
          const extra = leftover > 0 ? 1 : 0;
          if (leftover > 0) leftover--;
          
          land.quantity = (land.quantity || 1) + addPerLand + extra;
        }
      }
    }
    
    return result;
  };
  
  /**
   * Add basic lands to a card list to reach the target count
   * @param {Array} cardList - List of cards
   * @param {number} count - Number of lands to add
   * @param {Array} colorIdentity - Color identity array
   * @returns {Array} - Updated card list
   */
  const addBasicLands = (cardList, count, colorIdentity) => {
    if (count <= 0) return cardList;

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
      .map(([name]) => ({
        name,
        type_line: `Basic Land — ${name}`,
        category: 'Lands',
        quantity: 1
      }));

    if (availableLands.length === 0) {
      // If no colors match (colorless commander), just use Plains
      availableLands.push({
        name: 'Plains',
        type_line: 'Basic Land — Plains',
        category: 'Lands',
        quantity: 1
      });
    }

    // Calculate distribution
    const landsPerType = Math.floor(count / availableLands.length);
    const remainder = count % availableLands.length;

    // Add lands to the list
    const updatedList = [...cardList];
    for (let i = 0; i < availableLands.length; i++) {
      const numToAdd = i === 0 ? 
        landsPerType + remainder : // Add remainder to first land type
        landsPerType;
      
      for (let j = 0; j < numToAdd; j++) {
        updatedList.push({ ...availableLands[i] });
      }
    }

    return updatedList;
  };
  
  /**
   * Analyze a commander to understand its strategy and synergies
   * @param {Object} commander - Commander card object
   * @param {string} deckStyle - Desired deck style
   * @returns {string} - Analysis of the commander
   */
  const analyzeCommander = async (commander, deckStyle) => {
    try {
      // Get more details about the commander from Scryfall
      const response = await fetch(`https://api.scryfall.com/cards/${commander.id}`);
      const data = await response.json();
      
      // Call OpenAI for an analysis
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      const aiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIApiKey()}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { 
              role: 'system', 
              content: 'You are a Magic: The Gathering deck building expert specializing in commander strategy analysis.'
            },
            { 
              role: 'user', 
              content: `Analyze this commander for a ${deckStyle} deck style:
                Name: ${commander.name}
                Type: ${commander.type_line || ''}
                Text: ${commander.oracle_text || ''}
                Colors: ${commander.colors?.join('') || ''}
                
                Provide a concise analysis of key strategies, synergies, and card types that work well with this commander.
                Keep your response under 150 words and focus on specific card types and mechanics that synergize with the commander.`
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });
      
      const aiData = await aiResponse.json();
      if (aiData.choices && aiData.choices[0] && aiData.choices[0].message) {
        return aiData.choices[0].message.content;
      } else {
        return "Standard commander deck focused on the commander's color identity and abilities.";
      }
    } catch (error) {
      console.error('Error analyzing commander:', error);
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

  /**
   * Add cards from a list to the deck by fetching their data
   * @param {Array} cardList - List of cards from AI response
   * @param {Function} progressCallback - Callback for updating progress
   * @param {string} deckStyle - The deck style/archetype being built
   */
  const addCardsFromList = async (cardList, progressCallback, deckStyle) => {
    resetDeckExceptCommander();
    
    // Make sure we're not adding too many cards
    if (cardList.length > 99) {
      console.warn(`Limiting card list from ${cardList.length} to 99 cards`);
      cardList = cardList.slice(0, 99);
    }
    
    // Get the current archetype rules
    const archetypeRules = getArchetypeRules(deckStyle);
    
    // Check for game changers
    const gameChangers = identifyGameChangers(cardList);
    if (gameChangers.length > archetypeRules.maxGameChangers) {
      console.warn(`Too many game changers (${gameChangers.length}/${archetypeRules.maxGameChangers} max)`);
      cardList = cardList.filter(card => !gameChangers.slice(archetypeRules.maxGameChangers).some(gc => gc.name === card.name));
    }

    // Validate budget constraints before adding cards
    const budgetValidation = validateBudgetConstraints(cardList, archetypeRules.maxBudget);
    if (!budgetValidation.valid) {
      console.warn('Budget validation failed:', budgetValidation.violations);
      if (archetypeRules.maxBudget !== Infinity) {
        cardList = await replaceBudgetViolations(cardList, budgetValidation, archetypeRules.maxBudget);
      }
    }

    // Enforce bracket requirements
    cardList = await enforceBracketRequirements(cardList, archetypeRules.targetBracket);

    // Validate card distribution
    const distributionValidation = validateCardDistribution(cardList, archetypeRules.cardDistribution);
    if (!distributionValidation.valid) {
      console.warn('Distribution validation failed:', distributionValidation.violations);
      cardList = await fixDistributionViolations(cardList, distributionValidation, archetypeRules);
    }

    // Track how many cards we've added
    let addedCardCount = 0;
    const targetCardCount = 99;
    
    // Process cards in smaller batches to avoid rate limits
    const batchSize = 20;
    for (let i = 0; i < cardList.length && addedCardCount < targetCardCount; i += batchSize) {
      const batch = cardList.slice(i, Math.min(i + batchSize, cardList.length));
      
      try {
        // Get card data from Scryfall
        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifiers: batch.map(card => ({ name: card.name }))
          })
        });

        if (!response.ok) {
          throw new Error(`Scryfall API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.data) {
          // Create a map of card name to card data
          const cardMap = new Map(data.data.map(card => [card.name, card]));
          
          // Add each card to the deck
          for (const cardEntry of batch) {
            if (addedCardCount >= targetCardCount) break;
            
            const cardData = cardMap.get(cardEntry.name);
            if (cardData) {
              try {
                // Store card category if available
                if (cardEntry.category) {
                  cardData.ai_category = cardEntry.category;
                }
                
                addCard(cardData);
                addedCardCount++;
              } catch (error) {
                if (error.message?.includes('quota exceeded')) {
                  console.warn('Cache quota exceeded, continuing without caching');
                  addCard(cardData, false);
                  addedCardCount++;
                } else {
                  throw error;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error in batch processing:', error);
      }
      
      // Update progress
      if (progressCallback) {
        progressCallback(Math.min(Math.round((addedCardCount / targetCardCount) * 100), 99));
      }
      
      // Add a small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // If we don't have enough cards, add basic lands
    const finalCount = getCurrentNonCommanderCardCount();
    if (finalCount < 99) {
      const missingCount = 99 - finalCount;
      console.log(`Adding ${missingCount} basic lands to reach 99 cards`);
      
      try {
        const basicLands = await fetchBasicLands(commander.color_identity, missingCount);
        for (const land of basicLands) {
          if (getCurrentNonCommanderCardCount() < 99) {
            try {
              addCard(land);
            } catch (error) {
              if (error.message?.includes('quota exceeded')) {
                addCard(land, false);
              } else {
                throw error;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error adding basic lands:', error);
      }
    }

    // Final verification
    const actualFinalCount = getCurrentNonCommanderCardCount();
    if (actualFinalCount !== 99) {
      console.warn(`Final count is ${actualFinalCount}, expected 99. Review deck building logic.`);
      
      // One last attempt to fix the count
      if (actualFinalCount < 99) {
        const lastResortLands = generateBasicLands(commander.color_identity, 99 - actualFinalCount);
        for (const land of lastResortLands) {
          if (getCurrentNonCommanderCardCount() < 99) {
            try {
              addCard(land, false); // Skip caching for these
            } catch (error) {
              console.error('Error adding last resort land:', error);
            }
          }
        }
      }
    }

    return getCurrentNonCommanderCardCount() === 99;
  };
  
  /**
   * Replace expensive cards with budget alternatives
   * @param {Array} cardList - Original card list
   * @param {Object} budgetValidation - Budget validation results
   * @param {number} maxBudget - Maximum allowed budget
   * @returns {Array} - Updated card list with budget alternatives
   */
  const replaceBudgetViolations = async (cardList, budgetValidation, maxBudget) => {
    const expensiveCards = budgetValidation.violations
      .find(v => v.type === 'expensive_cards')?.cards || [];

    for (const expensiveCard of expensiveCards) {
      try {
        // Search for budget alternatives with similar functionality
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(`f:commander usd<${maxBudget * 0.1} ${expensiveCard.name}`)}}`);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          // Replace the expensive card with the first budget alternative
          const index = cardList.findIndex(card => card.name === expensiveCard.name);
          if (index !== -1) {
            cardList[index] = {
              ...data.data[0],
              category: cardList[index].category,
              quantity: 1
            };
          }
        }
      } catch (error) {
        console.error(`Error finding budget alternative for ${expensiveCard.name}:`, error);
      }
    }

    return cardList;
  };

  // Clear paywall blocked state
  const clearPaywallBlocked = () => {
    setPaywallBlocked(false);
    setError(null);
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
  };
}; 