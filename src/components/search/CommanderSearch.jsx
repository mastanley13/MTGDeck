import React, { useState, useEffect } from 'react';
import { searchCommanders } from '../../utils/scryfallAPI';
import SearchBar from './SearchBar.jsx';
import SearchResults from './SearchResults.jsx';
import { cacheCard, getCachedSearchResults, cacheSearchResults } from '../../utils/cardCache';

/**
 * CommanderSearch component for searching and selecting commander cards (Modal Version)
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call to close the modal
 * @param {Function} props.onCommanderSelect - Function called when a commander is selected
 * @param {Object} props.selectedCommander - Currently selected commander (can be null if none selected initially)
 */
const CommanderSearch = ({ isOpen, onClose, onCommanderSelect, selectedCommander: initialSelectedCommander }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCards, setTotalCards] = useState(0);
  const [searchOptions, setSearchOptions] = useState({ order: 'edhrec' });
  
  // Internal state for selected commander to manage view within modal
  const [modalSelectedCommander, setModalSelectedCommander] = useState(initialSelectedCommander);

  useEffect(() => {
    setModalSelectedCommander(initialSelectedCommander);
  }, [initialSelectedCommander]);

  // Reset search when modal opens without a pre-selected commander, or when it's cleared
  useEffect(() => {
    if (isOpen && !modalSelectedCommander) {
      setSearchQuery('');
      setCurrentQuery('');
      setSearchResults([]);
      setSuggestions([]);
      setPage(1);
      setHasMore(false);
      setError(null);
    }
  }, [isOpen, modalSelectedCommander]);

  // Fetch commander suggestions for autocomplete as the user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (currentQuery.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsSuggestionLoading(true);
      try {
        const cacheKey = `suggestion_${currentQuery}`;
        const cachedSuggestions = localStorage.getItem(cacheKey);
        
        if (cachedSuggestions) {
          setSuggestions(JSON.parse(cachedSuggestions));
          setIsSuggestionLoading(false);
          return;
        }
        
        const response = await searchCommanders(currentQuery);
        const suggestionNames = response?.data?.map(card => card.name) || [];
        const uniqueSuggestions = [...new Set(suggestionNames)].slice(0, 10);
        setSuggestions(uniqueSuggestions);
        localStorage.setItem(cacheKey, JSON.stringify(uniqueSuggestions));
      } catch (err) {
        console.error('Error fetching commander suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsSuggestionLoading(false);
      }
    };
    const timer = setTimeout(() => { fetchSuggestions(); }, 300);
    return () => clearTimeout(timer);
  }, [currentQuery]);

  // This effect handles the actual search when submit button is clicked
  useEffect(() => {
    const fetchCommanders = async () => {
      if (!searchQuery) return;
      setIsLoading(true);
      setError(null);
      try {
        const cacheKey = `commander_${searchQuery}_page${page}_${JSON.stringify(searchOptions)}`;
        const cachedResults = getCachedSearchResults(cacheKey);
        if (cachedResults) {
          setSearchResults(page === 1 ? cachedResults.data : [...searchResults, ...cachedResults.data]);
          setHasMore(cachedResults.has_more || false);
          setTotalCards(cachedResults.total_cards || 0);
        } else {
          const response = await searchCommanders(searchQuery);
          cacheSearchResults(cacheKey, response);
          if (response.data) response.data.forEach(card => cacheCard(card));
          setSearchResults(page === 1 ? (response.data || []) : prevResults => [...prevResults, ...(response.data || [])]);
          setHasMore(response.has_more || false);
          setTotalCards(response.total_cards || 0);
        }
      } catch (err) {
        setError('Failed to search for commanders. Please try again.');
        console.error('Commander search error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    if (isOpen) fetchCommanders(); // Only fetch if modal is open and searchQuery is set
  }, [searchQuery, page, searchOptions, isOpen]);

  const handleCommanderSelectAndClose = (card) => {
    onCommanderSelect(card); // Propagate to parent
    setModalSelectedCommander(card); // Update internal view if needed
    if (card) { // Only close if a card is actually selected (not for clearing)
        onClose(); // Close modal on selection
    }
  };

  const handleChangeCommander = () => {
    onCommanderSelect(null); // Tell parent to clear commander
    setModalSelectedCommander(null); // Clear internal view, switch to search
    // Modal remains open for new search
  };

  // Handle loading more results
  const handleLoadMore = () => {
    if (isLoading || !hasMore) return;
    setPage(prevPage => prevPage + 1);
  };

  // Update search options
  const handleUpdateSearchOptions = (newOptions) => {
    setSearchOptions(prevOptions => ({
      ...prevOptions,
      ...newOptions
    }));
    // Reset to first page when changing options
    setPage(1);
  };

  // Handle suggestion selection
  const handleSuggestionSelected = (suggestion) => {
    setCurrentQuery(suggestion);
    setSearchQuery(suggestion); // Also trigger a search
  };

  // Handle input changes for suggestions
  const handleInputChange = (value) => {
    setCurrentQuery(value);
  };

  // Handle search submission
  const handleSearch = (query) => {
    setSearchQuery(query);
    setPage(1);
  };

  // Extract color identity badges
  const renderColorIdentity = (colorIdentity = []) => {
    // Map WUBRG to their respective color classes
    const colorMap = {
      'W': 'white',
      'U': 'blue',
      'B': 'black',
      'R': 'red',
      'G': 'green',
    };
    
    // If no colors, show colorless
    if (colorIdentity.length === 0) {
      return (
        <div className="color-badge colorless" title="Colorless"></div>
      );
    }
    
    // Display badges for each color
    return colorIdentity.map((color, index) => (
      <div 
        key={index} 
        className={`color-badge ${colorMap[color] || 'colorless'}`} 
        title={colorMap[color] || 'Colorless'}
      ></div>
    ));
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4">
      <div className="commander-search bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">
                {modalSelectedCommander ? 'Selected Commander' : 'Select a Commander'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {modalSelectedCommander ? (
            <div className="commander-showcase rounded-xl overflow-hidden bg-gradient-to-r from-primary-50 to-primary-100">
                <div className="flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/3 relative p-4">
                        {modalSelectedCommander.image_uris?.normal && (
                            <div className="magic-card transform transition hover:scale-[1.02] hover:rotate-1">
                                <img 
                                    src={modalSelectedCommander.image_uris.normal} 
                                    alt={modalSelectedCommander.name}
                                    className="rounded-xl shadow-lg w-full h-auto"
                                />
                            </div>
                        )}
                    </div>
                    <div className="p-4 md:p-6 flex-1">
                        <div className="flex items-center mb-2 space-x-2">
                            <h3 className="text-2xl font-bold text-gray-900">{modalSelectedCommander.name}</h3>
                            <div className="flex space-x-1">
                                {renderColorIdentity(modalSelectedCommander.color_identity)}
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">{modalSelectedCommander.type_line}</div>
                        <div className="bg-white bg-opacity-70 p-3 rounded-lg shadow-sm mb-4 prose prose-sm max-w-none overflow-y-auto max-h-40">
                            <p className="whitespace-pre-line">{modalSelectedCommander.oracle_text}</p>
                            {modalSelectedCommander.power && modalSelectedCommander.toughness && (
                                <div className="mt-2 font-semibold">
                                    Power/Toughness: {modalSelectedCommander.power}/{modalSelectedCommander.toughness}
                                </div>
                            )}
                            {modalSelectedCommander.loyalty && (
                                <div className="mt-2 font-semibold">
                                    Loyalty: {modalSelectedCommander.loyalty}
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                {modalSelectedCommander.set_name} ({modalSelectedCommander.set.toUpperCase()})
                            </div>
                            <button
                                onClick={handleChangeCommander}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Change Commander
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <SearchBar 
                  query={currentQuery}
                  setQuery={handleInputChange}
                  onSubmit={handleSearch}
                  suggestions={suggestions}
                  searchOptions={searchOptions}
                  updateSearchOptions={handleUpdateSearchOptions}
                  isLoading={isLoading || isSuggestionLoading}
                  onSuggestionSelected={handleSuggestionSelected}
                  minCharsForSuggestions={3}
                  autoFocusInput={true}
                />
              </div>
              
              <SearchResults 
                results={searchResults}
                isLoading={isLoading}
                error={error}
                hasMore={hasMore}
                loadMore={handleLoadMore}
                onCardClick={handleCommanderSelectAndClose}
                totalCards={totalCards}
              />
              
              {!searchQuery && !isLoading && searchResults.length === 0 && (
                <div className="text-center p-8 bg-gray-50 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg font-medium text-gray-700 mb-2">Search for a commander to get started</p>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Try searching for popular commanders like "Atraxa", "Korvold", "Muldrotha" or use advanced filters
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommanderSearch; 