import React, { useState, useEffect, useCallback } from 'react';
import { searchCards } from '../utils/scryfallAPI';
import { useDeck } from '../context/DeckContext';
import CardDetailModal from '../components/ui/CardDetailModal';

// Debounce function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};

const CardSearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCardForAdding, setSelectedCardForAdding] = useState(null);
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);

  const [selectedCardForDetails, setSelectedCardForDetails] = useState(null);

  const { addCard, savedDecks, currentDeckName } = useDeck();

  const performSearch = async (currentQuery) => {
    if (!currentQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchCards(currentQuery);
      setResults(response.data || []);
    } catch (err) {
      setError('Failed to fetch cards. Please try again.');
      setResults([]);
      console.error(err);
    }
    setIsLoading(false);
  };

  const debouncedSearch = useCallback(debounce(performSearch, 500), []);

  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      debouncedSearch(query);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query, debouncedSearch]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  // --- Add to Deck Modal Logic ---
  const handleOpenDeckModal = (card) => {
    setSelectedCardForAdding(card);
    setIsDeckModalOpen(true);
  };

  const handleCloseDeckModal = () => {
    setSelectedCardForAdding(null);
    setIsDeckModalOpen(false);
  };

  const handleAddCardToDeck = (deckId) => {
    if (selectedCardForAdding) {
      addCard(selectedCardForAdding);
      const targetDeckName = deckId === 'current' ? currentDeckName : savedDecks.find(d => d.id === deckId)?.name;
      alert(`${selectedCardForAdding.name} added to ${targetDeckName || 'current deck'}.`);
      handleCloseDeckModal();
    }
  };

  // --- Card Details Modal Logic ---
  const handleOpenCardDetailsModal = (card) => {
    setSelectedCardForDetails(card);
  };

  const handleCloseCardDetailsModal = () => {
    setSelectedCardForDetails(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Card Search</h1>
      {/* Search Input and Button */}
      <div className="flex mb-4">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search for cards (e.g., 'Black Lotus', 'type:creature pow=5')"
          className="border border-gray-600 bg-gray-700 text-white p-2 rounded-l-md w-full focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
        />
        <button
          onClick={() => performSearch(query)}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-md transition-colors"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {isLoading && query.trim() && <p className="text-center py-4 text-gray-300">Loading results for "{query}"...</p>}

      {/* Search Results Grid */}
      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {results.map((card) => {
            // Intense yellow/gold glow effect for game changer cards
            const gameChangerEffectClass = card.game_changer 
              ? 'ring-3 ring-yellow-400/90 shadow-[0_0_25px_7px_rgba(251,191,36,0.7)] ring-offset-2 ring-offset-gray-800' 
              : '';

            return (
            <div 
              key={card.id} 
              className={`border border-gray-700 bg-gray-800 rounded-lg p-3 flex flex-col justify-between shadow-md hover:shadow-lg hover:border-blue-500 transition-all relative ${gameChangerEffectClass}`}>
              <div className="cursor-pointer group" onClick={() => handleOpenCardDetailsModal(card)}>
                <h2 className="font-semibold text-md text-gray-100 mb-1 truncate group-hover:text-blue-400" title={card.name}>{card.name}</h2>
                {card.image_uris?.normal ? (
                  <img src={card.image_uris.normal} alt={card.name} className="mx-auto my-2 rounded shadow-sm w-full object-contain aspect-[5/7] group-hover:opacity-90 transition-opacity" />
                ) : (
                  <div className="mx-auto my-2 rounded shadow-sm w-full bg-gray-700 flex items-center justify-center aspect-[5/7]">
                    <span className="text-gray-500 text-sm p-2">No Image</span>
                  </div>
                )}
                <p className="text-xs text-gray-400 truncate group-hover:text-gray-200" title={card.type_line}>{card.type_line}</p>
                <p className="text-xs text-gray-500 truncate group-hover:text-gray-300" title={card.set_name}>Set: {card.set_name}</p>
              </div>
              <button 
                onClick={() => handleOpenDeckModal(card)}
                className="mt-3 w-full bg-green-600 hover:bg-green-700 text-white font-medium py-1.5 px-3 rounded-md text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                Add to Deck
              </button>
            </div>
            );
          })}
        </div>
      )}
      {!isLoading && !error && results.length === 0 && query.trim() && (
        <p className="text-center py-4 text-gray-400">No cards found for "{query}".</p>
      )}

      {/* Add to Deck Modal */}
      {isDeckModalOpen && selectedCardForAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-800 p-5 rounded-lg shadow-xl max-w-md w-full border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-3">Add "{selectedCardForAdding.name}" to:</h3>
            <ul className="space-y-2 max-h-60 overflow-y-auto mb-4 pr-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
              <li>
                <button 
                  onClick={() => handleAddCardToDeck('current')}
                  className="w-full text-left p-2.5 hover:bg-blue-700 bg-blue-600 text-white rounded border border-blue-500 font-medium text-sm transition-colors"
                >
                  Current Deck: {currentDeckName}
                </button>
              </li>
              {savedDecks && savedDecks.length > 0 && <hr className="my-1.5 border-gray-700"/>}
              {savedDecks && savedDecks.map((deck) => (
                <li key={deck.id}>
                  <button 
                    onClick={() => handleAddCardToDeck(deck.id)}
                    className="w-full text-left p-2.5 hover:bg-gray-700 bg-gray-600 text-gray-200 rounded border border-gray-500 text-sm transition-colors"
                  >
                    {deck.name}
                  </button>
                </li>
              ))}
               {(!savedDecks || savedDecks.length === 0) && (
                <li><p className="text-xs text-gray-400 p-1">No other saved decks found.</p></li>
              )}
            </ul>
            <button 
              onClick={handleCloseDeckModal}
              className="mt-3 w-full bg-gray-600 hover:bg-gray-500 text-gray-200 py-2 px-4 rounded text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Use the consolidated CardDetailModal component */}
      {selectedCardForDetails && (
        <CardDetailModal 
          card={selectedCardForDetails} 
          onClose={handleCloseCardDetailsModal} 
        />
      )}
    </div>
  );
};

export default CardSearchPage;