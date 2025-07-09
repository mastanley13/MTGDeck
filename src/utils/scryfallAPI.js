import axios from 'axios';

// Base URL for Scryfall API
const SCRYFALL_API_BASE_URL = 'https://api.scryfall.com';

// Polyfill for setImmediate if not available
const setImmediatePolyfill = typeof setImmediate !== 'undefined' ? setImmediate : (fn) => setTimeout(fn, 0);

// Rate limiting implementation - 100 requests per 2 seconds (50 per second)
const rateLimiter = {
  queue: [],
  processing: false,
  lastRequestTime: 0,
  minDelay: 20, // 20ms between requests (50 requests per second)
  requestsInLastWindow: 0,
  lastWindowStart: 0,
  maxRequestsPerWindow: 100, // 100 requests
  windowDuration: 2000, // 2 seconds

  async process() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.lastWindowStart >= this.windowDuration) {
      this.requestsInLastWindow = 0;
      this.lastWindowStart = now;
    }
    
    // If we've hit the per-window limit, wait until the next window
    if (this.requestsInLastWindow >= this.maxRequestsPerWindow) {
      const waitTime = this.windowDuration - (now - this.lastWindowStart);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestsInLastWindow = 0;
        this.lastWindowStart = Date.now();
      }
    }
    
    // Calculate delay needed for minimum spacing
    const timeElapsed = now - this.lastRequestTime;
    const delay = Math.max(0, this.minDelay - timeElapsed);
    
    // Wait if needed
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Process the next request
    const nextRequest = this.queue.shift();
    try {
      this.lastRequestTime = Date.now();
      this.requestsInLastWindow++;
      const result = await nextRequest.fn();
      nextRequest.resolve(result);
    } catch (error) {
      nextRequest.reject(error);
    } finally {
      this.processing = false;
      setImmediatePolyfill(() => this.process());
    }
  },
  
  enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }
};

/**
 * Search for cards based on query parameters
 * @param {string} query - Search query
 * @param {Object} options - Additional search options
 * @returns {Promise} Promise that resolves to search results
 */
export const searchCards = async (query, options = {}) => {
  try {
    const params = {
      q: query,
      ...options
    };
    
    const response = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/search`, { params });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return { data: [], total_cards: 0 };
    }
    throw error;
  }
};

/**
 * Fetch a specific card by its ID with rate limiting and retry logic
 * @param {string} id - Card ID
 * @returns {Promise} Promise that resolves to card data
 */
export const getCardById = async (id) => {
  // Use rate limiter to prevent API rate limit issues
  return rateLimiter.enqueue(async () => {
    try {
      const response = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/${id}`, {
        timeout: 10000 // 10 second timeout
      });
      return response.data;
    } catch (error) {
      // Handle specific error types
      if (error.code === 'ERR_NETWORK') {
        console.warn(`Network error fetching card ${id} - retrying once`);
        
        // Wait a bit longer and retry once
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const retryResponse = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/${id}`, {
            timeout: 15000 // Longer timeout for retry
          });
          return retryResponse.data;
        } catch (retryError) {
          console.error(`Failed to fetch card ${id} after retry:`, retryError.message);
          throw new Error(`Failed to fetch card data after retry: ${retryError.message}`);
        }
      }
      
      // Handle rate limiting (429)
      if (error.response && error.response.status === 429) {
        console.warn('Rate limited by Scryfall API, waiting and retrying');
        // Wait longer for rate limit reset
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const retryResponse = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/${id}`);
        return retryResponse.data;
      }
      
      // Other errors
      console.error(`Error fetching card ${id} from Scryfall:`, error.message);
      throw error;
    }
  });
};

/**
 * Search for a card by its exact name
 * @param {string} name - Exact card name
 * @returns {Promise} Promise that resolves to card data
 */
