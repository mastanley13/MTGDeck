import { useState, useEffect, useRef } from 'react';
import { useDeck } from '../context/DeckContext';
import { getOpenAIApiKey } from '../utils/openaiAPI';

/**
 * Hook for automatically building complete decks based on a commander
 */
export const useAutoDeckBuilder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
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
   * Build a complete competitive deck based on the selected commander
   * @param {string} deckStyle - The desired deck style/strategy
   */
  const buildCompleteDeck = async (deckStyle = 'competitive') => {
    if (!commander) {
      setError('Please select a commander first');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setProgress(10);
      
      // First clear the deck except for the commander
      resetDeckExceptCommander();
      
      // Analyze commander to better understand its strategy
      const commanderAnalysis = await analyzeCommander(commander, deckStyle);
      setProgress(25);

      // Create a prompt for the AI to build a deck
      const prompt = `
        Create a COMMANDER deck for ${commander.name} with EXACTLY 99 cards (NOT including the commander).
        
        Commander: ${commander.name} (${commander.type_line || ''})
        Commander analysis: ${commanderAnalysis}
        
        Color identity: ${commander.color_identity?.join('') || ''}
        Deck style: ${deckStyle}
        
        IMPORTANT RULES:
        1. The deck MUST contain EXACTLY 99 cards TOTAL. DO NOT include the commander in this count.
        2. All cards must be within the commander's color identity (${commander.color_identity?.join('') || ''})
        3. Follow Commander format rules (singleton, color identity restrictions)
        4. Ensure a proper mana curve with adequate low-cost cards
        
        Card distribution:
        - 33-38 lands (including non-basics appropriate for the color identity)
        - 10-12 ramp spells (mana rocks, dorks, land search)
        - 10-12 card draw/advantage sources
        - 8-10 targeted removal spells
        - 3-5 board wipes/mass removal
        - 5-8 protection/interaction cards
        - 25-30 cards that directly support the commander's strategy
        
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
      
      // Call OpenAI API
      const API_URL = 'https://api.openai.com/v1/chat/completions';
      setProgress(35);
      const response = await fetch(API_URL, {
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
      
      const data = await response.json();
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
        
        // Fetch actual card data and add to deck
        setProgress(70);
        await addCardsFromList(cardList, setProgress);
        
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
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error building deck:', error);
      setError(error.message || 'Failed to build deck');
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
    
    const basicLands = generateBasicLands(colorIdentity, count);
    return [...cardList, ...basicLands];
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
    const lands = [];
    const colors = colorIdentity || [];
    
    if (colors.length === 0) {
      // Colorless commander - just add Wastes
      try {
        const response = await fetch('https://api.scryfall.com/cards/named?exact=Wastes');
        const land = await response.json();
        for (let i = 0; i < count; i++) {
          lands.push(land);
        }
      } catch (error) {
        console.error('Error fetching Wastes:', error);
      }
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
    
    // Fetch and add lands for each color
    for (const color of colors) {
      const landName = colorToLand[color];
      const landCount = landsPerColor + (remaining > 0 ? 1 : 0);
      if (remaining > 0) remaining--;
      
      if (landName) {
        try {
          const response = await fetch(`https://api.scryfall.com/cards/named?exact=${landName}`);
          const land = await response.json();
          for (let i = 0; i < landCount; i++) {
            lands.push(land);
          }
        } catch (error) {
          console.error(`Error fetching ${landName}:`, error);
        }
      }
    }
    
    return lands;
  };
  
  /**
   * Add cards from a list to the deck by fetching their data
   * @param {Array} cardList - List of cards from AI response
   * @param {Function} progressCallback - Callback for updating progress
   */
  const addCardsFromList = async (cardList, progressCallback) => {
    // Reset the deck first to ensure we start fresh (keeping only the commander)
    resetDeckExceptCommander(); // deckContext.resetDeckExceptCommander
    
    // Make sure we're not adding too many cards
    if (cardList.length > 99) {
      console.warn(`Limiting card list from ${cardList.length} to 99 cards`);
      cardList = cardList.slice(0, 99);
    }
    
    // Track how many cards we've added
    let addedCardCount = 0;
    const targetCardCount = 99;
  
    // Scryfall API batch limit is 75, so we'll process in smaller batches
    const batchSize = 50;
    const batches = [];
    
    // Sort cards by category to prioritize important cards first
    cardList.sort((a, b) => {
      // Priority ranking of categories (higher = more important)
      const categoryRank = {
        'land': 5,
        'ramp': 4, 
        'card draw': 4,
        'removal': 3,
        'board wipe': 3,
        'protection': 3,
        'strategy': 2,
        'utility': 1,
        'finisher': 1
      };
      
      // Get rank (default to 0 if category not found)
      const rankA = Object.entries(categoryRank).find(([key]) => 
        a.category.toLowerCase().includes(key))?.[1] || 0;
      const rankB = Object.entries(categoryRank).find(([key]) => 
        b.category.toLowerCase().includes(key))?.[1] || 0;
      
      return rankB - rankA; // Higher priority cards first
    });
    
    // Group into batches
    for (let i = 0; i < cardList.length; i += batchSize) {
      batches.push(cardList.slice(i, i + batchSize));
    }
    
    // Progress tracking
    const progressIncrement = 30 / batches.length; // 30% of total progress (from 70% to 100%)
    let currentProgress = 70;
    
    // Process each batch
    for (const batch of batches) {
      // Stop if we've already added 99 cards
      if (addedCardCount >= targetCardCount) {
        console.log(`Already added ${addedCardCount} cards, stopping`);
        break;
      }
      
      const uniqueCardNames = [...new Set(batch.map(card => card.name))];
      
      // Get card data from Scryfall
      const identifierList = uniqueCardNames.map(name => ({ name }));
      
      try {
        // Using Scryfall's collection endpoint
        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            identifiers: identifierList
          })
        });
        
        const data = await response.json();
        
        if (data.data) {
          // Create a map of card name to card data
          const cardMap = new Map(data.data.map(card => [card.name, card]));
          
          // Add each card to the deck with its quantity
          for (const cardEntry of batch) {
            // Check if we're about to exceed 99 cards
            if (addedCardCount >= targetCardCount) {
              console.log(`Reached ${addedCardCount} cards, stopping`);
              break;
            }
            
            const cardData = cardMap.get(cardEntry.name);
            if (cardData) {
              // Store card category if available
              if (cardEntry.category) {
                cardData.ai_category = cardEntry.category;
              }
              
              // For basic lands, add the quantity specified
              if (cardData.type_line?.includes('Basic Land')) {
                const landQuantity = Math.min(cardEntry.quantity || 1, targetCardCount - addedCardCount);
                for (let i = 0; i < landQuantity; i++) {
                  if (addedCardCount < targetCardCount) {
                    addCard(cardData);
                    addedCardCount++;
                  }
                }
              } else {
                // For non-basics, just add one card
                if (addedCardCount < targetCardCount) {
                  addCard(cardData);
                  addedCardCount++;
                }
              }
            } else {
              console.warn(`Card not found: ${cardEntry.name}`);
              // Try a fuzzy search as fallback
              const added = await tryFuzzyCardSearch(cardEntry, targetCardCount - addedCardCount);
              if (added) addedCardCount++;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
      }
      
      // Update progress
      currentProgress += progressIncrement;
      progressCallback(Math.min(Math.round(currentProgress), 99));
      
      // Add a small delay between batches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Final card count after adding (from local batch processing): ${addedCardCount}`);
    
    // Verify we have exactly 99 cards (plus commander) using fresh count from ref
    const actualFinalCount = getCurrentNonCommanderCardCount();
    
    if (actualFinalCount !== 99) {
      console.warn(`Final verification: AI process resulted in ${actualFinalCount} cards (expected 99). DeckContext cap is primary. Attempting local adjustment if needed.`);
      
      if (actualFinalCount < 99) {
        const missingCount = 99 - actualFinalCount;
        console.log(`Adjusting: Adding ${missingCount} basic lands to reach 99`);
        const additionalLands = await fetchBasicLands(commander.color_identity, missingCount); // commander from deckContext
        for (const land of additionalLands) {
          if (getCurrentNonCommanderCardCount() < 99) { // Re-check with ref before each add
            addCard(land); // addCard from deckContext
          } else {
            console.log("Reached 99 cards during land padding, stopping.");
            break;
          }
        }
      } else if (actualFinalCount > 99) {
        // This case should ideally not be hit if DeckContext cap works during additions,
        // but could occur if Scryfall returned more items than expected for a single name somehow
        // or if resetDeckExceptCommander was somehow bypassed and deck started non-empty.
        const excessCount = actualFinalCount - 99;
        console.log(`Adjusting: Removing ${excessCount} excess cards to reach 99`);
        await removeExcessCards(excessCount, currentDeckCardsRef.current); // Pass the current cards from ref
      }
    }

    // One last check of the count from the ref
    const veryFinalCount = getCurrentNonCommanderCardCount();
    if (veryFinalCount !== 99) {
        console.error(`Post-adjustment count is ${veryFinalCount}, expected 99. Review AI logic and DeckContext cap.`);
        setError(`Deck ended with ${veryFinalCount} cards. Please verify.`);
    } else {
        console.log("Deck adjustment completed, final count is 99.");
    }
  };
  
  /**
   * Try to find a card with fuzzy search if exact match fails
   * @param {Object} cardEntry - Card entry from the AI
   * @param {number} remainingSlots - Number of card slots remaining
   * @returns {boolean} - Whether a card was added
   */
  const tryFuzzyCardSearch = async (cardEntry, remainingSlots) => {
    if (remainingSlots <= 0) return false;
    
    try {
      const encodedName = encodeURIComponent(cardEntry.name);
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodedName}`);
      
      if (response.ok) {
        const cardData = await response.json();
        
        // Store card category if available
        if (cardEntry.category) {
          cardData.ai_category = cardEntry.category;
        }
        
        // For basic lands, add the quantity specified (limited by remaining slots)
        if (cardData.type_line?.includes('Basic Land')) {
          const landQuantity = Math.min(cardEntry.quantity || 1, remainingSlots);
          for (let i = 0; i < landQuantity; i++) {
            addCard(cardData);
          }
          return true;
        } else {
          // For non-basics, just add one card
          addCard(cardData);
          return true;
        }
      }
    } catch (error) {
      console.error(`Failed fuzzy search for: ${cardEntry.name}`, error);
    }
    
    return false;
  };

  return {
    buildCompleteDeck,
    isLoading,
    error,
    progress
  };
}; 