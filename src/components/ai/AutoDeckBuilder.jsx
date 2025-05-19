import React, { useState, useEffect } from 'react';
import { useAutoDeckBuilder } from '../../hooks/useAutoDeckBuilder';
import { useDeck } from '../../context/DeckContext';

/**
 * Component for automatically building complete decks with AI
 */
const AutoDeckBuilder = () => {
  const { commander, totalCardCount } = useDeck();
  const [deckStyle, setDeckStyle] = useState('competitive');
  const { buildCompleteDeck, isLoading, error, progress } = useAutoDeckBuilder();
  
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const styleOptions = [
    { id: 'competitive', label: 'Competitive' },
    { id: 'casual', label: 'Casual' },
    { id: 'budget', label: 'Budget Friendly' },
    { id: 'combo', label: 'Combo Focused' },
    { id: 'aggro', label: 'Aggressive' },
    { id: 'control', label: 'Control' },
    { id: 'tribal', label: 'Tribal' }
  ];

  const handleStyleChange = (e) => {
    setDeckStyle(e.target.value);
  };

  const handleBuildDeck = () => {
    buildCompleteDeck(deckStyle);
  };

  const nonCommanderCardCount = commander ? totalCardCount - 1 : 0;

  return (
    <div className="bg-logoScheme-darkGray rounded-lg shadow-xl overflow-hidden border border-logoScheme-gold">
      {/* Header - Clickable to toggle */}
      <div 
        className="p-5 sm:p-6 text-gray-100 cursor-pointer flex justify-between items-center group"
        onClick={toggleExpand}
      >
        <div className="flex items-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-logoScheme-gold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>A.I. Deck Generator</h2>
        </div>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 transition-transform duration-200 text-gray-400 group-hover:text-logoScheme-gold ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-5 sm:p-6 pt-0 text-gray-100">
          {commander && (
            <div className="text-sm bg-gray-700 text-logoScheme-gold rounded-full px-3 py-1 mb-4 inline-block font-medium shadow">
              {commander.name}
            </div>
          )}
          <p className="text-base mb-6 text-gray-300 leading-relaxed">
            Unleash the power of AI to craft a unique 99-card Commander deck, perfectly tuned to your chosen leader and desired play style.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2 text-logoScheme-gold">
              Deck Archetype
            </label>
            <select
              value={deckStyle}
              onChange={handleStyleChange}
              className="w-full px-4 py-3 rounded-lg text-sm bg-gray-700 border border-gray-500 text-gray-100 focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:border-logoScheme-gold placeholder-gray-400 shadow-sm"
              disabled={isLoading}
            >
              {styleOptions.map(option => (
                <option 
                  key={option.id} 
                  value={option.id}
                  className="bg-gray-800 text-gray-100 hover:bg-gray-600"
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {isLoading && progress > 0 && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-100 mb-1">
                <span>AI Weaving Your Legend...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 shadow-inner">
                <div 
                  className="bg-logoScheme-gold h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-300 h-4 italic">
                {progress < 20 && "Consulting the Rifts..."}
                {progress >= 20 && progress < 40 && "Gathering Mana Signatures..."}
                {progress >= 40 && progress < 60 && "Summoning Strategic Allies..."}
                {progress >= 60 && progress < 80 && "Forging Artifacts & Spells..."}
                {progress >= 80 && "Binding the Deck's Essence..."}
              </div>
            </div>
          )}
          
          <button
            onClick={handleBuildDeck}
            disabled={!commander || isLoading}
            className={`w-full py-3.5 px-6 rounded-lg text-base font-semibold flex items-center justify-center transition-all duration-150 ease-in-out shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-logoScheme-darkGray ${
              !commander || isLoading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-logoScheme-gold hover:bg-yellow-400 text-logoScheme-darkGray focus:ring-logoScheme-gold'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-logoScheme-darkGray" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>AI Weaving Your Legend...</span>
              </>
            ) : (
              <span>Forge My Deck</span>
            )}
          </button>
          
          {error && (
            <div className="mt-4 text-sm bg-red-900 bg-opacity-75 border border-logoScheme-red text-red-200 p-3 rounded-md shadow">
              {error}
            </div>
          )}
          
          {!commander && !isLoading && ( // Added !isLoading to prevent showing this if it's loading initially without commander
            <div className="mt-4 text-sm text-gray-300 p-3 bg-gray-800 rounded-md border border-gray-600 text-center">
              Please select your Commander to begin the forging.
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-logoScheme-brown text-xs text-gray-300 space-y-2.5">
            <div className="flex items-start">
              <svg className="w-3.5 h-3.5 mr-2 mt-0.5 text-logoScheme-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              <div><span className="font-medium text-logoScheme-gold">Optimized Deck Size:</span> Crafted for exactly 99 cards, plus your mighty Commander.</div>
            </div>
            <div className="flex items-start">
              <svg className="w-3.5 h-3.5 mr-2 mt-0.5 text-logoScheme-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              <div><span className="font-medium text-logoScheme-gold">Strategic Balance:</span> Ensures a potent mix of lands, ramp, card draw, removal, and core strategy cards.</div>
            </div>
            <div className="flex items-start">
              <svg className="w-3.5 h-3.5 mr-2 mt-0.5 text-logoScheme-blue flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
              <div><span className="font-medium text-logoScheme-gold">Format Compliant:</span> All cards adhere to Commander format rules and your leader's color identity.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDeckBuilder; 