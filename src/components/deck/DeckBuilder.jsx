import React, { useState, useCallback } from 'react';
import { useDeck } from '../../context/DeckContext';
import CardCategory from './CardCategory';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CardDetailModal from '../ui/CardDetailModal.jsx';
import ManaSymbol from '../ui/ManaSymbol.jsx';
import useAICommanderSummary from '../../hooks/useAICommanderSummary.js';
import { parseManaSymbols } from '../../utils/manaSymbols';

// Helper function to parse Oracle text, style mana symbols, and italicize reminder text
const parseOracleTextWithReminders = (text) => {
  if (!text) return [];

  const paragraphs = text.split('\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    // Split by mana symbols AND reminder text, keeping delimiters
    const parts = paragraph.split(/(\{[^}]+\}|\([^)]+\))/g);

    return (
      <p key={pIndex} className="mb-2 last:mb-0">
        {parts.map((part, partIndex) => {
          if (!part) return null; // Skip empty strings from split

          if (part.startsWith('{') && part.endsWith('}')) {
            // It's a mana symbol, use the global parser
            return parseManaSymbols(part); 
          } else if (part.startsWith('(') && part.endsWith(')')) {
            // It's reminder text
            return <em key={`${pIndex}-reminder-${partIndex}`} className="italic text-gray-400 opacity-90 px-px">{part}</em>;
          } else {
            // Regular text
            return <span key={`${pIndex}-text-${partIndex}`}>{part}</span>;
          }
        })}
      </p>
    );
  });
};

// Copied from CardDetailModal.jsx for direct use
const formatsToShow = [
  { key: 'standard', name: 'Standard' },
  { key: 'pioneer', name: 'Pioneer' },
  { key: 'modern', name: 'Modern' },
  { key: 'legacy', name: 'Legacy' },
  { key: 'commander', name: 'Commander' },
  { key: 'duel', name: 'Duel' },
  { key: 'brawl', name: 'Brawl' },
  { key: 'historic', name: 'Historic' },
  { key: 'pauper', name: 'Pauper' },
];

const getLegalityClass = (status) => {
  switch (status) {
    case 'legal':
      return 'text-logoScheme-green';
    case 'not_legal':
      return 'text-logoScheme-red';
    case 'banned':
      return 'text-logoScheme-red font-semibold';
    case 'restricted':
      return 'text-yellow-400';
    default:
      return 'text-gray-500';
  }
};

// Helper function to parse mana cost string into individual symbols
const parseManaCostString = (costString) => {
  if (!costString) return [];
  // Regex to match mana symbols like {W}, {2/U}, {X}, etc.
  const symbolRegex = /\{([^}]+)\}/g;
  let match;
  const symbols = [];
  while ((match = symbolRegex.exec(costString)) !== null) {
    symbols.push(match[0]); // Store the full symbol e.g. "{W}"
  }
  return symbols;
};

