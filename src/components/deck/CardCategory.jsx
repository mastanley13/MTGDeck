import React, { useState, useEffect } from 'react';
import { useDeck } from '../../context/DeckContext';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDrag, useDrop } from 'react-dnd';

// Card component with drag and drop functionality
const DraggableCard = ({ card, handleQuantityChange, handleRemoveCard }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { id: card.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const imageUris = getCardImageUris(card);
  
  return (
    <div 
      ref={drag}
      className={`card-item flex flex-col h-full ${isDragging ? 'opacity-50' : ''}`}
    >
      {/* Card Image Area */}
      <div className="relative w-full">
        {imageUris ? (
          <img
            src={imageUris.normal}
            alt={card.name}
            className="rounded-lg shadow-md w-full object-cover aspect-[63/88]"
          />
        ) : (
          <div className="bg-gray-200 rounded-lg shadow-md w-full aspect-[63/88] flex items-center justify-center p-2">
            <span className="text-xs text-center">{card.name}</span>
          </div>
        )}
        {/* Original position of controls - to be removed or repurposed if needed for other overlays */}
      </div>

      {/* Controls Bar - Below Image */}
      <div className="flex items-center justify-between p-1 bg-gray-100 rounded-b-lg">
        {/* Quantity Controls */}
        <div className="flex items-center">
          <button
            onClick={() => handleQuantityChange(card.id, (card.quantity || 1) - 1)}
            className="w-7 h-7 flex items-center justify-center text-white bg-red-500 rounded-l hover:bg-red-600 focus:outline-none active:bg-red-700"
            aria-label="Decrease quantity"
            disabled={(card.quantity || 1) <= (card.type_line && card.type_line.toLowerCase().includes('basic land') ? 1 : 1) && !(card.type_line && card.type_line.toLowerCase().includes('basic land'))}
          >
            -
          </button>
          <span className="w-7 h-7 flex items-center justify-center bg-white text-black font-bold text-sm border-t border-b border-gray-300">
            {card.quantity || 1}
          </span>
          <button
            onClick={() => handleQuantityChange(card.id, (card.quantity || 1) + 1)}
            className="w-7 h-7 flex items-center justify-center text-white bg-green-500 rounded-r hover:bg-green-600 focus:outline-none active:bg-green-700"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={() => handleRemoveCard(card.id)}
          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 focus:outline-none active:bg-red-800 ml-2"
          aria-label="Remove card"
        >
          Remove
        </button>
      </div>

      {/* Card Name - Below Controls Bar */}
      <div className="mt-1 text-center text-xs truncate px-1 w-full">{card.name}</div>
    </div>
  );
};

const CardCategory = ({ title, cards, onCardMove, forceOpenState }) => {
  const { removeCard, updateCardQuantity } = useDeck();
  const [isOpen, setIsOpen] = useState(false);
  
  // Effect to respond to external forceOpenState changes
  useEffect(() => {
    if (forceOpenState !== undefined) {
      setIsOpen(forceOpenState);
    }
  }, [forceOpenState]);

  // Set up drop target
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'CARD',
    drop: (item) => {
      if (onCardMove) {
        onCardMove(item.id, title);
      }
      return { category: title };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // Handle removing a card from the deck
  const handleRemoveCard = (cardId) => {
    removeCard(cardId);
  };

  // Handle changing card quantity
  const handleQuantityChange = (cardId, newQuantity) => {
    updateCardQuantity(cardId, newQuantity);
  };

  const categoryCardCount = cards.reduce((sum, card) => sum + (card.quantity || 1), 0);

  // Toggle collapse state
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div 
      ref={drop}
      className={`bg-white rounded-xl shadow-lg mb-6 overflow-hidden transition-all duration-300 ease-in-out ${isOver ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
    >
      {/* Clickable Header */}
      <div 
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors duration-150"
        onClick={toggleOpen}
      >
        <h3 className="text-lg font-medium text-slate-800">
          {title} 
          <span className="text-sm text-slate-500 ml-2">({categoryCardCount})</span>
        </h3>
        <svg 
          className={`w-5 h-5 text-slate-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-200">
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
              {cards.map(card => (
                <DraggableCard 
                  key={card.id} 
                  card={card} 
                  handleQuantityChange={handleQuantityChange} 
                  handleRemoveCard={handleRemoveCard} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-6 text-slate-500 bg-slate-50 rounded-b-md mt-0">
              <p>No cards in this category. You can drag cards here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardCategory; 