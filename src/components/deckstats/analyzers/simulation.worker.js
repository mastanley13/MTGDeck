// mtg-deckbuilder/src/components/deckstats/analyzers/simulation.worker.js
import * as Comlink from 'comlink';

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array<any>} array Array to shuffle.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Simulates drawing an opening hand, including mulligans (London mulligan rule).
 * @param {Object[]} deck - The deck list (array of card objects).
 * @param {number} mulligansToTake - How many times the player has mulliganed (0 for initial hand).
 * @returns {Object[]} The final hand after mulligans.
 */
function drawHand(deck, mulligansToTake) {
  const handSize = 7;
  let currentHand = [];
  let tempDeck = [...deck]; // Create a mutable copy for shuffling

  // Shuffle the deck
  shuffleArray(tempDeck);

  // Draw initial 7 cards
  currentHand = tempDeck.slice(0, handSize);

  // Apply London Mulligan: for each mulligan, draw 7, then put N cards on the bottom.
  // For simulation purposes, we don't need to choose *which* N cards to put back yet.
  // We are interested in the composition of the N cards kept.
  // So, the size of the hand effectively decreases by mulligansToTake for analysis.
  const finalHandSize = handSize - mulligansToTake;
  return currentHand.slice(0, finalHandSize);
}

/**
 * Analyzes a given hand for desired properties (e.g., land count).
 * @param {Object[]} hand - The hand to analyze.
 * @returns {Object} Analysis results (e.g., { landCount: 3 }).
 */
function analyzeHand(hand) {
  let landCount = 0;
  hand.forEach(card => {
    if (card.type_line && card.type_line.toLowerCase().includes('land')) {
      landCount++;
    }
  });
  return { landCount };
}

const simulationAPI = {
  /**
   * Runs a Monte Carlo simulation for mulligans.
   * @param {Object[]} deckCards - The list of cards in the deck.
   * @param {number} numSimulations - Number of simulations to run.
   * @param {number} targetLandCount - Desired minimum number of lands.
   * @returns {Promise<Object>} Simulation results.
   */
  runMulliganSimulation: async (deckCards, numSimulations = 10000, targetLandCount = 2) => {
    if (!deckCards || deckCards.length === 0) {
      return {
        error: 'Deck is empty. Cannot run simulation.',
        results: null,
      };
    }
    
    // Expand deck based on quantity
    const fullDeck = deckCards.reduce((acc, card) => {
        const qty = card.quantity || 1;
        for (let i = 0; i < qty; i++) {
            acc.push(card); // Push the card object itself, not just its name or ID
        }
        return acc;
    }, []);

    if (fullDeck.length < 7) {
        return {
            error: `Deck has only ${fullDeck.length} cards. Need at least 7 for an opening hand.`,
            results: null,
        };
    }

    let successfulHands = 0; // Hands meeting the criteria (e.g., >= targetLandCount)
    let landCountDistribution = {}; // {0: count, 1: count, ... 7: count}
    for(let i = 0; i <=7; i++) landCountDistribution[i] = 0;

    // Simulate for a 7-card hand (no mulligans for this initial MVP)
    // Later, this will loop through mulligan decisions.
    for (let i = 0; i < numSimulations; i++) {
      const hand = drawHand(fullDeck, 0); // 0 mulligans taken for initial 7 cards
      const analysis = analyzeHand(hand);
      
      landCountDistribution[analysis.landCount] = (landCountDistribution[analysis.landCount] || 0) + 1;

      if (analysis.landCount >= targetLandCount) {
        successfulHands++;
      }
    }

    const successRate = (successfulHands / numSimulations) * 100;
    const landProbabilities = {};
    for(let lands = 0; lands <=7; lands++){
        landProbabilities[lands] = ((landCountDistribution[lands] || 0) / numSimulations) * 100;
    }

    return {
      successRate: successRate.toFixed(2),
      targetLandCount,
      numSimulations,
      landCountDistribution, // Raw counts for each number of lands
      landProbabilities, // Percentage for each number of lands
      error: null,
    };
  }
};

Comlink.expose(simulationAPI);
console.log('simulation.worker.js loaded and API exposed.'); 