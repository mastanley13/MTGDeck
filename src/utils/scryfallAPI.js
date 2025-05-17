import axios from 'axios';

// Base URL for Scryfall API
const SCRYFALL_API_BASE_URL = 'https://api.scryfall.com';

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
 * Fetch a specific card by its ID
 * @param {string} id - Card ID
 * @returns {Promise} Promise that resolves to card data
 */
export const getCardById = async (id) => {
  const response = await axios.get(`${SCRYFALL_API_BASE_URL}/cards/${id}`);
  return response.data;
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
    // If not found by exact name, try a search
    if (error.response && (error.response.status === 404 || error.response.status === 400)) {
      try {
        // Use the search endpoint with name:
        return await searchCards(`name:"${name}"`);
      } catch (searchError) {
        // If search also fails, return empty result
        return { data: [], total_cards: 0, has_more: false };
      }
    }
    throw error;
  }
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
 * Get card image URIs
 * @param {Object} card - Card object from Scryfall
 * @returns {Object} Object with different image sizes
 */
export const getCardImageUris = (card) => {
  // Some cards (like dual-faced cards) have faces instead of direct image_uris
  if (card.image_uris) {
    return card.image_uris;
  } else if (card.card_faces && card.card_faces[0].image_uris) {
    return card.card_faces[0].image_uris;
  }
  return null;
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
  searchCommanders,
  getCardImageUris,
  getRandomCards,
  getAutocompleteSuggestions,
  getBulkData
}; 