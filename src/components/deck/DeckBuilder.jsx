import React, { useState, useCallback } from 'react';
import { useDeck } from '../../context/DeckContext';
import CardCategory from './CardCategory';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Helper function to parse Oracle text, style mana symbols, and italicize reminder text
const parseOracleText = (text) => {
  if (!text) return [];

  const paragraphs = text.split('\n');
  
  return paragraphs.map((paragraph, pIndex) => {
    // First, split by mana symbols to preserve them
    const partsWithManaSymbols = paragraph.split(/(\{[^}]+\})/g);

    return (
      <p key={pIndex} className="mb-2 last:mb-0">
        {partsWithManaSymbols.map((part, partIndex) => {
          if (part.startsWith('{') && part.endsWith('}')) {
            // Handle Mana Symbols (as before)
            const symbol = part.substring(1, part.length - 1).toUpperCase();
            let bgColor = 'bg-gray-300';
            let textColor = 'text-black';
            let symbolText = symbol;
            // Mana symbol styling switch (condensed for brevity, same as before)
            switch (symbol) {
                case 'W': bgColor = 'bg-yellow-200'; symbolText = 'W'; break;
                case 'U': bgColor = 'bg-blue-300'; symbolText = 'U'; break;
                case 'B': bgColor = 'bg-gray-700'; textColor = 'text-white'; symbolText = 'B'; break;
                case 'R': bgColor = 'bg-red-400'; textColor = 'text-white'; symbolText = 'R'; break;
                case 'G': bgColor = 'bg-green-400'; textColor = 'text-white'; symbolText = 'G'; break;
                case 'C': bgColor = 'bg-gray-400'; symbolText = 'C'; break;
                case 'X': bgColor = 'bg-purple-300'; symbolText = 'X'; break;
                case 'T': bgColor = 'bg-orange-300'; symbolText = 'T'; break;
                default: if (!isNaN(symbol)) { bgColor = 'bg-gray-200'; } else { bgColor = 'bg-gray-200'; } break;
            }
            return (
              <span 
                key={`${pIndex}-mana-${partIndex}`} 
                className={`inline-flex items-center justify-center w-5 h-5 ${bgColor} ${textColor} rounded-full text-xs font-mono mx-0.5 shadow-sm border border-gray-400/50 align-middle`}
                title={part}
              >
                {symbolText}
              </span>
            );
          } else {
            // For non-mana symbol parts, split by and italicize reminder text
            const textSegments = part.split(/(\([^)]+\))/g); // Split by parenthesized text, keeping delimiters
            return textSegments.map((segment, segIndex) => {
              if (segment && segment.startsWith('(') && segment.endsWith(')')) {
                // Apply italic styling for reminder text, slightly muted
                return <em key={`${pIndex}-reminder-${partIndex}-${segIndex}`} className="italic text-slate-600 opacity-90 px-px">{segment}</em>;
              }
              // Filter out empty strings that can result from splitting if the part itself was just a parenthesized segment
              if (segment) { 
                return <span key={`${pIndex}-text-${partIndex}-${segIndex}`}>{segment}</span>;
              }
              return null;
            });
          }
        })}
      </p>
    );
  });
};

const DeckBuilder = ({ deckSaveControls, onViewCardDetails }) => {
  const { 
    commander, 
    cards, 
    totalCardCount, 
    cardsByType, 
    updateCardCategory 
  } = useDeck();
  
  // State for global expand/collapse
  const [allCategoriesOpen, setAllCategoriesOpen] = useState(undefined); // undefined initially, then true/false
  
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
      <div className="text-center p-8 bg-gray-100 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-2">Select a Commander First</h2>
        <p className="text-gray-600">
          You need to select a commander before building your deck.
        </p>
      </div>
    );
  }
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4">
        {/* Render deckSaveControls at the top if commander is selected */}
        {commander && deckSaveControls}

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Deck Builder</h1>
          <div className="text-gray-600">
            {totalCardCount} / 100 cards
          </div>
        </div>
        
        {/* Global Expand/Collapse Buttons */} 
        {cards.length > 0 && Object.keys(cardsByType).length > 0 && (
          <div className="mb-4 flex gap-2">
            <button 
              onClick={() => setAllCategoriesOpen(true)}
              className="p-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-150"
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
              className="p-2 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 active:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors duration-150"
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
        
        {/* Commander display - Simplified to show only the card image filling the container */}
        <div className="mb-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-2xl transform transition-all hover:scale-[1.01] overflow-hidden aspect-[63/88]"> 
          {/* The container itself now dictates aspect ratio for a consistent card shape */}
          {commander.image_uris && commander.image_uris.normal ? (
            <img 
              src={commander.image_uris.normal} 
              alt={commander.name}
              className="w-full h-full object-cover rounded-xl" // object-cover to fill, rounded-xl to match container
            />
          ) : (
            // Fallback if no image, maintaining aspect ratio and appearance
            <div className="w-full h-full flex items-center justify-center bg-slate-800 rounded-xl">
              <p className="text-slate-400 text-lg">Commander Image Unavailable</p>
            </div>
          )}
        </div>
        
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

export default DeckBuilder; 