const DeckBuilderAI = ({ deckSaveControls, onViewCardDetails }) => {
  const { 
    commander, 
    cards, 
    totalCardCount, 
    cardsByType, 
    updateCardCategory 
  } = useDeck();
  
  // State for global expand/collapse
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(undefined); // undefined initially, then true/false
  const [isCommanderModalOpen, setIsCommanderModalOpen] = useState(false);
  
  // Use the AI Summary hook
  const { summary: aiSummary, isLoading: isLoadingAISummary, error: aiSummaryError } = useAICommanderSummary(commander);

  // Handle card being moved between categories
  const handleCardMove = useCallback((cardId, targetCategory) => {
    // In a real implementation, this would update card categories in the deck context
    console.log(`Moving card ${cardId} to category ${targetCategory}`);
    
    // If we had a updateCardCategory function in DeckContext:
    if (typeof updateCardCategory === 'function') {
      updateCardCategory(cardId, targetCategory);
    }
  }, [updateCardCategory]);
  
  // Check if commander is selected
  if (!commander) {
    return (
      <div className="text-center p-8 bg-logoScheme-darkGray border border-logoScheme-brown rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2 text-logoScheme-gold">Select a Commander First</h2>
        <p className="text-gray-300">
          You need to select a commander before building your deck.
        </p>
      </div>
    );
  }
  
  const commanderLegality = commander.legalities?.commander;
  const manaCostForDisplay = commander.mana_cost ? commander.mana_cost.match(/\{([^}]+)\}/g) || [] : [];
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 text-gray-300">
        {/* Render deckSaveControls at the top if commander is selected */}
        {commander && deckSaveControls}

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-primary-400">Deck Builder AI</h1>
          <div className="text-gray-400">
            {totalCardCount} / 100 cards
          </div>
        </div>
        
        {/* Global Expand/Collapse Buttons */} 
        {cards.length > 0 && Object.keys(cardsByType).length > 0 && (
          <div className="mb-4 flex gap-2">
            <button 
              onClick={() => setAllCategoriesOpen(true)}
              className="p-2 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 active:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-150"
              aria-label="Expand All Categories"
              title="Expand All Categories"
            >
              {/* Heroicon: View Boards (as stacked lines) or CollectionIcon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M5 11v6m14-6v6" />{/* Placeholder - Collection icon */}
              </svg>
              <span className="sr-only">Expand All Categories</span>
            </button>
            <button 
              onClick={() => setAllCategoriesOpen(false)}
              className="p-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 active:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-150"
              aria-label="Collapse All Categories"
              title="Collapse All Categories"
            >
              {/* Heroicon: MinusSm */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
              </svg>
              <span className="sr-only">Collapse All Categories</span>
            </button>
          </div>
        )}
        
        {/* Enhanced Commander Preview */}
        <div className="mb-8" data-commander-section>
          <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center space-x-3">
            <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>👑 Your Commander</span>
          </h3>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-3xl blur-xl opacity-60"></div>
            <div
              onClick={() => {
                if (commander) setIsCommanderModalOpen(true);
              }}
              className="relative group max-w-4xl mx-auto glassmorphism-card border-primary-500/30 shadow-modern-primary hover:shadow-modern-primary hover:scale-[1.02] transition-all duration-300 ease-in-out p-6 md:p-8 cursor-pointer"
            >
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              {/* Left Column: Image - Stacks on top on mobile */}
              <div className="md:w-1/3 flex-shrink-0 self-start mx-auto md:mx-0 max-w-xs md:max-w-none">
                {commander.image_uris && (commander.image_uris.art_crop || commander.image_uris.normal) ? (
                  <img
                    src={commander.image_uris.art_crop || commander.image_uris.normal}
                    alt={`Commander: ${commander.name}`}
                    className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-700"
                  />
                ) : (
                  <div className="w-full aspect-[63/88] flex items-center justify-center bg-slate-700 rounded-lg p-4">
                    <p className="text-slate-400 text-center">{commander.name}<br/>(Image not available)</p>
                  </div>
                )}
              </div>

              {/* Right Column: Details - Stacks below on mobile */}
              <div className="md:w-2/3 flex flex-col text-gray-300">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-1">
                    <h4 className="text-2xl lg:text-3xl font-bold text-primary-400 mb-1 sm:mb-0 order-1 sm:order-none">{commander.name}</h4>
                    {/* Mana Cost using ManaSymbol */}
                    {manaCostForDisplay.length > 0 && (
                      <div className="flex items-center order-2 sm:order-none sm:ml-4">
                        {manaCostForDisplay.map((symbol, index) => (
                          <ManaSymbol key={index} symbol={symbol} size="lg" />
                        ))}
                      </div>
                    )}
                </div>
                
                {/* Color Identity Badges using ManaSymbol */}
                {commander.color_identity && commander.color_identity.length > 0 && (
                  <div className="flex items-center mb-2 order-3 sm:order-none">
                    <span className="text-xs text-gray-400 mr-1.5">Colors:</span>
                    {commander.color_identity.map(color => (
                      // Assuming color is like 'W', 'U'. ManaSymbol expects format like {W}
                      <ManaSymbol key={color} symbol={`{${color}}`} size="sm" />
                    ))}
                  </div>
                )}
                
                <div className="flex justify-between items-baseline mb-2 order-4 sm:order-none">
                  <span className="text-gray-400 text-sm lg:text-base">{commander.type_line}</span>
                </div>

                {/* Commander Legality Highlight */}
                {(commanderLegality === 'banned' || commanderLegality === 'restricted') && (
                  <div className={`p-2 mb-3 rounded-md text-sm font-semibold text-center order-5 sm:order-none ${commanderLegality === 'banned' ? 'bg-red-700 text-white' : 'bg-yellow-600 text-black'}`}>
                    This commander is <span className="uppercase">{commanderLegality}</span> in the Commander format.
                  </div>
                )}

                {commander.oracle_text && (
                  <div className="bg-gray-700/50 p-3 rounded-md mb-3 max-h-32 md:max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-750 border border-gray-600/50 text-xs leading-relaxed order-6 sm:order-none">
                    {parseOracleTextWithReminders(commander.oracle_text)}
                  </div>
                )}

                <div className="flex gap-4 mb-2 text-sm lg:text-base order-7 sm:order-none">
                  {(commander.power || commander.toughness) && (
                    <p>P/T: <span className="font-semibold">{commander.power}/{commander.toughness}</span></p>
                  )}
                  {commander.loyalty && (
                    <p>Loyalty: <span className="font-semibold">{commander.loyalty}</span></p>
                  )}
                </div>
                
                {/* AI Description Section - Updated */}
                <div className="mt-1 mb-3 order-8 sm:order-none">
                  <h5 className="text-sm lg:text-base font-semibold text-primary-400 mb-1">AI Strategic Overview:</h5>
                  {isLoadingAISummary && <p className="text-xs italic text-gray-400">The Oracle is contemplating {commander.name}...</p>}
                  {!isLoadingAISummary && aiSummaryError && <p className="text-xs italic text-red-400">{aiSummaryError}</p>}
                  {!isLoadingAISummary && !aiSummaryError && aiSummary && (
                    <p className="text-xs lg:text-sm italic bg-gray-700/70 p-2 rounded-md border border-gray-600/50">
                      {aiSummary}
                    </p>
                  )}
                  {!isLoadingAISummary && !aiSummaryError && !aiSummary && (
                     <p className="text-xs italic text-gray-500">No strategic overview available at this moment.</p>
                  )}
                </div>
                
                {(commander.edhrec_rank || commander.game_changer) && (
                    <div className="my-2 py-2 border-t border-b border-logoScheme-brown/30 text-xs lg:text-sm order-9 sm:order-none">
                      {commander.edhrec_rank && (
                        <p>EDHREC Rank: <span className="font-semibold text-gray-100">{commander.edhrec_rank.toLocaleString()}</span></p>
                      )}
                      {commander.game_changer && (
                        <p className="text-logoScheme-green font-semibold mt-0.5">★ Game Changer (Based on EDHREC data)</p>
                      )}
                    </div>
                  )}

                {commander.legalities && (
                  <div className="mt-1 text-xs lg:text-sm order-10 sm:order-none">
                    <h5 className="text-sm lg:text-base font-semibold text-primary-400 mb-1">Format Legalities:</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-0.5">
                      {formatsToShow.map(format => {
                        const status = commander.legalities[format.key];
                        return (
                          <div key={format.key} className="flex justify-between items-center text-gray-400">
                            <span>{format.name}:</span>
                            <span className={`${getLegalityClass(status)} capitalize text-xs`}>
                              {status ? status.replace('_', ' ') : 'N/A'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-3 pt-2 border-t border-logoScheme-brown/30 order-11 sm:order-none">
                    Set: {commander.set_name ? `${commander.set_name} (${commander.set?.toUpperCase()})` : 'N/A'} - Collector #: {commander.collector_number || 'N/A'}
                </p>
                <p className="text-center text-sm text-primary-400 group-hover:text-primary-300 transition-colors mt-4 font-semibold order-12 sm:order-none">
                  Click for Full Card View
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>

        {isCommanderModalOpen && commander && (
          <CardDetailModal
            card={commander}
            onClose={() => setIsCommanderModalOpen(false)}
          />
        )}
        
        {/* Default card categories based on card types */}
        {Object.entries(cardsByType).map(([type, typeCards]) => (
          <CardCategory 
            key={type}
            title={type}
            cards={typeCards}
            onCardMove={handleCardMove}
            forceOpenState={allCategoriesOpen}
            onViewCardDetails={onViewCardDetails}
          />
        ))}
        
        {cards.length === 0 && commander && (
          <div className="text-center p-8 text-gray-600 bg-gray-100 rounded-lg">
            <p className="text-lg mb-2">Your deck is empty</p>
            <p className="text-sm">
              Use the Search tab to add cards to your deck
            </p>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default DeckBuilderAI; 