export const searchCardByName = async (name) => {
  try {
    // First try the named endpoint for exact matches
    const response = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/named`, { 
      params: { fuzzy: name } 
    });
    
    // If found, wrap it in a format similar to search results
    return { 
      data: [response.data],
      total_cards: 1,
      has_more: false
    };
  } catch (error) {
    // If not found by exact name, try enhanced fuzzy search
    if (error.response && (error.response.status === 404 || error.response.status === 400)) {
      return await enhancedFuzzySearch(name);
    }
    throw error;
  }
};

/**
 * Enhanced fuzzy search for misspelled card names
 * @param {string} name - Card name that might be misspelled
 * @returns {Promise} Promise that resolves to card data or empty result
 */
export const enhancedFuzzySearch = async (name) => {
  try {
    // Try different search strategies in order of preference
    const searchStrategies = [
      // 1. Simple name search without quotes (best for fuzzy matching)
      () => searchCards(name),
      
      // 2. Search by first word only (for partial matches)
      () => {
        const firstWord = name.split(' ')[0];
        return firstWord.length >= 3 ? searchCards(firstWord) : null;
      },
      
      // 3. Search with common misspelling patterns corrected
      () => {
        const corrected = correctCommonMisspellings(name);
        return corrected !== name ? searchCards(corrected) : null;
      },
      
      // 4. Search with character variations (e -> a, s -> z, etc.)
      () => {
        const variations = generateSpellingVariations(name);
        return variations.length > 0 ? searchCards(variations[0]) : null;
      }
    ];

    for (const strategy of searchStrategies) {
      try {
        const result = await strategy();
        if (result && result.data && result.data.length > 0) {
          // Find the best match using string similarity
          const bestMatch = findBestMatch(name, result.data);
          if (bestMatch) {
            return {
              data: [bestMatch],
              total_cards: 1,
              has_more: false,
              suggestion: bestMatch.name !== name ? `Did you mean "${bestMatch.name}"?` : null
            };
          }
        }
      } catch (strategyError) {
        // Continue to next strategy
        continue;
      }
    }

    // If all strategies fail, return empty result
    return { data: [], total_cards: 0, has_more: false };
  } catch (error) {
    console.error('Enhanced fuzzy search failed:', error);
    return { data: [], total_cards: 0, has_more: false };
  }
};

/**
 * Correct common misspellings in card names
 * @param {string} name - Original card name
 * @returns {string} Corrected card name
 */
const correctCommonMisspellings = (name) => {
  const corrections = {
    // Common letter substitutions
    'vets': 'vents',
    'comand': 'command',
    'comandeer': 'commander',
    'arcain': 'arcane',
    'felwar': 'fellwar',
    'ethereum': 'etherium',
    
    // Partial word corrections
    'steam vets': 'steam vents',
    'comand tower': 'command tower',
    'arcain signet': 'arcane signet',
    'felwar stone': 'fellwar stone',
    'ethereum sculptor': 'etherium sculptor',
    'comandeer sphere': 'commander\'s sphere',
    
    // Common typos
    'lightening': 'lightning',
    'dessert': 'desert',
    'angle': 'angel',
    'rouge': 'rogue',
    'loose': 'lose',
    'breath': 'breathe'
  };

  const lowerName = name.toLowerCase();
  
  // Check for exact matches first
  if (corrections[lowerName]) {
    return corrections[lowerName];
  }
  
  // Check for partial matches
  for (const [misspelled, correct] of Object.entries(corrections)) {
    if (lowerName.includes(misspelled)) {
      return name.replace(new RegExp(misspelled, 'gi'), correct);
    }
  }
  
  return name;
};

/**
 * Generate spelling variations for fuzzy matching
 * @param {string} name - Original name
 * @returns {Array} Array of spelling variations
 */
const generateSpellingVariations = (name) => {
  const variations = [];
  const lowerName = name.toLowerCase();
  
  // Common letter substitutions
  const substitutions = [
    ['e', 'a'], ['a', 'e'],
    ['i', 'y'], ['y', 'i'],
    ['s', 'z'], ['z', 's'],
    ['c', 'k'], ['k', 'c'],
    ['f', 'ph'], ['ph', 'f'],
    ['ou', 'ow'], ['ow', 'ou'],
    ['er', 'or'], ['or', 'er']
  ];
  
  substitutions.forEach(([from, to]) => {
    if (lowerName.includes(from)) {
      variations.push(name.replace(new RegExp(from, 'gi'), to));
    }
  });
  
  return variations.slice(0, 3); // Limit to prevent too many API calls
};

/**
 * Find the best match from search results using string similarity
 * @param {string} searchTerm - Original search term
 * @param {Array} results - Array of card results
 * @returns {Object|null} Best matching card or null
 */
const findBestMatch = (searchTerm, results) => {
  if (!results || results.length === 0) return null;
  
  let bestMatch = null;
  let bestScore = 0;
  
  const searchLower = searchTerm.toLowerCase();
  
  for (const card of results) {
    const cardNameLower = card.name.toLowerCase();
    
    // Calculate similarity score
    let score = 0;
    
    // Exact match gets highest score
    if (cardNameLower === searchLower) {
      return card;
    }
    
    // Starts with search term gets high score
    if (cardNameLower.startsWith(searchLower)) {
      score += 0.8;
    }
    
    // Contains search term gets medium score
    if (cardNameLower.includes(searchLower)) {
      score += 0.6;
    }
    
    // Calculate Levenshtein distance for fuzzy matching
    const distance = levenshteinDistance(searchLower, cardNameLower);
    const maxLength = Math.max(searchLower.length, cardNameLower.length);
    const similarity = 1 - (distance / maxLength);
    
    // If similarity is high enough, add to score
    if (similarity > 0.7) {
      score += similarity * 0.5;
    }
    
    // Prefer shorter names (more likely to be the intended card)
    if (card.name.length <= searchTerm.length + 5) {
      score += 0.1;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = card;
    }
  }
  
  // Only return match if score is above threshold
  return bestScore > 0.5 ? bestMatch : results[0]; // Fallback to first result
};

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * Search for cards that can be commanders
 * @returns {Promise} Promise that resolves to potential commanders
 */
export const searchCommanders = async (query = '') => {
  const commanderQuery = query 
    ? `${query} is:commander` 
    : 'is:commander';
  
  return searchCards(commanderQuery);
};

/**
 * Get card image URIs with comprehensive fallback handling
 * @param {Object} card - Card object from Scryfall
 * @returns {Object|null} Object with different image sizes or null if no images found
 */
export const getCardImageUris = (card) => {
  if (!card) {
    return null;
  }

  try {
    // First check for direct image_uris (single-faced cards and split cards)
    if (card.image_uris) {
      return {
        png: card.image_uris.png,
        large: card.image_uris.large, 
        normal: card.image_uris.normal,
        small: card.image_uris.small,
        border_crop: card.image_uris.border_crop,
        art_crop: card.image_uris.art_crop
      };
    }

    // For multi-faced cards, use the first face
    if (card.card_faces && card.card_faces[0]?.image_uris) {
      const faceImageUris = card.card_faces[0].image_uris;
      return {
        png: faceImageUris.png,
        large: faceImageUris.large,
        normal: faceImageUris.normal,
        small: faceImageUris.small,
        border_crop: faceImageUris.border_crop,
        art_crop: faceImageUris.art_crop,
        _faceIndex: 0
      };
    }

    // Try other faces if first face doesn't have images
    if (card.card_faces && card.card_faces.length > 1) {
      for (let i = 1; i < card.card_faces.length; i++) {
        const face = card.card_faces[i];
        if (face?.image_uris) {
          return {
            png: face.image_uris.png,
            large: face.image_uris.large,
            normal: face.image_uris.normal,
            small: face.image_uris.small,
            border_crop: face.image_uris.border_crop,
            art_crop: face.image_uris.art_crop,
            _faceIndex: i
          };
        }
      }
    }

    // Fallback URL generation for cards with IDs but no image_uris
    if (card.id) {
      // Use scryfall.io domain for images
      const imageBaseUrl = 'https://cards.scryfall.io';
      
      // Format the ID for URL construction
      const cardId = card.id;
      
      // Create a more robust URL structure
      return {
        small: `${imageBaseUrl}/small/front/${cardId}.jpg`,
        normal: `${imageBaseUrl}/normal/front/${cardId}.jpg`,
        large: `${imageBaseUrl}/large/front/${cardId}.jpg`,
        png: `${imageBaseUrl}/png/front/${cardId}.png`,
        art_crop: `${imageBaseUrl}/art_crop/front/${cardId}.jpg`,
        border_crop: `${imageBaseUrl}/border_crop/front/${cardId}.jpg`
      };
    }

    return null;
  } catch (error) {
    console.error('getCardImageUris: Error processing card image URIs:', error);
    
    // Attempt to provide a minimal fallback if we have an ID
    if (card && card.id) {
      return {
        normal: `https://cards.scryfall.io/normal/front/${card.id}.jpg`,
        small: `https://cards.scryfall.io/small/front/${card.id}.jpg`
      };
    }
    
    return null;
  }
};

/**
 * Get random cards (useful for suggestions or examples)
 * @param {number} count - Number of random cards to get
 * @returns {Promise} Promise that resolves to random cards
 */
export const getRandomCards = async (count = 1) => {
  const results = [];
  
  for (let i = 0; i < count; i++) {
    const response = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/random`);
    results.push(response.data);
  }
  
  return results;
};

/**
 * Get autocomplete suggestions for card names
 * @param {string} query - Partial card name
 * @returns {Promise} Promise that resolves to name suggestions
 */
export const getAutocompleteSuggestions = async (query) => {
  if (!query || query.length < 2) return { data: [] };
  
  const response = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/autocomplete`, {
    params: { q: query }
  });
  
  return response.data;
};

/**
 * Get bulk data information
 * @returns {Promise} Promise that resolves to available bulk data
 */
export const getBulkData = async () => {
  const response = await axios.get(`${SCRYFALL_API_BASE_URL}/bulk-data`);
  return response.data;
};

export default {
  searchCards,
  getCardById,
  searchCardByName,
  enhancedFuzzySearch,
  searchCommanders,
  getCardImageUris,
  getRandomCards,
  getAutocompleteSuggestions,
  getBulkData
}; 