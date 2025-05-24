import React, { useState, useEffect } from 'react';
import { useDeck } from '../../context/DeckContext';
import { getCardImageUris } from '../../utils/scryfallAPI';
import { useDrag, useDrop } from 'react-dnd';

// Enhanced DraggableCard with double-faced card support
const DraggableCard = ({ card, handleQuantityChange, handleRemoveCard, onViewCardDetails }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'CARD',
    item: { id: card.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const [currentFace, setCurrentFace] = useState(0);

  // Enhanced function to get all card face images
  const getAllCardFaceImages = (card) => {
    if (!card) return [];

    try {
      const faces = [];

      // Single-faced card with direct image_uris
      if (card.image_uris && !card.card_faces) {
        faces.push({
          name: card.name,
          imageUrl: card.image_uris.normal || card.image_uris.large || card.image_uris.small || card.image_uris.png,
          uris: card.image_uris,
          faceIndex: 0
        });
      }
      // Multi-faced card
      else if (card.card_faces && card.card_faces.length > 0) {
        card.card_faces.forEach((face, index) => {
          if (face.image_uris) {
            const imageUrl = face.image_uris.normal || face.image_uris.large || face.image_uris.small || face.image_uris.png;
            if (imageUrl) {
              faces.push({
                name: face.name || `${card.name} (Face ${index + 1})`,
                imageUrl: imageUrl,
                uris: face.image_uris,
                faceIndex: index
              });
            }
          }
        });
      }

      return faces;
    } catch (error) {
      console.error('DraggableCard: Error processing card image URIs:', error, card);
      return [];
    }
  };

  const cardFaces = getAllCardFaceImages(card);
  const isDoubleFaced = cardFaces.length > 1;
  const currentFaceData = cardFaces[currentFace] || cardFaces[0];

  const toggleFace = () => {
    if (isDoubleFaced) {
      setCurrentFace(prev => (prev + 1) % cardFaces.length);
    }
  };
  
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
        className="relative w-full cursor-pointer group/image" 
        onClick={handleViewDetailsClick} // Open modal on image click
      >
        {currentFaceData ? (
          <>
            <img
              src={currentFaceData.imageUrl}
              alt={currentFaceData.name}
              className="rounded-t-lg shadow-md w-full object-cover aspect-[63/88] group-hover:opacity-80 transition-opacity duration-150 border border-slate-700/50"
            />
            
            {/* Double-faced card indicators */}
            {isDoubleFaced && (
              <>
                {/* DFC indicator */}
                <div className="absolute top-1 left-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-1 py-0.5 rounded-full font-semibold shadow-lg z-10">
                  DFC
                </div>
                
                {/* Face counter */}
                <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded-full z-10">
                  {currentFace + 1}/{cardFaces.length}
                </div>
                
                {/* Flip button - shows on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFace();
                  }}
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-t-lg flex items-center justify-center z-5"
                  title={`Click to flip to ${cardFaces[(currentFace + 1) % cardFaces.length]?.name || 'other side'}`}
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-white font-semibold flex items-center space-x-1 text-xs">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Flip</span>
                  </div>
                </button>
              </>
            )}
          </>
        ) : (
          <div className="bg-gray-700 rounded-t-lg shadow-md w-full aspect-[63/88] flex items-center justify-center p-2 group-hover:opacity-80 transition-opacity duration-150">
            <span className="text-xs text-center text-gray-200">{card.name}</span>
          </div>
        )}
      </div>

      {/* Controls Bar - Below Image */}
      <div className="flex items-center justify-between p-1 bg-gray-700 rounded-b-lg border-t border-gray-600">
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
      <div className="mt-0.5 text-center text-xs truncate px-1 w-full text-gray-300">{card.name}</div>
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