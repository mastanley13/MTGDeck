import React from 'react';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDeck } from '../../context/DeckContext';

/**
 * Component to display a suggested card from AI with reasons
 */
const SuggestedCard = ({ suggestion }) => {
  const { addCard } = useDeck();
  
  // Extract card data and suggestion details
  const { card, name, reason, category } = suggestion;
  
  // Get card image if available
  const imageUris = card ? getCardImageUris(card) : null;
  
  // Handle adding card to deck
  const handleAddCard = () => {
    if (card) {
      addCard(card);
    }
  };
  
  // Map category to background color for header
  const getCategoryColor = (category) => {
    const categoryColors = {
      'Card Draw': 'bg-mtg-blue',
      'Ramp': 'bg-mtg-green',
      'Removal': 'bg-amber-800',
      'Combo Piece': 'bg-mtg-red',
      'Control': 'bg-blue-900',
      'Utility': 'bg-gray-700',
      'Finisher': 'bg-mtg-red',
      'Protection': 'bg-mtg-white text-black',
      'Recursion': 'bg-mtg-black',
      'Tutor': 'bg-purple-900',
      'Lands': 'bg-mtg-green',
      'Synergy': 'bg-indigo-700',
      'Creature Pump': 'bg-orange-700',
      'Aggro': 'bg-mtg-red',
    };
    
    return categoryColors[category] || 'bg-gray-700';
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
      <div className="w-full aspect-[63/88] relative bg-gray-100 border-b border-gray-200">
        {imageUris ? (
          <img 
            src={imageUris.normal || imageUris.small} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-sm p-2 text-center">
            {name || 'Card image not available'}
          </div>
        )}
      </div>
      
      {/* Card Details */}
      <div className="bg-white p-3 flex-1 flex flex-col">
        <h3 className="font-bold text-sm truncate text-gray-900">{name}</h3>
        <div className="text-xs text-gray-600 italic mb-2">{getCardType()}</div>
        
        <p className="text-xs text-gray-700 mb-3 flex-grow">
          {reason}
        </p>
        
        <button
          onClick={handleAddCard}
          disabled={!card}
          className={`text-xs w-full py-1.5 px-3 rounded ${
            card 
              ? 'bg-green-600 text-white hover:bg-green-700 transition-colors' 
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {card ? 'Add to Deck' : 'Card Not Found'}
        </button>
      </div>
    </div>
  );
};

export default SuggestedCard; 