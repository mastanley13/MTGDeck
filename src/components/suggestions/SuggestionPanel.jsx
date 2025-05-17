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
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">AI Card Suggestions</h2>
        
        {/* Clear Results Button */}
        {suggestions.length > 0 && (
          <button
            onClick={clearSuggestions}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Clear Results
          </button>
        )}
      </div>
      
      {/* Options Panel (Always Visible) */}
      <div className="mb-4 bg-blue-50 rounded-md border border-blue-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div>
            {/* Theme/Strategy Input */}
            <div className="mb-3">
              <label htmlFor="deckTheme" className="block text-sm font-medium text-gray-700 mb-1">
                Deck Theme/Strategy
              </label>
              <input
                type="text"
                id="deckTheme"
                value={deckTheme}
                onChange={handleThemeChange}
                placeholder="e.g., Tokens, Aristocrats, Spellslinger, Blink..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Number of Suggestions Slider */}
            <div>
              <label htmlFor="suggestionCount" className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={suggestionCount}
                  onChange={handleSuggestionCountChange}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Right Column */}
          <div>
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Focus on categories:</h3>
              <div className="flex flex-wrap gap-2">
                {categoryOptions.map(category => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      selectedCategories.includes(category)
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
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
            className={`w-full py-2 rounded-md text-white text-sm font-medium ${
              !commander || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
            }`}
          >
            {isLoading ? 'Getting Suggestions...' : `Get ${suggestionCount} AI Suggestions`}
          </button>
          
          {!commander && (
            <p className="text-xs text-orange-600 mt-1">
              Select a commander first to get suggestions
            </p>
          )}
          
          {error && (
            <p className="text-xs text-red-600 mt-1">
              {error}
            </p>
          )}
        </div>
      </div>
      
      {/* Suggestions Grid */}
      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No suggestions yet. Click "Get AI Suggestions" to receive personalized card recommendations.</p>
        </div>
      )}
    </div>
  );
};

export default SuggestionPanel; 