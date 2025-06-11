/**
 * Card caching utility for storing and retrieving card data in local storage
 * to reduce API calls and improve performance
 */

import { v4 as uuidv4 } from 'uuid';

const CACHE_PREFIX = 'mtg_card_cache_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_SIZE = 50; // Maximum number of cards to cache
const SEARCH_CACHE_KEY_PREFIX = 'mtg_search_cache_';
const SEARCH_CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

// Helper to get all cache keys
const getCacheKeys = () => {
  return Object.keys(localStorage).filter(key => key.startsWith(CACHE_PREFIX));
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
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      if (data.card?.name === cardName) {
        return data.card;
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
  const keys = getCacheKeys();
  keys.forEach(key => localStorage.removeItem(key));
};

export default {
  cacheCard,
  getCachedCard,
  cacheSearchResults,
  getCachedSearchResults,
  clearCardCache
}; 