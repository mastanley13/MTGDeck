import React, { useState } from 'react';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDeck } from '../../context/DeckContext';
import { validateCardForCommander } from '../../utils/deckValidator';
import { parseManaSymbols } from '../../utils/manaSymbols';
import CardDetailModal from '../ui/CardDetailModal';

/**
 * Component to display a suggested card from AI with reasons
 */
const SuggestedCard = ({ suggestion }) => {
  const { addCard, commander, savedDecks, currentDeckName } = useDeck();
  
  // State for modals
  const [selectedCardForDetails, setSelectedCardForDetails] = useState(null);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  
  // Extract card data and suggestion details
  const { card, name, reason, category } = suggestion;
  
  // Get card image if available
  const imageUris = card ? getCardImageUris(card) : null;
  
  // Handle opening card details modal
  const handleOpenCardDetailsModal = () => {
    // Only open modal if card is fully loaded (not a fallback card)
    if (card && !card._isFallbackCard && card.isLoaded !== false) {
      setSelectedCardForDetails(card);
    } else {
      // Optionally show a brief message that the card is still loading
      console.log('Card is still loading, modal will not open:', card?.name);
    }
  };

  const handleCloseCardDetailsModal = () => {
    setSelectedCardForDetails(null);
  };

  // Handle opening deck selection modal
  const handleOpenDeckModal = () => {
    setIsDeckModalOpen(true);
  };

  const handleCloseDeckModal = () => {
    setIsDeckModalOpen(false);
  };

  // Handle adding card to specific deck
  const handleAddCardToDeck = (deckId) => {
    if (card) {
      // Validate the card before adding it to the deck
      const validation = validateCardForCommander(card, commander);
      
      if (!validation.valid) {
        // Show an alert or notification about why the card cannot be added
        alert(`Cannot add card: ${validation.message}`);
        return;
      }
      
      addCard(card);
      const targetDeckName = deckId === 'current' ? currentDeckName : savedDecks.find(d => d.id === deckId)?.name;
      alert(`${card.name} added to ${targetDeckName || 'current deck'}.`);
      handleCloseDeckModal();
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
    <>
      <div className="overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 rounded-md flex flex-col h-full">
        {/* Category Header */}
        <div className={`${getCategoryColor(category)} text-white font-semibold text-sm px-3 py-1 text-center flex-shrink-0`}>
          {category || 'Uncategorized'}
        </div>
        
        {/* Card Image */}
        <div className="w-full aspect-[63/88] relative bg-gray-700 border-b border-logoScheme-brown flex-shrink-0">
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
        <div className="bg-logoScheme-darkGray p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm text-logoScheme-gold flex-1 pr-2 leading-tight">{name}</h3>
            {/* Mana Cost Display */}
            {card && card.mana_cost && (
              <div className="flex items-center space-x-0.5 flex-shrink-0">
                {parseManaSymbols(card.mana_cost)}
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-400 italic mb-2 flex-shrink-0">{getCardType()}</div>
          
          <p className="text-xs text-gray-300 mb-3 flex-grow leading-relaxed overflow-hidden">
            {reason}
          </p>
          
          {/* Action buttons - side by side - Fixed at bottom */}
          <div className="flex space-x-2 mt-auto">
            <button
              onClick={handleOpenCardDetailsModal}
              disabled={!card}
              className={`flex-1 text-xs py-2 px-3 rounded transition-colors duration-200 font-medium ${
                card 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Details
            </button>
            <button
              onClick={handleOpenDeckModal}
              disabled={!card}
              className={`flex-1 text-xs py-2 px-3 rounded transition-colors duration-200 font-medium ${
                card 
                  ? 'bg-logoScheme-green text-white hover:bg-green-700' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              Add to Deck
            </button>
          </div>
        </div>
      </div>

      {/* Card Details Modal */}
      {selectedCardForDetails && (
        <CardDetailModal 
          card={selectedCardForDetails} 
          onClose={handleCloseCardDetailsModal} 
        />
      )}

      {/* Add to Deck Modal */}
      {isDeckModalOpen && card && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glassmorphism-card p-8 max-w-md w-full border-primary-500/30">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add "{card.name}"</span>
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {/* Current Deck Option */}
              <button 
                onClick={() => handleAddCardToDeck('current')}
                className="w-full btn-modern btn-modern-primary btn-modern-md text-left"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Current Deck: {currentDeckName || 'Untitled'}</span>
                </div>
              </button>

              {/* Saved Decks */}
              {savedDecks && savedDecks.length > 0 && (
                <>
                  <div className="border-t border-slate-700/50 pt-3 mt-3">
                    <p className="text-sm text-slate-400 mb-3">Or add to saved deck:</p>
                  </div>
                  {savedDecks.map((deck) => (
                    <button 
                      key={deck.id}
                      onClick={() => handleAddCardToDeck(deck.id)}
                      className="w-full btn-modern btn-modern-secondary btn-modern-sm text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>{deck.name}</span>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {(!savedDecks || savedDecks.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-4">No other saved decks found.</p>
              )}
            </div>

            <button 
              onClick={handleCloseDeckModal}
              className="w-full btn-modern btn-modern-outline btn-modern-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SuggestedCard; 