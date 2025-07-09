/**
 * Card caching utility for storing and retrieving card data in local storage
 * to reduce API calls and improve performance
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Safe localStorage utility to handle quota exceeded errors
 */
export const safeLocalStorage = {
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        console.warn('localStorage quota exceeded, clearing cache');
        // Clear some cache and try again
        try {
          const keys = Object.keys(localStorage);
          const cacheKeys = keys.filter(k => k.startsWith('mtg_') || k.startsWith('suggestion_'));
          // Remove oldest cache entries
          cacheKeys.slice(0, Math.floor(cacheKeys.length / 2)).forEach(k => {
            try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
          });
          // Try again
          localStorage.setItem(key, value);
          return true;
        } catch (secondError) {
          console.warn('Failed to cache even after cleanup');
          return false;
        }
      } else {
        console.warn('localStorage error:', error);
        return false;
      }
    }
  },
  
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage read error:', error);
      return null;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('localStorage remove error:', error);
      return false;
    }
  }
};

const CACHE_PREFIX = 'mtg_card_cache_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 50; // Maximum number of cards to cache
const SEARCH_CACHE_KEY_PREFIX = 'mtg_search_cache_';
const SEARCH_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds
const MAX_SEARCH_CACHE_SIZE = 20; // Maximum number of search results to cache
const MAX_CACHE_KEY_LENGTH = 100; // Maximum length for cache keys

// Helper to get all cache keys
const getCacheKeys = () => {
  return Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
};

// Helper to get all search cache keys
const getSearchCacheKeys = () => {
  return Object.keys(localStorage).filter(key => key.startsWith(SEARCH_CACHE_KEY_PREFIX));
};

// Helper to clean old search cache entries
const cleanOldSearchCache = () => {
  const keys = getSearchCacheKeys();
  const now = Date.now();
  
  // Remove expired entries first
  for (const key of keys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (now - (data.timestamp || 0) > SEARCH_CACHE_EXPIRY_MS) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // If entry is corrupted, remove it
      localStorage.removeItem(key);
    }
  }
  
  // Get remaining keys after cleanup
  const remainingKeys = getSearchCacheKeys();
  
  // If we still exceed the max size, remove oldest entries
  if (remainingKeys.length >= MAX_SEARCH_CACHE_SIZE) {
    const sortedKeys = remainingKeys.sort((a, b) => {
      const aData = JSON.parse(localStorage.getItem(a) || '{}');
      const bData = JSON.parse(localStorage.getItem(b) || '{}');
      return (aData.timestamp || 0) - (bData.timestamp || 0);
    });
    
    // Remove oldest entries
    const toRemove = sortedKeys.slice(0, sortedKeys.length - MAX_SEARCH_CACHE_SIZE + 1);
    toRemove.forEach(key => localStorage.removeItem(key));
  }
};

// Helper to clean old cache entries
const cleanOldCache = () => {
  const keys = getCacheKeys();
  const now = Date.now();
  
  // Sort by timestamp, oldest first
  const sortedKeys = keys.sort((a, b) => {
    const aData = JSON.parse(localStorage.getItem(a) || '{}');
    const bData = JSON.parse(localStorage.getItem(b) || '{}');
    return (aData.timestamp || 0) - (bData.timestamp || 0);
  });
  
  // Remove old entries if we exceed the max size
  while (sortedKeys.length >= MAX_CACHE_SIZE) {
    const oldestKey = sortedKeys.shift();
    localStorage.removeItem(oldestKey);
  }
  
  // Also remove expired entries
  for (const key of sortedKeys) {
    try {
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (now - (data.timestamp || 0) > CACHE_EXPIRY) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      // If entry is corrupted, remove it
      localStorage.removeItem(key);
    }
  }
};

/**
 * Save a card or array of cards to cache
 * @param {Object|Array} cardData - Card data to cache
 */
export const cacheCard = (card) => {
  try {
    cleanOldCache();
    
    const cacheKey = CACHE_PREFIX + uuidv4();
    const cacheData = {
      card,
      timestamp: Date.now()
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    return true;
  } catch (e) {
    console.warn('Failed to cache card:', e);
    return false;
  }
};

/**
 * Get a card from cache by ID
 * @param {string} cardId - ID of the card to retrieve
 * @returns {Object|null} Card data or null if not in cache or expired
 */
export const getCachedCard = (cardName) => {
  try {
    const keys = getCacheKeys();
    for (const key of keys) {
      try {
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        const data = JSON.parse(item);
      if (data.card?.name === cardName) {
          // Check if expired
          if (Date.now() - (data.timestamp || 0) > CACHE_EXPIRY) {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              // Ignore errors when removing
            }
            continue;
          }
        return data.card;
        }
      } catch (e) {
        // If this entry is corrupted, remove it
        try {
          localStorage.removeItem(key);
        } catch (e2) {
          // Ignore errors when removing
        }
      }
    }
  } catch (e) {
    console.warn('Error reading card cache:', e);
  }
  return null;
};

