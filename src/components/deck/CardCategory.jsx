import React, { useState, useEffect } from 'react';
import { useDeck } from '../../context/DeckContext';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDrag, useDrop } from 'react-dnd';

// Updated DraggableCard to handle onViewCardDetails
const DraggableCard = ({ card, handleQuantityChange, handleRemoveCard, onViewCardDetails }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { id: card.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const imageUris = getCardImageUris(card);
  
  const handleViewDetailsClick = (e) => {
    e.stopPropagation(); // Prevent card drag/drop or other parent clicks if necessary
    if (onViewCardDetails) {
      onViewCardDetails(card);
    }
  };

  return (
    <div 
      ref={drag}
      className={`card-item flex flex-col h-full ${isDragging ? 'opacity-50' : ''} group`}
    >
      {/* Card Image Area - Now clickable for details */}
      <div 
        className="relative w-full cursor-pointer" 
        onClick={handleViewDetailsClick} // Open modal on image click
      >
        {imageUris ? (
          <img
            src={imageUris.normal} // Using normal for better modal preview if this data is used directly
            alt={card.name}
            className="rounded-t-lg shadow-md w-full object-cover aspect-[63/88] group-hover:opacity-80 transition-opacity duration-150"
          />
        ) : (
          <div className="bg-gray-200 rounded-t-lg shadow-md w-full aspect-[63/88] flex items-center justify-center p-2 group-hover:opacity-80 transition-opacity duration-150">
            <span className="text-xs text-center">{card.name}</span>
          </div>
        )}
        {/* Optional: Add an icon overlay for view details if preferred over clicking whole image */}
      </div>

      {/* Controls Bar - Below Image */}
      <div className="flex items-center justify-between p-1 bg-gray-100 rounded-b-lg border-t border-gray-200">
        {/* Quantity Controls */} 
        <div className="flex items-center">
          <button
            onClick={(e) => { e.stopPropagation(); handleQuantityChange(card.id, (card.quantity || 1) - 1); }}
            className="w-6 h-6 flex items-center justify-center text-white bg-red-500 rounded-l hover:bg-red-600 focus:outline-none active:bg-red-700 text-xs"
            aria-label="Decrease quantity"
            disabled={(card.quantity || 1) <= (card.type_line && card.type_line.toLowerCase().includes('basic land') ? 1 : 1) && !(card.type_line && card.type_line.toLowerCase().includes('basic land'))}
          >
            -
          </button>
          <span className="w-6 h-6 flex items-center justify-center bg-white text-black font-bold text-xs border-t border-b border-gray-300">
            {card.quantity || 1}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); handleQuantityChange(card.id, (card.quantity || 1) + 1); }}
            className="w-6 h-6 flex items-center justify-center text-white bg-green-500 rounded-r hover:bg-green-600 focus:outline-none active:bg-green-700 text-xs"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        {/* Remove Button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleRemoveCard(card.id); }}
          className="px-1.5 py-0.5 bg-red-600 text-white rounded text-xs hover:bg-red-700 focus:outline-none active:bg-red-800 ml-1"
          aria-label="Remove card"
        >
          Remove
        </button>
      </div>

      {/* Card Name - Below Controls Bar */}
      <div className="mt-0.5 text-center text-xs truncate px-1 w-full text-gray-700">{card.name}</div>
    </div>
  );
};

// Updated CardCategory to accept and pass onViewCardDetails
const CardCategory = ({ title, cards, onCardMove, forceOpenState, onViewCardDetails }) => {
  const { removeCard, updateCardQuantity } = useDeck();
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    if (forceOpenState !== undefined) {
      setIsOpen(forceOpenState);
    }
  }, [forceOpenState]);

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

  const handleRemoveCard = (cardId) => {
    removeCard(cardId);
  };

  const handleQuantityChange = (cardId, newQuantity) => {
    updateCardQuantity(cardId, newQuantity);
  };

  const categoryCardCount = cards.reduce((sum, card) => sum + (card.quantity || 1), 0);
  const toggleOpen = () => setIsOpen(!isOpen);

  return (
    <div 
      ref={drop}
      className={`bg-white rounded-xl shadow-lg mb-6 overflow-hidden transition-all duration-300 ease-in-out ${isOver ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
    >
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
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-200">
          {cards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 pt-4"> {/* Adjusted grid for smaller cards */}
              {cards.map(card => (
                <DraggableCard 
                  key={card.id} 
                  card={card} 
                  handleQuantityChange={handleQuantityChange} 
                  handleRemoveCard={handleRemoveCard} 
                  onViewCardDetails={onViewCardDetails} // Pass prop here
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