import React, { useState, useEffect } from 'react';
import { useDeck } from '../../context/DeckContext';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDrag, useDrop } from 'react-dnd';
import EnhancedCardImage from '../ui/EnhancedCardImage';

// Enhanced DraggableCard with optimized image handling
const DraggableCard = ({ card, handleQuantityChange, handleRemoveCard, onViewCardDetails }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { id: card.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const handleViewDetailsClick = (e) => {
    e.stopPropagation();
    if (onViewCardDetails) {
      onViewCardDetails(card);
    }
  };

  const gameChangerEffect = card.game_changer 
    ? 'ring-2 ring-yellow-400 border-yellow-400/50' 
    : 'border-slate-700/50';

  return (
    <div 
      ref={drag}
      className={`card-item flex flex-col h-full ${isDragging ? 'opacity-50' : ''} group`}
    >
      {/* Enhanced Card Image Area - Clickable for details */}
      <div 
        className={`relative w-full cursor-pointer group/image overflow-hidden ${gameChangerEffect} rounded-lg border transition-all duration-300`}
        onClick={handleViewDetailsClick}
      >
        <EnhancedCardImage
          card={card}
          context="LIST_VIEW"
          aspectRatio="card"
          className="w-full shadow-md group-hover:opacity-80 transition-opacity duration-150"
          showDoubleFaceToggle={false}
          alt={`${card.name} card in deck`}
        />
        
        {/* Game Changer Badge */}
        {card.game_changer && (
          <div className="absolute bottom-2 right-2 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-full p-1.5">
            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )}
      </div>

      {/* Controls Bar - Below Image */}
      <div className="flex items-center justify-between p-1 mt-1 bg-gray-700/50 rounded-lg">
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
          <span className="w-6 h-6 flex items-center justify-center bg-gray-800 text-gray-100 font-bold text-xs border-t border-b border-gray-600">
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
          className="px-1.5 py-0.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 focus:outline-none active:bg-red-700 ml-1"
          aria-label="Remove card"
        >
          Remove
        </button>
      </div>

      {/* Card Name - Below Controls Bar */}
      <div className="mt-1 text-center text-xs truncate px-1 w-full text-gray-300">{card.name}</div>
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
      className={`glassmorphism-card border-slate-700/50 mb-6 overflow-hidden transition-all duration-300 ease-in-out ${isOver ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-slate-900/50 border-primary-500/50' : ''}`}
    >
      <div 
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-slate-800/30 active:bg-slate-800/50 transition-colors duration-150"
        onClick={toggleOpen}
      >
        <h3 className="text-lg font-medium text-primary-400">
          {title} 
          <span className="text-sm text-slate-400 ml-2">({categoryCardCount})</span>
        </h3>
        <svg 
          className={`w-5 h-5 text-slate-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-slate-700/50">
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
            <div className="text-center p-6 text-slate-400 bg-slate-800/30 rounded-lg mt-4 border border-slate-700/50">
              <p>No cards in this category. You can drag cards here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CardCategory; 