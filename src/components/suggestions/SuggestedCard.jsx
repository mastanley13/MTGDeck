import React from 'react';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDeck } from '../../context/DeckContext';
import { validateCardForCommander } from '../../utils/deckValidator';

/**
 * Component to display a suggested card from AI with reasons
 */
const SuggestedCard = ({ suggestion }) => {
  const { addCard, commander } = useDeck();
  
  // Extract card data and suggestion details
  const { card, name, reason, category } = suggestion;
  
  // Get card image if available
  const imageUris = card ? getCardImageUris(card) : null;
  
  // Handle adding card to deck
  const handleAddCard = () => {
    if (card) {
      // Validate the card before adding it to the deck
      const validation = validateCardForCommander(card, commander);
      
      if (!validation.valid) {
        // Show an alert or notification about why the card cannot be added
        alert(`Cannot add card: ${validation.message}`);
        return;
      }
      
      addCard(card);
    }
  };
  
  // Map category to background color for header
  const getCategoryColor = (category) => {
    const categoryColors = {
      'Card Draw': 'bg-mtg-blue',
      'Ramp': 'bg-mtg-green',
      'Removal': 'bg-logoScheme-red',
      'Combo Piece': 'bg-mtg-red',
      'Control': 'bg-logoScheme-blue',
      'Utility': 'bg-gray-600',
      'Finisher': 'bg-mtg-red',
      'Protection': 'bg-mtg-white text-black',
      'Recursion': 'bg-mtg-black',
      'Tutor': 'bg-purple-700',
      'Lands': 'bg-mtg-green',
      'Synergy': 'bg-teal-700',
      'Creature Pump': 'bg-orange-600',
      'Aggro': 'bg-mtg-red',
    };
    
    return categoryColors[category] || 'bg-gray-600';
  };
  
  // Get card type line for display
  const getCardType = () => {
    if (!card || !card.type_line) return '';
    
    return card.type_line;
  };
  
  return (
    <div className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 rounded-md flex flex-col h-full">
      {/* Category Header */}
      <div className={`${getCategoryColor(category)} text-white font-semibold text-sm px-3 py-1 text-center`}>
        {category || 'Uncategorized'}
      </div>
      
      {/* Card Image */}
      <div className="w-full aspect-[63/88] relative bg-gray-700 border-b border-logoScheme-brown">
        {imageUris ? (
          <img 
            src={imageUris.normal || imageUris.small} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-600 text-gray-300 text-sm p-2 text-center">
            {name || 'Card image not available'}
          </div>
        )}
      </div>
      
      {/* Card Details */}
      <div className="bg-logoScheme-darkGray p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-sm truncate text-logoScheme-gold">{name}</h3>
        <div className="text-xs text-gray-400 italic mb-2">{getCardType()}</div>
        
        <p className="text-xs text-gray-300 mb-3 flex-grow">
          {reason}
        </p>
        
        <button
          onClick={handleAddCard}
          disabled={!card}
          className={`text-xs w-full py-1.5 px-3 rounded ${
            card 
              ? 'bg-logoScheme-green text-white hover:bg-green-700 transition-colors' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {card ? 'Add to Deck' : 'Card Not Found'}
        </button>
      </div>
    </div>
  );
};

export default SuggestedCard; 