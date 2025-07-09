import React, { useState, useRef, useEffect } from 'react';

/**
 * SearchBar component for searching MTG cards
 * 
 * @param {Object} props
 * @param {string} props.query - Current search query
 * @param {Function} props.setQuery - Function to update query for suggestions
 * @param {Function} props.onSubmit - Function to handle search submission
 * @param {Array} props.suggestions - Autocomplete suggestions
 * @param {Object} props.searchOptions - Current search options
 * @param {Function} props.updateSearchOptions - Function to update search options
 * @param {boolean} props.isLoading - Loading state
 * @param {Function} props.onSuggestionSelected - Callback when suggestion is selected
 * @param {number} props.minCharsForSuggestions - Minimum characters required to show suggestions (default: 2)
 * @param {boolean} props.showAdvancedFilters - Whether to show advanced filters (default: true)
 * @param {string} props.placeholder - Custom placeholder text (default: "Search for cards...")
 */
const SearchBar = ({ 
  query, 
  setQuery,
  onSubmit,
  suggestions = [], 
  searchOptions = {}, 
  updateSearchOptions,
  isLoading,
  onSuggestionSelected,
  minCharsForSuggestions = 2,
  showAdvancedFilters = true,
  placeholder = "Search for cards..."
}) => {
  const [inputValue, setInputValue] = useState(query || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionListRef = useRef(null);

  // Update input value when query changes externally
  useEffect(() => {
    setInputValue(query || '');
  }, [query]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)
          && inputRef.current && !inputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Update the parent component's query state as user types
    // This will trigger the suggestion fetch in the parent component
    if (value.length >= minCharsForSuggestions) {
      setQuery(value); // This will trigger the useEffect in the parent to fetch suggestions
      setShowSuggestions(true);
      setActiveSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSubmit) {
      onSubmit(inputValue);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    inputRef.current.focus();
    
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
    }
  };

  const handleKeyDown = (e) => {
    // Handle keyboard navigation for suggestions
    if (showSuggestions && suggestions.length > 0) {
      // Down arrow
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        
        // Scroll the active suggestion into view
        if (suggestionListRef.current && activeSuggestionIndex >= 0) {
          const activeSuggestion = suggestionListRef.current.children[activeSuggestionIndex + 1];
          if (activeSuggestion) {
            activeSuggestion.scrollIntoView({ block: 'nearest' });
          }
        }
      }
      // Up arrow
      else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : 0);
        
        // Scroll the active suggestion into view
        if (suggestionListRef.current && activeSuggestionIndex > 0) {
          const activeSuggestion = suggestionListRef.current.children[activeSuggestionIndex - 1];
          if (activeSuggestion) {
            activeSuggestion.scrollIntoView({ block: 'nearest' });
          }
        }
      }
      // Enter key selects the current suggestion
      else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      }
      // Escape key closes the suggestions
      else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
      // Tab key selects the current suggestion
      else if (e.key === 'Tab' && activeSuggestionIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      }
    }
  };

  const handleAdvancedToggle = () => {
    setAdvancedMode(!advancedMode);
  };

  const handleColorFilterChange = (color) => {
    const currentColors = searchOptions.colors || [];
    let newColors;
    
    if (currentColors.includes(color)) {
      newColors = currentColors.filter(c => c !== color);
    } else {
      newColors = [...currentColors, color];
    }
    
    updateSearchOptions({ colors: newColors });
  };

  const handleCardTypeChange = (e) => {
    updateSearchOptions({ type: e.target.value });
  };

  // Map of color codes to their names and tailwind classes
  const colorMap = {
    W: { name: 'White', bgClass: 'bg-mtg-white', textClass: 'text-gray-800' },
    U: { name: 'Blue', bgClass: 'bg-mtg-blue', textClass: 'text-white' },
    B: { name: 'Black', bgClass: 'bg-mtg-black', textClass: 'text-white' },
    R: { name: 'Red', bgClass: 'bg-mtg-red', textClass: 'text-white' },
    G: { name: 'Green', bgClass: 'bg-mtg-green', textClass: 'text-white' },
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 border border-slate-600/50 rounded-l-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-300"
              onFocus={() => inputValue.length >= minCharsForSuggestions && setShowSuggestions(true)}
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="suggestion-list"
              aria-expanded={showSuggestions}
            />
          </div>
          <button
            type="submit"
            className="bg-primary-500 text-white px-5 py-3 rounded-r-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300"
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="font-medium">Search</span>
            )}
          </button>
        </div>
        
                {/* Suggestions dropdown positioned relative to the input field */}        {showSuggestions && suggestions.length > 0 && (          <div             ref={suggestionsRef}            className="absolute z-[200] w-full glassmorphism-card border-primary-500/30 rounded-xl shadow-modern-primary max-h-60 overflow-y-auto"            style={{               top: '100%',               marginTop: '4px'            }}          >
            <ul 
              ref={suggestionListRef}
              id="suggestion-list" 
              role="listbox"
              className="py-2 divide-y divide-slate-700/50 text-slate-200"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  role="option"
                  aria-selected={index === activeSuggestionIndex}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === activeSuggestionIndex ? 'bg-primary-500/20 text-primary-400' : 'hover:bg-slate-800/50'
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {suggestion}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Advanced filters toggle - only show if showAdvancedFilters is true */}
        {showAdvancedFilters && (
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={handleAdvancedToggle}
              className="text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors focus:outline-none focus:underline"
            >
              {advancedMode ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
            </button>
          </div>
        )}
        
        {/* Advanced filters content - only show if showAdvancedFilters is true and advancedMode is true */}
        {showAdvancedFilters && advancedMode && (
          <div className="mt-3 p-6 glassmorphism-card border-primary-500/20 text-slate-300">
            <h3 className="text-lg font-medium text-primary-400 mb-4">Advanced Filters</h3>
            
            {/* Color filters */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-300 mb-2">Color Identity</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(colorMap).map(([code, { name, bgClass, textClass }]) => {
                  const isActive = (searchOptions.colors || []).includes(code);
                  
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleColorFilterChange(code)}
                      className={`flex items-center px-3 py-1.5 rounded-md transition-all text-sm ${
                        isActive 
                          ? `${bgClass} ${textClass} shadow-sm` 
                          : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      }`}
                    >
                      {isActive && (
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => updateSearchOptions({ colors: [] })}
                  className="px-3 py-1.5 bg-gray-700 text-gray-200 text-sm rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Card type filter */}
            <div className="mb-4">
              <label htmlFor="cardType" className="block text-sm font-medium text-gray-300 mb-2">
                Card Type
              </label>
              <select
                id="cardType"
                value={searchOptions.type || ''}
                onChange={handleCardTypeChange}
                className="w-full px-3 py-2 border border-slate-600/50 rounded-xl shadow-sm focus:ring-primary-500 focus:border-primary-500 bg-slate-800/50 text-white placeholder-slate-400 transition-all duration-300"
              >
                <option value="">Any Type</option>
                <option value="creature">Creature</option>
                <option value="instant">Instant</option>
                <option value="sorcery">Sorcery</option>
                <option value="artifact">Artifact</option>
                <option value="enchantment">Enchantment</option>
                <option value="planeswalker">Planeswalker</option>
                <option value="land">Land</option>
              </select>
            </div>
            
            {/* Sort order */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => updateSearchOptions({ order: 'name' })}
                  className={`px-3 py-2 rounded-xl text-sm text-center transition-colors ${
                    searchOptions.order === 'name'
                      ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                      : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200'
                  }`}
                >
                  Name
                </button>
                <button
                  type="button"
                  onClick={() => updateSearchOptions({ order: 'cmc' })}
                  className={`px-3 py-2 rounded-xl text-sm text-center transition-colors ${
                    searchOptions.order === 'cmc'
                      ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                      : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200'
                  }`}
                >
                  Mana Value
                </button>
                <button
                  type="button"
                  onClick={() => updateSearchOptions({ order: 'edhrec' })}
                  className={`px-3 py-2 rounded-xl text-sm text-center transition-colors ${
                    searchOptions.order === 'edhrec' || !searchOptions.order
                      ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                      : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200'
                  }`}
                >
                  Popularity
                </button>
                <button
                  type="button"
                  onClick={() => updateSearchOptions({ order: 'released' })}
                  className={`px-3 py-2 rounded-xl text-sm text-center transition-colors ${
                    searchOptions.order === 'released'
                      ? 'bg-primary-500/20 border border-primary-500/50 text-primary-400'
                      : 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-200'
                  }`}
                >
                  Release Date
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar; 