import React, { useState } from 'react';
import { useDeckGenerator } from '../../hooks/useDeckGenerator';
import { useDeck } from '../../context/DeckContext';
import "@saeris/typeface-beleren-bold";

/**
 * Component for automatically building a core 99-card deck with AI
 */
const DeckGeneratorCard = ({ onDraftComplete }) => {
  const { commander, totalCardCount } = useDeck();
  const [deckStyle, setDeckStyle] = useState('competitive');
  const { generateDeckCore, isLoading, error, progress } = useDeckGenerator();

  // Deck style options
  const styleOptions = [
    { id: 'competitive', label: 'Competitive' },
    { id: 'casual', label: 'Casual' },
    { id: 'budget', label: 'Budget Friendly' },
    { id: 'combo', label: 'Combo Focused' },
    { id: 'aggro', label: 'Aggressive' },
    { id: 'control', label: 'Control' },
    { id: 'tribal', label: 'Tribal' }
  ];

  // Handle deck style selection
  const handleStyleChange = (e) => {
    setDeckStyle(e.target.value);
  };

  // Handle generating the deck
  const handleGenerateDeck = async () => {
    const metadata = await generateDeckCore(deckStyle);
    if (metadata && onDraftComplete) {
      onDraftComplete(metadata);
    }
  };

  // Calculate non-commander cards count
  const nonCommanderCardCount = commander ? totalCardCount - 1 : 0;

  return (
    <div className="font-beleren bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg shadow-md overflow-hidden">
      <div className="p-4 text-white font-beleren">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Commander Deck Generator</h2>
          {commander && (
            <div className="text-xs bg-white bg-opacity-20 rounded-full px-3 py-1">
              {totalCardCount} / 100 cards
            </div>
          )}
        </div>
        
        <p className="text-sm mb-4 text-purple-100">
          Generate a complete 99-card deck (plus your commander) with optimal card selection
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-purple-100">
            Deck Style
          </label>
          <select
            value={deckStyle}
            onChange={handleStyleChange}
            className="w-full px-3 py-2 rounded-md text-sm bg-white bg-opacity-20 border border-purple-300 border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white"
            disabled={isLoading}
          >
            {styleOptions.map(option => (
              <option 
                key={option.id} 
                value={option.id}
                className="bg-indigo-700 text-white"
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {isLoading && progress > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-purple-200 mb-1">
              <span>Building deck...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-purple-200">
              {progress < 25 && "Analyzing commander..."}
              {progress >= 25 && progress < 60 && "Designing optimal deck..."}
              {progress >= 60 && progress < 85 && "Fetching cards..."}
              {progress >= 85 && "Finalizing deck..."}
            </div>
          </div>
        )}
        
        <button
          onClick={handleGenerateDeck}
          disabled={!commander || isLoading}
          className={`w-full py-3 rounded-md text-white text-sm font-bold flex items-center justify-center ${
            !commander || isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Building 99-Card Core...
            </>
          ) : (
            <span>
              Draft My 99-Card Core
            </span>
          )}
        </button>
        
        {error && (
          <div className="mt-3 text-sm bg-red-400 bg-opacity-25 text-white p-2 rounded">
            {error}
          </div>
        )}
        
        {!commander && (
          <div className="mt-3 text-xs text-purple-200">
            Select a commander first to generate a deck
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-white border-opacity-10 text-xs text-purple-200 space-y-2">
          <p><span className="font-semibold">Optimized 99-Card Deck:</span> Creates a deck with exactly 99 cards plus your commander</p>
          <p><span className="font-semibold">Card Balance:</span> Proper distribution of lands, ramp, card draw, removal, and strategy cards</p>
          <p><span className="font-semibold">Format Legal:</span> All cards comply with Commander format rules and color identity</p>
        </div>
      </div>
    </div>
  );
};

export default DeckGeneratorCard; 