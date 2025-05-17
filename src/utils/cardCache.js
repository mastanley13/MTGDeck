/**
 * Card caching utility for storing and retrieving card data in local storage
 * to reduce API calls and improve performance
 */

const CACHE_KEY_PREFIX = 'mtg_card_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SEARCH_CACHE_KEY_PREFIX = 'mtg_search_cache_';
const SEARCH_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

/**
 * Save a card or array of cards to cache
 * @param {Object|Array} cardData - Card data to cache
 */
export const cacheCard = (cardData) => {
  if (!cardData) return;
  
  const cardsToCache = Array.isArray(cardData) ? cardData : [cardData];
  
  cardsToCache.forEach(card => {
    if (!card.id) return;
    
    const cacheItem = {
      data: card,
      timestamp: Date.now()
    };
    
    localStorage.setItem(`${CACHE_KEY_PREFIX}${card.id}`, JSON.stringify(cacheItem));
  });
};

/**
 * Get a card from cache by ID
 * @param {string} cardId - ID of the card to retrieve
 * @returns {Object|null} Card data or null if not in cache or expired
 */
export const getCachedCard = (cardId) => {
  if (!cardId) return null;
  
  const cacheItem = localStorage.getItem(`${CACHE_KEY_PREFIX}${cardId}`);
  if (!cacheItem) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cacheItem);
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${CACHE_KEY_PREFIX}${cardId}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing cached card:', error);
    return null;
  }
};

/**
 * Cache search results with the search query as key
 * @param {string} query - Search query
 * @param {Object} results - Search results to cache
 */
export const cacheSearchResults = (query, results) => {
  if (!query || !results) return;
  
  const normalizedQuery = query.trim().toLowerCase();
  const cacheItem = {
    data: results,
    timestamp: Date.now()
  };
  
  localStorage.setItem(`${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery}`, JSON.stringify(cacheItem));
};

/**
 * Get cached search results for a query
 * @param {string} query - Search query
 * @returns {Object|null} Search results or null if not in cache or expired
 */
export const getCachedSearchResults = (query) => {
  if (!query) return null;
  
  const normalizedQuery = query.trim().toLowerCase();
  const cacheItem = localStorage.getItem(`${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery}`);
  if (!cacheItem) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cacheItem);
    
    // Check if cache is expired
    if (Date.now() - timestamp > SEARCH_CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing cached search results:', error);
    return null;
  }
};

/**
 * Clear all cached card data
 */
export const clearCardCache = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(SEARCH_CACHE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
};

export default {
  cacheCard,
  getCachedCard,
  cacheSearchResults,
  getCachedSearchResults,
  clearCardCache
}; 