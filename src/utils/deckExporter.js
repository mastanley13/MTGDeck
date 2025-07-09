import FileSaver from 'file-saver';

/**
 * Export a deck to plain text format
 * @param {Object} deck - The deck object
 * @returns {string} - The deck in text format
 */
export const exportToText = (deck) => {
  if (!deck || !deck.commander || !deck.cards) {
    throw new Error('Invalid deck data');
  }

  let textOutput = `// ${deck.name}\n`;
  textOutput += `// Commander: ${deck.commander.name}\n`;
  
  if (deck.description) {
    textOutput += `// Description: ${deck.description}\n`;
  }
  
  textOutput += `\n// Commander\n1 ${deck.commander.name}\n`;
  
  // Group cards by category or type
  const groupedCards = {};
  
  // Process all cards
  deck.cards.forEach(card => {
    const category = deck.cardCategories?.[card.id] || 'Other';
    
    if (!groupedCards[category]) {
      groupedCards[category] = [];
    }
    
    groupedCards[category].push(card);
  });
  
  // Add cards by category
  Object.keys(groupedCards).sort().forEach(category => {
    textOutput += `\n// ${category}\n`;
    
    groupedCards[category].forEach(card => {
      textOutput += `${card.quantity || 1} ${card.name}\n`;
    });
  });
  
  return textOutput;
};

/**
 * Export a deck to Moxfield-compatible format
 * @param {Object} deck - The deck object
 * @returns {string} - The deck in Moxfield format
 */
export const exportToMoxfield = (deck) => {
  if (!deck || !deck.commander || !deck.cards) {
    throw new Error('Invalid deck data');
  }

  // Moxfield uses a special format where Commander is in a separate section
  let moxfieldOutput = `Commander: ${deck.commander.name}\n\n`;
  
  // Process all cards
  deck.cards.forEach(card => {
    moxfieldOutput += `${card.quantity || 1} ${card.name}\n`;
  });
  
  return moxfieldOutput;
};

/**
 * Save deck as text file
 * @param {Object} deck - The deck object
 * @param {string} format - The export format ('text' or 'moxfield')
 */
export const saveDeckFile = (deck, format = 'text') => {
  if (!deck || !deck.name) {
    throw new Error('Invalid deck data');
  }
  
  // Get content based on format
  const content = format === 'moxfield' ? exportToMoxfield(deck) : exportToText(deck);
  
  // Create file name
  const fileName = `${deck.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.txt`;
  
  // Create blob and save file
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  FileSaver.saveAs(blob, fileName);
};

/**
 * Generate a shareable URL for the deck
 * @param {Object} deck - The deck object
 * @returns {string} - The shareable URL
 */
export const generateShareableUrl = (deck) => {
  if (!deck || !deck.id) {
    throw new Error('Invalid deck data');
  }
  
  const baseUrl = window.location.origin;
  return `${baseUrl}/decks/${deck.id}`;
};

/**
 * Copy deck to clipboard in text format
 * @param {Object} deck - The deck object
 * @param {string} format - The export format ('text' or 'moxfield')
 * @returns {string} - The deck in the specified format
 */
export const copyDeckToClipboard = (deck, format = 'text') => {
  if (!deck) {
    throw new Error('Invalid deck data');
  }
  
  return format === 'moxfield' ? exportToMoxfield(deck) : exportToText(deck);
}; 