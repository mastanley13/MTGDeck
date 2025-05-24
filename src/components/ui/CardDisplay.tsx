import React, { useState } from 'react';

export interface Card {
  id: string;
  name: string;
  imageUrl?: string;
  type: string;
  text?: string;
  manaValue?: number;
  colors?: string[];
  // Scryfall card data support
  image_uris?: {
    normal?: string;
    large?: string;
    small?: string;
    png?: string;
  };
  card_faces?: Array<{
    name?: string;
    image_uris?: {
      normal?: string;
      large?: string;
      small?: string;
      png?: string;
    };
  }>;
}

interface CardDisplayProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  showDetails?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ 
  card, 
  size = 'medium', 
  onClick, 
  showDetails = false
}) => {
  const [currentFace, setCurrentFace] = useState(0);

  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-36 h-50',
    large: 'w-48 h-68'
  };

  // Enhanced function to get all card face images
  const getAllCardFaceImages = (card: Card) => {
    const faces: Array<{
      name: string;
      imageUrl: string;
      faceIndex: number;
    }> = [];

    try {
      // Simple imageUrl (legacy support)
      if (card.imageUrl) {
        faces.push({
          name: card.name,
          imageUrl: card.imageUrl,
          faceIndex: 0
        });
      }
      // Single-faced card with direct image_uris
      else if (card.image_uris && !card.card_faces) {
        const imageUrl = card.image_uris.normal || card.image_uris.large || card.image_uris.small || card.image_uris.png;
        if (imageUrl) {
          faces.push({
            name: card.name,
            imageUrl: imageUrl,
            faceIndex: 0
          });
        }
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
                faceIndex: index
              });
            }
          }
        });
      }
    } catch (error) {
      console.error('CardDisplay: Error processing card image URIs:', error, card);
    }

    return faces;
  };

  const cardFaces = getAllCardFaceImages(card);
  const isDoubleFaced = cardFaces.length > 1;
  const currentFaceData = cardFaces[currentFace] || cardFaces[0];

  const toggleFace = () => {
    if (isDoubleFaced) {
      setCurrentFace(prev => (prev + 1) % cardFaces.length);
    }
  };

  if (!currentFaceData) {
    return (
      <div 
        className={`relative ${onClick ? 'cursor-pointer' : ''} bg-gray-700 rounded-lg ${sizeClasses[size]} flex items-center justify-center border border-logoScheme-brown`}
        onClick={onClick}
      >
        <span className="text-xs text-gray-300 text-center p-2">{card.name}</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer' : ''} group`}
      onClick={onClick}
    >
      <img 
        src={currentFaceData.imageUrl} 
        alt={currentFaceData.name} 
        className={`rounded-lg shadow-sm ${sizeClasses[size]} object-cover border border-logoScheme-brown`}
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
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center z-5"
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
      
      {showDetails && (
        <div className="mt-2">
          <h3 className="font-medium text-sm text-gray-100">{currentFaceData.name}</h3>
          <p className="text-xs text-gray-400">{card.type}</p>
          {card.text && (
            <p className="text-xs mt-1 text-gray-300">{card.text}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CardDisplay; 