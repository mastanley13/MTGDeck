import React from 'react';

const CardDetailModal = ({ card, onClose }) => {
  if (!card) return null;

  // Prioritize art_crop, then normal, then large for the main image
  const mainImageUrl = card.imageUrl || (card.image_uris ? (card.image_uris.art_crop || card.image_uris.normal || card.image_uris.large) : null);
  const cardText = card.oracle_text || card.description; // Prefer oracle_text if available from full card data

  const formatsToShow = [
    { key: 'standard', name: 'Standard' },
    { key: 'pioneer', name: 'Pioneer' },
    { key: 'modern', name: 'Modern' },
    { key: 'legacy', name: 'Legacy' },
    { key: 'commander', name: 'Commander (EDH)' },
    { key: 'duel', name: 'Duel Commander' },
    { key: 'brawl', name: 'Brawl' },
    { key: 'historic', name: 'Historic' },
    { key: 'pauper', name: 'Pauper' },
  ];

  const getLegalityClass = (status) => {
    switch (status) {
      case 'legal':
        return 'text-green-400';
      case 'not_legal':
        return 'text-red-400';
      case 'banned':
        return 'text-red-600 font-semibold';
      case 'restricted':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col md:flex-row gap-6 relative text-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Card Image Section */} 
        <div className="md:w-1/2 flex-shrink-0 flex justify-center items-start">
          {mainImageUrl ? (
            <img 
              src={mainImageUrl} 
              alt={`Art for ${card.name}`} 
              className="rounded-lg max-w-full max-h-[80vh] object-contain shadow-lg border-2 border-gray-600"
            />
          ) : (
            <div className="w-full h-96 bg-gray-700 flex items-center justify-center text-gray-500 rounded-lg">
              No Image Available
            </div>
          )}
        </div>

        {/* Card Info Section */} 
        <div className="md:w-1/2 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700 pr-2">
          <h2 className="text-3xl font-bold mb-3 text-primary-300">{card.name}</h2>
          <div className="flex justify-between items-center mb-2 text-lg">
            <span className="text-gray-300">{card.type_line || card.type}</span>
            <span className="text-yellow-400 font-mono">{card.mana_cost}</span>
          </div>
          
          {cardText && (
            <div className="bg-gray-700 p-4 rounded-md mb-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
              {cardText.split('\n').map((line, index) => (
                <p key={index} className="mb-1">{line}</p>
              ))}
            </div>
          )}

          {(card.power || card.toughness) && (
            <p className="text-lg mb-2 text-gray-300">
              {card.power}/{card.toughness}
            </p>
          )}
          
          {card.loyalty && (
            <p className="text-lg mb-2 text-gray-300">Loyalty: {card.loyalty}</p>
          )}

          {/* EDHREC Rank and Game Changer status */}
          {(card.edhrec_rank || card.game_changer) && (
            <div className="mt-3 mb-2 py-2 border-t border-b border-gray-700">
              {card.edhrec_rank && (
                <p className="text-sm text-gray-300">
                  EDHREC Rank: <span className="font-semibold text-gray-100">{card.edhrec_rank.toLocaleString()}</span>
                </p>
              )}
              {card.game_changer && (
                <p className="text-sm text-green-400 font-semibold mt-1">
                  ★ Game Changer (Commander)
                </p>
              )}
            </div>
          )}

          {/* Format Legalities Section */}
          {card.legalities && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <h4 className="text-lg font-semibold mb-2 text-gray-200">Format Legalities:</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {formatsToShow.map(format => {
                  const status = card.legalities[format.key];
                  return (
                    <div key={format.key} className="flex justify-between">
                      <span className="text-gray-300">{format.name}:</span>
                      <span className={`${getLegalityClass(status)} capitalize`}>
                        {status ? status.replace('_', ' ') : 'Unknown'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-auto pt-2">
            Set: {card.set_name ? `${card.set_name} (${card.set?.toUpperCase()})` : 'N/A'} - Collector #: {card.collector_number || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardDetailModal; 