/**
 * Cache search results with the search query as key
 * @param {string} query - Search query
 * @param {Object} results - Search results to cache
 */
export const cacheSearchResults = (query, results) => {
  if (!query || !results) return;
  
  try {
    // Clean old cache entries first to free up space
    cleanOldSearchCache();
    
    const normalizedQuery = query.trim().toLowerCase();
    
    // Truncate cache key if too long to prevent quota issues
    let cacheKey = `${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery}`;
    if (cacheKey.length > MAX_CACHE_KEY_LENGTH) {
      cacheKey = cacheKey.substring(0, MAX_CACHE_KEY_LENGTH - 5) + '_trunc';
    }
    
    // Limit the size of cached data - only cache essential fields
    const limitedResults = {
      ...results,
      // If results has a 'data' array, limit it to first 10 items to save space
      data: results.data ? results.data.slice(0, 10).map(item => ({
        id: item.id,
        name: item.name,
        type_line: item.type_line,
        color_identity: item.color_identity,
        mana_cost: item.mana_cost,
        cmc: item.cmc,
        // Keep all image URIs for proper display
        image_uris: item.image_uris,
        // Include card_faces for double-faced cards
        card_faces: item.card_faces ? item.card_faces.map(face => ({
          name: face.name,
          image_uris: face.image_uris,
          type_line: face.type_line,
          oracle_text: face.oracle_text,
          mana_cost: face.mana_cost,
          power: face.power,
          toughness: face.toughness,
          loyalty: face.loyalty
        })) : undefined,
        oracle_text: item.oracle_text,
        power: item.power,
        toughness: item.toughness,
        loyalty: item.loyalty,
        set: item.set,
        set_name: item.set_name,
        rarity: item.rarity
      })) : undefined
    };
    
    const cacheItem = {
      data: limitedResults,
      timestamp: Date.now()
    };
    
    const cacheString = JSON.stringify(cacheItem);
    
    // Check if the string is too large (over 1MB)
    if (cacheString.length > 1048576) {
      console.warn('Search result too large to cache, skipping');
      return false;
    }
    
    localStorage.setItem(cacheKey, cacheString);
    return true;
    
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
      console.warn('localStorage quota exceeded, clearing old search cache');
      // Clear all search cache and try again
      const searchKeys = getSearchCacheKeys();
      searchKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignore errors when removing
        }
      });
      
      // Try to cache again after clearing
      try {
  const normalizedQuery = query.trim().toLowerCase();
        let cacheKey = `${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery}`;
        if (cacheKey.length > MAX_CACHE_KEY_LENGTH) {
          cacheKey = cacheKey.substring(0, MAX_CACHE_KEY_LENGTH - 5) + '_trunc';
        }
        
  const cacheItem = {
    data: results,
    timestamp: Date.now()
  };
  
        localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        return true;
      } catch (secondError) {
        console.warn('Failed to cache search results even after cleanup:', secondError);
        return false;
      }
    } else {
      console.warn('Failed to cache search results:', error);
      return false;
    }
  }
};

/**
 * Get cached search results for a query
 * @param {string} query - Search query
 * @returns {Object|null} Search results or null if not in cache or expired
 */
export const getCachedSearchResults = (query) => {
  if (!query) return null;
  
  try {
  const normalizedQuery = query.trim().toLowerCase();
    
    // Try both truncated and non-truncated versions
    let cacheKey = `${SEARCH_CACHE_KEY_PREFIX}${normalizedQuery}`;
    let cacheItem = null;
    
    try {
      cacheItem = localStorage.getItem(cacheKey);
    } catch (e) {
      // If key is too long, try truncated version
      if (cacheKey.length > MAX_CACHE_KEY_LENGTH) {
        cacheKey = cacheKey.substring(0, MAX_CACHE_KEY_LENGTH - 5) + '_trunc';
        try {
          cacheItem = localStorage.getItem(cacheKey);
        } catch (e2) {
          return null;
        }
      } else {
        return null;
      }
    }
    
  if (!cacheItem) return null;
  
    const { data, timestamp } = JSON.parse(cacheItem);
    
    // Check if cache is expired
    if (Date.now() - timestamp > SEARCH_CACHE_EXPIRY_MS) {
      try {
        localStorage.removeItem(cacheKey);
      } catch (e) {
        // Ignore errors when removing
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.warn('Error getting cached search results:', error);
    return null;
  }
};

/**
 * Clear all cached card data
 */
export const clearCardCache = () => {
  const keys = getCacheKeys();
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors when removing
    }
  });
};

/**
 * Clear all cached search results
 */
export const clearSearchCache = () => {
  const keys = getSearchCacheKeys();
  keys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore errors when removing
    }
  });
};

/**
 * Clear all cache data (cards and search results)
 */
export const clearAllCache = () => {
  clearCardCache();
  clearSearchCache();
};

export default {
  cacheCard,
  getCachedCard,
  cacheSearchResults,
  getCachedSearchResults,
  clearCardCache,
  clearSearchCache,
  clearAllCache,
  safeLocalStorage
}; 