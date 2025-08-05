/**
 * TCGPlayer Affiliate Utilities
 * Provides functions for creating TCGPlayer affiliate links following the official tracking guide
 */

// Base TCGPlayer affiliate tracking URL
const BASE_TRACKING_URL = 'https://tcgplayer.pxf.io/c/6434831/1830156/21018';
const PARTNER_PROPERTY_ID = '7331732';

/**
 * Create a TCGPlayer affiliate link for a single card search
 * @param {string} cardName - The name of the card to search for
 * @returns {string} - The TCGPlayer affiliate tracking link
 */
export const getTCGPlayerCardLink = (cardName) => {
  const searchTerm = encodeURIComponent(`${cardName} Magic The Gathering`);
  const tcgPlayerSearchUrl = `https://www.tcgplayer.com/search/magic/product?q=${searchTerm}`;
  return `${BASE_TRACKING_URL}?u=${encodeURIComponent(tcgPlayerSearchUrl)}&partnerpropertyid=${PARTNER_PROPERTY_ID}`;
};

/**
 * Create a TCGPlayer Mass Entry affiliate link for an entire deck
 * @param {Object} deck - The deck object containing cards
 * @returns {string|null} - The TCGPlayer Mass Entry affiliate link or null if no cards
 */
export const getTCGPlayerMassEntryLink = (deck) => {
  if (!deck || !deck.cards || deck.cards.length === 0) return null;
  
  // Format cards for Mass Entry: "quantity cardname||quantity cardname||"
  const cardEntries = deck.cards.map(card => {
    const quantity = card.quantity || 1;
    const cardName = card.name || card.card_name;
    return `${quantity} ${cardName}`;
  }).join('||');
  
  // Encode the card list for URL
  const encodedCards = encodeURIComponent(cardEntries);
  
  // Create the Mass Entry URL
  const massEntryUrl = `http://store.tcgplayer.com/massentry?productline=Magic&c=${encodedCards}`;
  
  // Create the TCGPlayer affiliate tracking link
  return `${BASE_TRACKING_URL}?u=${encodeURIComponent(massEntryUrl)}&partnerpropertyid=${PARTNER_PROPERTY_ID}`;
};

/**
 * Get the TCGPlayer tracking pixel URL
 * @returns {string} - The tracking pixel URL
 */
export const getTCGPlayerTrackingPixelUrl = () => {
  return `https://imp.pxf.io/i/6434831/1830156/21018?partnerpropertyid=${PARTNER_PROPERTY_ID}`;
};

/**
 * Create a TCGPlayer Mass Entry link for a custom card list
 * @param {Array} cards - Array of card objects with name and quantity
 * @returns {string} - The TCGPlayer Mass Entry affiliate link
 */
export const getTCGPlayerCustomMassEntryLink = (cards) => {
  if (!cards || cards.length === 0) return null;
  
  // Format cards for Mass Entry: "quantity cardname||quantity cardname||"
  const cardEntries = cards.map(card => {
    const quantity = card.quantity || 1;
    const cardName = card.name || card.card_name;
    return `${quantity} ${cardName}`;
  }).join('||');
  
  // Encode the card list for URL
  const encodedCards = encodeURIComponent(cardEntries);
  
  // Create the Mass Entry URL
  const massEntryUrl = `http://store.tcgplayer.com/massentry?productline=Magic&c=${encodedCards}`;
  
  // Create the TCGPlayer affiliate tracking link
  return `${BASE_TRACKING_URL}?u=${encodeURIComponent(massEntryUrl)}&partnerpropertyid=${PARTNER_PROPERTY_ID}`;
}; 