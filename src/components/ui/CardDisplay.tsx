import React from 'react';

export interface Card {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  text?: string;
  manaValue?: number;
  colors?: string[];
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
  const sizeClasses = {
    small: 'w-12 h-16',
    medium: 'w-36 h-50',
    large: 'w-48 h-68'
  };

  return (
    <div 
      className={`relative ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <img 
        src={card.imageUrl} 
        alt={card.name} 
        className={`rounded-lg shadow-sm ${sizeClasses[size]} object-cover border border-logoScheme-brown`}
      />
      
      {showDetails && (
        <div className="mt-2">
          <h3 className="font-medium text-sm text-gray-100">{card.name}</h3>
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