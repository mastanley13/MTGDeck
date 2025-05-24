import React, { useState, useEffect, useCallback } from 'react';
import { searchCards } from '../utils/scryfallAPI';
import { useDeck } from '../context/DeckContext';
import CardDetailModal from '../components/ui/CardDetailModal';

// Enhanced CardImage component for double-faced cards
const CardImageLocal = ({ card, className }) => {
  const [imageState, setImageState] = useState('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [currentFace, setCurrentFace] = useState(0);
  const maxRetries = 2;

  // Enhanced function to get all card face image URIs
  const getAllCardFaceImages = (card) => {
    if (!card) return [];

    try {
      const faces = [];

      // Single-faced card with direct image_uris
      if (card.image_uris && !card.card_faces) {
        faces.push({
          name: card.name,
          imageUrl: card.image_uris.normal || card.image_uris.large || card.image_uris.small || card.image_uris.png,
          uris: card.image_uris,
          faceIndex: 0
        });
      }
      // Multi-faced card
      else if (card.card_faces && card.card_faces.length > 0) {
        card.card_faces.forEach((face, index) => {
          if (face.image_uris) {
            const imageUrl = face.image_uris.normal || face.image_uris.large || face.image_uris.small || face.image_uris.png;
            if (imageUrl) {
              faces.push({
                name: face.name || `${card.name} (Face ${index + 1})`,
                imageUrl: imageUrl,
                uris: face.image_uris,
                faceIndex: index
              });
            }
          }
        });
      }

      return faces;
    } catch (error) {
      console.error('CardImageLocal: Error processing card image URIs:', error, card);
      return [];
    }
  };

  const cardFaces = getAllCardFaceImages(card);
  const isDoubleFaced = cardFaces.length > 1;
  const currentFaceData = cardFaces[currentFace] || cardFaces[0];

  const handleImageLoad = () => {
    setImageState('loaded');
  };

  const handleImageError = () => {
    if (retryCount < maxRetries) {
      setImageState('retrying');
      setRetryCount(prev => prev + 1);
      setTimeout(() => {
        setImageState('loading');
      }, 1000);
    } else {
      setImageState('error');
    }
  };

  const toggleFace = () => {
    if (isDoubleFaced) {
      setCurrentFace(prev => (prev + 1) % cardFaces.length);
      setImageState('loading');
      setRetryCount(0);
    }
  };

  if (!currentFaceData || imageState === 'error') {
    return (
      <div className="w-full bg-slate-800 rounded-xl shadow-lg flex items-center justify-center aspect-[5/7] mb-3">
        <div className="text-center">
          <svg className="h-12 w-12 mx-auto mb-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-slate-500 text-xs">
            {!currentFaceData ? 'No Image Found' : 'Image Unavailable'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Loading State */}
      {imageState === 'loading' || imageState === 'retrying' ? (
        <div className="w-full bg-slate-800 rounded-xl shadow-lg flex items-center justify-center aspect-[5/7] mb-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
          {imageState === 'retrying' && (
            <span className="absolute bottom-2 text-xs text-slate-400">Retrying...</span>
          )}
        </div>
      ) : null}
      
      {/* Main Card Image */}
      <img 
        src={currentFaceData.imageUrl}
        alt={currentFaceData.name}
        className={`${className} ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0 absolute inset-0'} transition-opacity duration-300`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Double-faced indicator and toggle button */}
      {isDoubleFaced && imageState === 'loaded' && (
        <>
          {/* Double-faced indicator */}
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
            DFC
          </div>

          {/* Face counter */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
            {currentFace + 1}/{cardFaces.length}
          </div>

          {/* Flip button - positioned at top center */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFace();
            }}
            className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg z-30 transition-all duration-200 hover:scale-105"
            title={`Click to flip to ${cardFaces[(currentFace + 1) % cardFaces.length]?.name || 'other side'}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Flip</span>
          </button>
        </>
      )}
    </div>
  );
};

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
                    className={`group relative glassmorphism-card p-4 border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-modern-primary ${gameChangerEffect}`}
                  >
                    <div className="cursor-pointer" onClick={(e) => {
                      e.stopPropagation();
                      handleOpenCardDetailsModal(card);
                    }}>
                      <h3 className="font-bold text-white mb-3 group-hover:text-primary-300 transition-colors line-clamp-2" title={card.name}>
                        {card.name}
                      </h3>
                      
                      <CardImageLocal card={card} className="w-full rounded-xl shadow-lg object-cover aspect-[5/7] group-hover:scale-105 transition-transform duration-300 mb-3" />
                      
                      <div className="space-y-1 mb-4">
                        <p className="text-xs text-slate-400 truncate" title={card.type_line}>{card.type_line}</p>
                        <p className="text-xs text-slate-500 truncate flex items-center space-x-1" title={card.set_name}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                            <path d="M12 12l8 -4.5" />
                            <path d="M12 12l0 9" />
                            <path d="M12 12l-8 -4.5" />
                          </svg>
                          <span>{card.set_name}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Action buttons - always visible, side by side */}
                    <div className="flex space-x-2 mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCardDetailsModal(card);
                        }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>Add</span>
                      </button>
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

                {(!savedDecks || savedDecks.length === 0) && (
                  <p className="text-xs text-slate-500 text-center py-4">No other saved decks found.</p>
                )}
              </div>

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