import React from 'react';
import { parseManaSymbols } from '../../utils/manaSymbols';
import GameChangerTooltip from '../ui/GameChangerTooltip';

const DeckList = ({ cards, commander, onCardClick }) => {
  // Group cards by type
  const groupedCards = cards.reduce((acc, card) => {
    const type = card.type_line?.split('—')[0].trim() || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(card);
    return acc;
  }, {});

  // Sort types with Creatures and Lands at top
  const sortedTypes = Object.keys(groupedCards).sort((a, b) => {
    if (a.includes('Creature')) return -1;
    if (b.includes('Creature')) return 1;
    if (a.includes('Land')) return -1;
    if (b.includes('Land')) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Commander Section */}
      {commander && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-primary-400 mb-3">Commander</h3>
          <div 
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
            onClick={() => onCardClick(commander)}
          >
            <div className="flex items-center space-x-2">
              <span className="text-white">{commander.name}</span>
              {commander.game_changer && (
                <GameChangerTooltip iconOnly className="ml-1" />
              )}
            </div>
            {commander.mana_cost && (
              <div className="flex items-center space-x-1">
                {parseManaSymbols(commander.mana_cost)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rest of the deck */}
      {sortedTypes.map(type => (
        <div key={type}>
          <h3 className="text-lg font-semibold text-primary-400 mb-3">
            {type} ({groupedCards[type].length})
          </h3>
          <div className="space-y-1">
            {groupedCards[type]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(card => (
                <div 
                  key={card.id || card.name}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                  onClick={() => onCardClick(card)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">{card.quantity}x</span>
                    <span className="text-white">{card.name}</span>
                    {card.game_changer && (
                      <GameChangerTooltip iconOnly className="ml-1" />
                    )}
                  </div>
                  {card.mana_cost && (
                    <div className="flex items-center space-x-1">
                      {parseManaSymbols(card.mana_cost)}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeckList; 