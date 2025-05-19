import React, { useState } from 'react';
import { useAISuggestions } from '../../hooks/useAISuggestions';
import SuggestedCard from './SuggestedCard';
import { useDeck } from '../../context/DeckContext';

/**
 * Panel component for displaying and managing AI-suggested cards
 */
const SuggestionPanel = () => {
  const { commander } = useDeck();
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [deckTheme, setDeckTheme] = useState('');
  const [suggestionCount, setSuggestionCount] = useState(15);
  
  // Use the AI suggestions hook
  const {
    suggestions,
    isLoading,
    error,
    getSuggestions,
    updateFocusCategories,
    updateDeckTheme,
    clearSuggestions,
    updateSuggestionCount
  } = useAISuggestions({
    maxSuggestions: suggestionCount
  });

  // Expanded category options with more MTG archetypes
  const categoryOptions = [
    'Ramp', 
    'Card Draw', 
    'Removal', 
    'Combo Piece', 
    'Utility', 
    'Finisher', 
    'Protection', 
    'Recursion', 
    'Tutor', 
    'Lands', 
    'Synergy', 
    'Control'
  ];

  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategories(prevSelected => {
      if (prevSelected.includes(category)) {
        const updated = prevSelected.filter(c => c !== category);
        updateFocusCategories(updated);
        return updated;
      } else {
        const updated = [...prevSelected, category];
        updateFocusCategories(updated);
        return updated;
      }
    });
  };

  // Handle theme input change
  const handleThemeChange = (e) => {
    const theme = e.target.value;
    setDeckTheme(theme);
    updateDeckTheme(theme);
  };

  // Handle suggestion count change
  const handleSuggestionCountChange = (e) => {
    const count = parseInt(e.target.value);
    if (count >= 1 && count <= 100) {
      setSuggestionCount(count);
      if (updateSuggestionCount) {
        updateSuggestionCount(count);
      }
    }
  };

  // Handle getting suggestions
  const handleGetSuggestions = () => {
    getSuggestions();
  };

  return (
    <div className="bg-logoScheme-darkGray rounded-lg border border-logoScheme-brown p-4 shadow-sm text-gray-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-logoScheme-gold">AI Card Suggestions</h2>
        
        {/* Clear Results Button */}
        {suggestions.length > 0 && (
          <button
            onClick={clearSuggestions}
            className="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md"
          >
            Clear Results
          </button>
        )}
      </div>
      
      {/* Options Panel (Always Visible) */}
      <div className="mb-4 bg-logoScheme-brown border border-logoScheme-gold/50 rounded-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div>
            {/* Theme/Strategy Input */}
            <div className="mb-3">
              <label htmlFor="deckTheme" className="block text-sm font-medium text-gray-200 mb-1">
                Deck Theme/Strategy
              </label>
              <input
                type="text"
                id="deckTheme"
                value={deckTheme}
                onChange={handleThemeChange}
                placeholder="e.g., Tokens, Aristocrats, Spellslinger, Blink..."
                className="w-full px-3 py-2 border border-gray-500 rounded-md text-sm focus:ring-logoScheme-gold focus:border-logoScheme-gold bg-gray-700 text-gray-100 placeholder-gray-400"
              />
            </div>
            
            {/* Number of Suggestions Slider */}
            <div>
              <label htmlFor="suggestionCount" className="block text-sm font-medium text-gray-200 mb-1">
                Number of Suggestions: {suggestionCount}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="suggestionCount"
                  min="1"
                  max="100"
                  step="1"
                  value={suggestionCount}
                  onChange={handleSuggestionCountChange}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-logoScheme-gold"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={suggestionCount}
                  onChange={handleSuggestionCountChange}
                  className="w-16 px-2 py-1 border border-gray-500 rounded text-sm bg-gray-700 text-gray-100 focus:ring-logoScheme-gold focus:border-logoScheme-gold"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div>
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-200 mb-2">Focus on categories:</h3>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      selectedCategories.includes(category)
                        ? 'bg-logoScheme-gold text-logoScheme-darkGray border border-yellow-400'
                        : 'bg-gray-700 text-gray-200 border border-gray-600 hover:bg-gray-600'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Get Suggestions Button */}
        <div className="mt-4">
          <button
            onClick={handleGetSuggestions}
            disabled={!commander || isLoading}
            className={`w-full py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-logoScheme-darkGray ${
              !commander || isLoading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-logoScheme-gold hover:bg-yellow-400 text-logoScheme-darkGray focus:ring-logoScheme-gold'
            }`}
          >
            {isLoading ? 'Getting Suggestions...' : `Get ${suggestionCount} AI Suggestions`}
          </button>
          
          {!commander && (
            <p className="text-xs text-yellow-400 mt-1">
              Select a commander first to get suggestions
            </p>
          )}
          
          {error && (
            <p className="text-xs text-logoScheme-red mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
      
      {/* Suggestions Grid */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-200 mb-3">
            Suggested Cards: {suggestions.length}
          </h3>
          <div className={`${suggestions.length > 30 ? 'max-h-[700px] overflow-y-auto pr-2' : ''}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {suggestions.map((suggestion, index) => (
                <SuggestedCard key={`${suggestion.name}-${index}`} suggestion={suggestion} />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-logoScheme-gold"></div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No suggestions yet. Click "Get AI Suggestions" to receive personalized card recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default SuggestionPanel; 