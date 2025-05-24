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
 * Get card image URIs with comprehensive fallback handling
 * @param {Object} card - Card object from Scryfall
 * @returns {Object|null} Object with different image sizes or null if no images found
 */
export const getCardImageUris = (card) => {
  if (!card) {
    console.warn('getCardImageUris: No card object provided');
    return null;
  }

  // Enhanced debugging for specific problematic cards
  const problematicCards = ['A-Gutter Skulker', 'Arcee, Sharpshooter', 'Arlinn, the Pack\'s Hope'];
  const isProblematicCard = problematicCards.some(name => card.name && card.name.includes(name.split(' ')[0]));
  
  if (isProblematicCard) {
    console.group(`🔍 DEBUG: Problematic card - ${card.name}`);
    console.log('Full card object:', card);
    console.log('Layout:', card.layout);
    console.log('Has image_uris:', !!card.image_uris);
    console.log('image_uris:', card.image_uris);
    console.log('Has card_faces:', !!card.card_faces);
    console.log('card_faces length:', card.card_faces ? card.card_faces.length : 0);
    if (card.card_faces) {
      card.card_faces.forEach((face, index) => {
        console.log(`Face ${index}:`, {
          name: face.name,
          has_image_uris: !!face.image_uris,
          image_uris: face.image_uris
        });
      });
    }
    console.log('image_status:', card.image_status);
  }

  try {
    // Simple direct approach - first check for direct image_uris (matches CardDetailModal approach)
    let imageUrl = card.image_uris?.png || card.image_uris?.large || card.image_uris?.normal || card.image_uris?.small;
    
    if (imageUrl) {
      const result = {
        png: card.image_uris?.png,
        large: card.image_uris?.large, 
        normal: card.image_uris?.normal,
        small: card.image_uris?.small,
        border_crop: card.image_uris?.border_crop,
        art_crop: card.image_uris?.art_crop
      };
      
      if (isProblematicCard) {
        console.log('✅ Found direct image_uris:', result);
        console.groupEnd();
      }
      
      return result;
    }

    // For multi-faced cards, check the first face (matches CardDetailModal approach)
    if (card.card_faces && card.card_faces[0]?.image_uris) {
      const faceImageUris = card.card_faces[0].image_uris;
      imageUrl = faceImageUris.png || faceImageUris.large || faceImageUris.normal || faceImageUris.small;
      
      if (imageUrl) {
        const result = {
          png: faceImageUris.png,
          large: faceImageUris.large,
          normal: faceImageUris.normal,
          small: faceImageUris.small,
          border_crop: faceImageUris.border_crop,
          art_crop: faceImageUris.art_crop,
          _faceIndex: 0
        };
        
        if (isProblematicCard) {
          console.log('✅ Found card_faces[0] image_uris:', result);
          console.groupEnd();
        }
        
        return result;
      }
    }

    // If we still haven't found anything, try other faces
    if (card.card_faces && card.card_faces.length > 1) {
      for (let i = 1; i < card.card_faces.length; i++) {
        const face = card.card_faces[i];
        if (face?.image_uris) {
          imageUrl = face.image_uris.png || face.image_uris.large || face.image_uris.normal || face.image_uris.small;
          
          if (imageUrl) {
            const result = {
              png: face.image_uris.png,
              large: face.image_uris.large,
              normal: face.image_uris.normal,
              small: face.image_uris.small,
              border_crop: face.image_uris.border_crop,
              art_crop: face.image_uris.art_crop,
              _faceIndex: i
            };
            
            if (isProblematicCard) {
              console.log(`✅ Found card_faces[${i}] image_uris:`, result);
              console.groupEnd();
            }
            
            return result;
          }
        }
      }
    }

    if (isProblematicCard) {
      console.log('❌ No image URIs found anywhere');
      console.groupEnd();
    }

    // Log for debugging purposes (only for non-problematic cards to reduce noise)
    if (!isProblematicCard) {
      console.warn('getCardImageUris: No image URIs found for card:', {
        name: card.name,
        id: card.id,
        layout: card.layout,
        hasImageUris: !!card.image_uris,
        hasCardFaces: !!card.card_faces,
        cardFacesLength: card.card_faces ? card.card_faces.length : 0,
        imageStatus: card.image_status
      });
    }

    return null;
  } catch (error) {
    console.error('getCardImageUris: Error processing card image URIs:', error, card);
    if (isProblematicCard) {
      console.groupEnd();
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
  searchCommanders,
  getCardImageUris,
  getRandomCards,
  getAutocompleteSuggestions,
  getBulkData
}; 