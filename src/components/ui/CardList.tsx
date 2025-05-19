import React from 'react';
import CardDisplay, { Card } from './CardDisplay';

interface CardListProps {
  cards: Card[];
  layout?: 'grid' | 'list';
  onCardClick?: (card: Card) => void;
  emptyMessage?: string;
  groupByType?: boolean;
}

const CardList: React.FC<CardListProps> = ({ 
  cards, 
  layout = 'grid', 
  onCardClick, 
  emptyMessage = 'No cards to display',
  groupByType = false
}) => {
  if (cards.length === 0) {
    return (
      <div className="text-center py-4 text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  // Function to group cards by their primary type
  const groupCardsByType = (cardsToGroup: Card[]) => {
    const grouped: { [key: string]: Card[] } = {};
    
    cardsToGroup.forEach(card => {
      // Extract the main card type (Creature, Instant, Sorcery, etc.)
      const mainType = card.type.split('—')[0].trim();
      
      if (!grouped[mainType]) {
        grouped[mainType] = [];
      }
      
      grouped[mainType].push(card);
    });
    
    return grouped;
  };

  if (layout === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 text-gray-300">
        {cards.map(card => (
          <div key={card.id} className="hover:shadow-md transition-shadow">
            <CardDisplay 
              card={card} 
              size="medium" 
              showDetails={true}
              onClick={() => onCardClick && onCardClick(card)}
            />
          </div>
        ))}
      </div>
    );
  }

  // List layout
  if (groupByType) {
    const groupedCards = groupCardsByType(cards);
    
    return (
      <div className="space-y-4 text-gray-300">
        {Object.entries(groupedCards).map(([type, cardsOfType]) => (
          <div key={type}>
            <h4 className="text-lg font-medium mb-2 text-logoScheme-gold">{type} ({cardsOfType.length})</h4>
            <div className="space-y-1">
              {cardsOfType.map(card => (
                <div 
                  key={card.id} 
                  className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer"
                  onClick={() => onCardClick && onCardClick(card)}
                >
                  <CardDisplay card={card} size="small" />
                  <div className="ml-3">
                    <p className="font-medium text-gray-100">{card.name}</p>
                    <p className="text-xs text-gray-400">{card.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Simple list layout
  return (
    <div className="space-y-1 text-gray-300">
      {cards.map(card => (
        <div 
          key={card.id} 
          className="flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer"
          onClick={() => onCardClick && onCardClick(card)}
        >
          <CardDisplay card={card} size="small" />
          <div className="ml-3">
            <p className="font-medium text-gray-100">{card.name}</p>
            <p className="text-xs text-gray-400">{card.type}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardList; 