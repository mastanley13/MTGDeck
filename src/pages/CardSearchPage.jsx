import React, { useState, useEffect, useCallback } from 'react';
import { searchCards, getCardImageUris } from '../utils/scryfallAPI';
import { useDeck } from '../context/DeckContext';
import CardDetailModal from '../components/ui/CardDetailModal';
import EnhancedCardImage from '../components/ui/EnhancedCardImage';
import { parseManaSymbols } from '../utils/manaSymbols';
import GameChangerTooltip from '../components/ui/GameChangerTooltip';
import { useAuth } from '../context/AuthContext';

// Using EnhancedCardImage component for optimized image handling

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
  const [isDecksLoadingForModal, setIsDecksLoadingForModal] = useState(false);

  const [selectedCardForDetails, setSelectedCardForDetails] = useState(null);

  const { addCard, savedDecks, currentDeckName, saveCurrentDeckToGHL, fetchAndSetUserDecks } = useDeck();
  const { currentUser } = useAuth();

  // Function to sort results prioritizing original cards over Arena cards
  const sortResultsByCardType = (cards) => {
    if (!cards || cards.length === 0) return cards;
    
    // Separate Arena cards from original cards
    const originalCards = [];
    const arenaCards = [];
    
    cards.forEach(card => {
      if (card.name && card.name.startsWith('A-')) {
        arenaCards.push(card);
      } else {
        originalCards.push(card);
      }
    });
    
    // Return original cards first, then Arena cards
    return [...originalCards, ...arenaCards];
  };

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
      // Map each card to include imageUrl using getCardImageUris
      const mappedResults = (response.data || []).map(card => {
        const imageUris = getCardImageUris(card);
        return {
          ...card,
          imageUrl: imageUris?.art_crop || imageUris?.normal || null
        };
      });
      const sortedResults = sortResultsByCardType(mappedResults);
      setResults(sortedResults);
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
  const handleOpenDeckModal = async (card) => {
    setSelectedCardForAdding(card);
    setIsDeckModalOpen(true);
    if (currentUser && (currentUser.contactId || currentUser.id)) {
      setIsDecksLoadingForModal(true);
      await fetchAndSetUserDecks(currentUser.contactId || currentUser.id);
      setIsDecksLoadingForModal(false);
    }
  };

  const handleCloseDeckModal = () => {
    setSelectedCardForAdding(null);
    setIsDeckModalOpen(false);
  };

  const handleAddCardToDeck = async (deckId) => {
    if (selectedCardForAdding) {
      if (deckId === 'current') {
        addCard(selectedCardForAdding);
        console.log('[AddCard] Added to current deck:', selectedCardForAdding, currentDeckName);
        alert(`${selectedCardForAdding.name} added to ${currentDeckName || 'current deck'}.`);
        handleCloseDeckModal();
        return;
      }
      // --- Step 1: Fetch the latest version of the selected deck from GHL ---
      let latestDeckRecord = null;
      try {
        console.log('[AddCard] Fetching latest deck from GHL. deckId:', deckId);
        const res = await fetch(
          `https://services.leadconnectorhq.com/objects/custom_objects.decks/records/${deckId}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Accept': 'application/json',
            },
          }
        );
        console.log('[AddCard] GET response status:', res.status);
        if (!res.ok) throw new Error('Failed to fetch latest deck from GHL');
        const data = await res.json();
        latestDeckRecord = data.record;
        console.log('[AddCard] latestDeckRecord:', latestDeckRecord);
      } catch (err) {
        console.error('[AddCard] Error fetching latest deck from cloud:', err);
        alert('Failed to fetch latest deck from cloud: ' + (err.message || err));
        handleCloseDeckModal();
        return;
      }
      // --- Step 2: Parse and upsert the card into deck_data ---
      let deckDataObj;
      try {
        deckDataObj = latestDeckRecord.properties && latestDeckRecord.properties.deck_data
          ? JSON.parse(latestDeckRecord.properties.deck_data)
          : null;
      } catch (e) {
        deckDataObj = null;
      }
      if (!deckDataObj) {
        deckDataObj = {
          v: "1.1_shortkeys",
          adn: latestDeckRecord.properties.decks || 'Untitled Deck',
          cmd: null,
          mb: [],
          ls: new Date().toISOString()
        };
      }
      let found = false;
      for (let i = 0; i < deckDataObj.mb.length; i++) {
        if (deckDataObj.mb[i].n === selectedCardForAdding.name) {
          if ((selectedCardForAdding.type_line || '').toLowerCase().includes('basic land')) {
            deckDataObj.mb[i].q = (deckDataObj.mb[i].q || 1) + 1;
          }
          found = true;
          break;
        }
      }
      if (!found) {
        deckDataObj.mb.push({
          i: selectedCardForAdding.id,
          n: selectedCardForAdding.name,
          q: 1,
          t: selectedCardForAdding.type_line,
          c: selectedCardForAdding.cmc,
          ct: selectedCardForAdding.type_line
        });
      }
      deckDataObj.ls = new Date().toISOString();
      console.log('[AddCard] deckDataObj after upsert:', deckDataObj);
      // --- Step 3: Send PUT request to update only deck_data field ---
      try {
        // Build the properties object using the correct property keys for Decks and Deck Data (not the full field keys)
        const putProperties = {
          decks: latestDeckRecord.properties["decks"] || "Untitled Deck", // always required
          deck_data: JSON.stringify(deckDataObj) // Deck Data by property key
        };
        console.log('[AddCard] PUT Properties:', putProperties);
        const putRes = await fetch(
          `https://services.leadconnectorhq.com/objects/custom_objects.decks/records/${deckId}?locationId=${import.meta.env.VITE_LOCATION_ID}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ properties: putProperties })
          }
        );
        console.log('[AddCard] PUT response status:', putRes.status);
        let putResBody = null;
        try { putResBody = await putRes.json(); } catch (e) { putResBody = null; }
        console.log('[AddCard] PUT response body:', putResBody);
        if (!putRes.ok) {
          throw new Error((putResBody && putResBody.message) || `Failed to update deck: ${putRes.status}`);
        }
        await fetchAndSetUserDecks(currentUser.contactId || currentUser.id);
        alert(`${selectedCardForAdding.name} added to ${latestDeckRecord.properties['custom_objects.decks.decks'] || 'deck'} and saved to cloud!`);
      } catch (err) {
        console.error('[AddCard] Error updating deck in cloud:', err);
        alert('Failed to update deck in cloud: ' + (err.message || err));
      }
      handleCloseDeckModal();
    }
  };

  // --- Card Details Modal Logic ---
  const handleOpenCardDetailsModal = (card) => {
    // Only open modal if card is fully loaded (not a fallback card)
    if (card && !card._isFallbackCard && card.isLoaded !== false) {
      setSelectedCardForDetails(card);
    } else {
      // Optionally show a brief message that the card is still loading
      console.log('Card is still loading, modal will not open:', card?.name);
    }
  };

  const handleCloseCardDetailsModal = () => {
    setSelectedCardForDetails(null);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-8">
            <img 
              src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png" 
              alt="MTG Commander Deck Builder Logo" 
              className="h-16 sm:h-20 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300 mb-6"
            />
          </div>
          <h1 className="text-5xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-4">
            <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
              <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
              <circle cx="10" cy="10" r="7" />
              <path d="M21 21l-6-6" />
            </svg>
            <span>Card Search</span>
          </h1>
          <p className="text-xl text-slate-400">
            Search through Magic: The Gathering's vast card library
          </p>
        </div>

        {/* Search Interface */}
        <div className="glassmorphism-card p-8 border-primary-500/20">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span>Search Cards</span>
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search for cards (e.g., 'Black Lotus', 'type:creature pow=5')"
                className="w-full pl-10 pr-4 py-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
              />
            </div>
            <button
              onClick={() => performSearch(query)}
              disabled={isLoading || !query.trim()}
              className="btn-modern btn-modern-primary btn-modern-lg premium-glow disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Searching...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </span>
              )}
            </button>
          </div>

          {/* Search Tips */}
          <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">💡 Search Tips:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-400">
              <div>• <code className="text-primary-400">type:creature</code> - Find creatures</div>
              <div>• <code className="text-primary-400">pow&gt;=5</code> - Power 5 or greater</div>
              <div>• <code className="text-primary-400">cmc:3</code> - Mana cost of 3</div>
              <div>• <code className="text-primary-400">c:r</code> - Red cards</div>
              <div>• <code className="text-primary-400">rarity:rare</code> - Rare cards</div>
              <div>• <code className="text-primary-400">format:commander</code> - Commander legal</div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glassmorphism-card p-6 border-red-500/30 bg-red-500/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-300">Search Error</h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && query.trim() && (
          <div className="glassmorphism-card p-12 text-center border-primary-500/30">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-2">Searching Cards</h3>
            <p className="text-slate-400 text-lg">Looking for "{query}"...</p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white flex items-center space-x-3">
                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Search Results</span>
              </h2>
              <div className="text-slate-400">
                {results.length} {results.length === 1 ? 'card' : 'cards'} found
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {results.map((card) => {
                const gameChangerEffect = card.game_changer 
                  ? 'ring-4 ring-yellow-400/90 shadow-lg shadow-yellow-400/50' 
                  : '';

                return (
                  <div 
                    key={card.id} 
                    className={`group relative glassmorphism-card p-0 overflow-hidden border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 hover:shadow-modern-primary ${gameChangerEffect} flex flex-col h-full`}
                  >
                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={`Art for ${card.name}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                          <div className="text-center">
                            <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">No Image</span>
                          </div>
                        </div>
                      )}

                      {/* Game Changer Badge */}
                      {card.game_changer && (
                        <div className="absolute top-2 right-2">
                          <GameChangerTooltip className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg z-10" />
                        </div>
                      )}
                    </div>
                    
                    {/* Card Details */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
                      <div className="flex items-start justify-between flex-shrink-0">
                        <h3 className="text-sm font-bold text-white flex-1 pr-2 group-hover:text-primary-300 transition-colors leading-tight">
                          {card.name}
                        </h3>
                        {/* Mana Cost Display */}
                        {card.mana_cost && (
                          <div className="flex items-center space-x-0.5 flex-shrink-0">
                            {parseManaSymbols(card.mana_cost)}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 flex-shrink-0">
                        {card.type_line || card.type}
                      </p>
                      {/* Card summary/description */}
                      <div className="text-xs text-slate-300 leading-relaxed line-clamp-3 flex-grow overflow-hidden">
                        {parseManaSymbols(card.description || card.oracle_text)}
                      </div>
                      {/* Action buttons - side by side - Fixed at bottom */}
                      <div className="flex space-x-2 pt-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCardDetailsModal(card);
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Details</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeckModal(card);
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && results.length === 0 && query.trim() && (
          <div className="glassmorphism-card p-12 text-center border-slate-700/50">
            <div className="text-slate-400 mb-4">
              <svg className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Cards Found</h3>
            <p className="text-slate-400 mb-6">
              No cards match your search for "<span className="text-primary-400">{query}</span>". 
              Try adjusting your search terms or using different filters.
            </p>
          </div>
        )}

        {/* Add to Deck Modal */}
        {isDeckModalOpen && selectedCardForAdding && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glassmorphism-card p-8 max-w-md w-full border-primary-500/30">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add "{selectedCardForAdding.name}"</span>
              </h3>
              {isDecksLoadingForModal ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mr-4"></div>
                  <span className="text-slate-300 text-lg">Loading decks...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
                  {/* Current Deck Option */}
                  <button 
                    onClick={() => handleAddCardToDeck('current')}
                    className="w-full btn-modern btn-modern-primary btn-modern-md text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>Current Deck: {currentDeckName || 'Untitled'}</span>
                    </div>
                  </button>

                  {/* Saved Decks */}
                  {savedDecks && savedDecks.length > 0 && (
                    <>
                      <div className="border-t border-slate-700/50 pt-3 mt-3">
                        <p className="text-sm text-slate-400 mb-3">Or add to saved deck:</p>
                      </div>
                      {savedDecks.map((deck) => (
                        <button 
                          key={deck.id}
                          onClick={() => handleAddCardToDeck(deck.id)}
                          className="w-full btn-modern btn-modern-secondary btn-modern-sm text-left"
                        >
                          <div className="flex items-center space-x-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <span>{deck.name}</span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {(!savedDecks || savedDecks.length === 0) && !isDecksLoadingForModal && (
                    <p className="text-xs text-slate-500 text-center py-4">No other saved decks found.</p>
                  )}
                </div>
              )}
              <button 
                onClick={handleCloseDeckModal}
                className="w-full btn-modern btn-modern-outline btn-modern-md"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Card Details Modal */}
        {selectedCardForDetails && (
          <CardDetailModal 
            card={selectedCardForDetails} 
            onClose={handleCloseCardDetailsModal} 
          />
        )}
      </div>
    </div>
  );
};

export default CardSearchPage;