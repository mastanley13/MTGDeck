import React, { useRef, useCallback, useState } from 'react';
import { getCardImageUris } from '../../utils/scryfallAPI';

/**
 * Enhanced CardImage component with double-faced card support and error handling
 */
const CardImage = ({ card, className }) => {
  const [imageState, setImageState] = useState('loading'); // 'loading', 'loaded', 'error', 'retrying'
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
      console.error('CardImage: Error processing card image URIs:', error, card);
      return [];
    }
  };

  const cardFaces = getAllCardFaceImages(card);
  const isDoubleFaced = cardFaces.length > 1;
  const currentFaceData = cardFaces[currentFace] || cardFaces[0];

  // Debug logging for problematic cards
  const problematicCards = ['A-Gutter', 'Arcee', 'Arlinn'];
  const isProblematicCard = problematicCards.some(name => card.name && card.name.includes(name));
  
  if (isProblematicCard) {
    console.log(`🎨 CardImage DEBUG for ${card.name}:`, {
      cardFaces: cardFaces,
      isDoubleFaced: isDoubleFaced,
      currentFaceData: currentFaceData,
      imageState: imageState,
      retryCount: retryCount
    });
  }

  const handleImageLoad = () => {
    setImageState('loaded');
    if (isProblematicCard) {
      console.log(`✅ Image loaded successfully for ${card.name}`);
    }
  };

  const handleImageError = () => {
    if (isProblematicCard) {
      console.log(`❌ Image error for ${card.name}, retry count: ${retryCount}`);
    }
    if (retryCount < maxRetries) {
      setImageState('retrying');
      setRetryCount(prev => prev + 1);
      // Small delay before retry to avoid rapid requests
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
    if (isProblematicCard) {
      console.log(`🚫 Showing fallback UI for ${card.name} - currentFaceData: ${currentFaceData}, state: ${imageState}`);
    }
    return (
      <div className="bg-slate-700 w-full aspect-[63/88] flex flex-col items-center justify-center text-center p-3 border border-slate-600 rounded-lg">
        <div className="text-slate-400 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <span className="text-slate-200 font-medium text-sm leading-tight">{card.name}</span>
        <span className="text-slate-400 text-xs mt-1">{card.set_name}</span>
        {imageState === 'error' && retryCount >= maxRetries && (
          <span className="text-red-400 text-xs mt-1">Image unavailable</span>
        )}
        {!currentFaceData && (
          <span className="text-yellow-400 text-xs mt-1">No image URL found</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Loading State */}
      {imageState === 'loading' || imageState === 'retrying' ? (
        <div className="bg-slate-700 w-full aspect-[63/88] flex items-center justify-center">
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
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Double-faced indicator and toggle button */}
      {isDoubleFaced && imageState === 'loaded' && (
        <>
          {/* Double-faced indicator */}
          <div className="absolute top-1 left-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-lg z-30">
            DFC
          </div>

          {/* Face counter */}
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-full z-30">
            {currentFace + 1}/{cardFaces.length}
          </div>

          {/* Flip button - positioned at bottom center */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFace();
            }}
            className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg z-30 transition-all duration-200 hover:scale-105"
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

/**
 * SearchResults component to display card search results
 * 
 * @param {Object} props
 * @param {Array} props.results - Array of card results
 * @param {boolean} props.isLoading - Loading state
 * @param {string} props.error - Error message
 * @param {boolean} props.hasMore - Whether there are more results
 * @param {Function} props.loadMore - Function to load more results
 * @param {Function} props.onCardClick - Function called when a card is clicked
 * @param {Function} props.onViewDetailsClick - Function called when the "View Details" button is clicked
 */
const SearchResults = ({
  results = [],
  isLoading,
  error,
  hasMore,
  loadMore,
  onCardClick,
  onViewDetailsClick,
  totalCards = 0
}) => {
  const observer = useRef();
  
  // Set up intersection observer for infinite scrolling
  const lastCardRef = useCallback(node => {
    if (isLoading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    
    if (node) {
      observer.current.observe(node);
    }
  }, [isLoading, hasMore, loadMore]);

  // Handle card click
  const handlePrimaryCardClick = (card) => {
    if (onCardClick) {
      onCardClick(card);
    }
  };

  const handleViewDetails = (e, card) => {
    e.stopPropagation(); // Prevent triggering onCardClick when details icon is clicked
    if (onViewDetailsClick) {
      onViewDetailsClick(card);
    }
  };

  // Display loading state
  if (isLoading && results.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <svg className="loading-spinner h-12 w-12 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-gray-300 font-medium">Searching cards...</p>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="glassmorphism-card border-red-500/50 p-6 text-center my-4">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="font-bold text-lg text-red-400 mb-2">Search Error</div>
        <div className="text-red-300">{error}</div>
      </div>
    );
  }

  // Display empty results
  if (results.length === 0) {
    return (
      <div className="glassmorphism-card border-slate-700/50 p-8 text-center my-4">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="font-bold text-lg text-white mb-2">No cards found</div>
        <div className="text-slate-300">Try adjusting your search query or filters</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Found {totalCards} card{totalCards !== 1 ? 's' : ''}
        </div>
        {hasMore && !isLoading && (
          <button
            onClick={loadMore}
            className="text-sm text-primary-400 hover:text-primary-300 font-medium"
          >
            Show more results
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((card, index) => {
          // For the last card, add a ref for infinite scrolling
          const isLastCard = index === results.length - 1;
          
          return (
            <div               key={card.id || index}              ref={isLastCard ? lastCardRef : null}              className="magic-card group bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-primary-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"            >              <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-card-hover mb-3">                <CardImage card={card} className="w-full h-auto" />                                {/* Card rarity indicator */}                {card.rarity && (                  <div className={`absolute top-1.5 left-1.5 h-2 w-2 rounded-full                     ${card.rarity === 'mythic' ? 'bg-orange-500' :                       card.rarity === 'rare' ? 'bg-yellow-400' :                       card.rarity === 'uncommon' ? 'bg-gray-300' :                       'bg-black'}`}>                  </div>                )}              </div>                            {/* Card info */}              <div className="mb-3">                <div className="text-sm font-semibold text-white leading-tight mb-1">{card.name}</div>                <div className="text-xs text-slate-400 truncate">{card.type_line}</div>              </div>                            {/* Action buttons - always visible, side by side */}              <div className="flex space-x-2">                {onViewDetailsClick && (                  <button                     onClick={(e) => {                      e.stopPropagation();                      handleViewDetails(e, card);                    }}                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"                  >                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />                    </svg>                    <span>Details</span>                  </button>                )}                {onCardClick && (                  <button                     onClick={(e) => {                      e.stopPropagation();                      handlePrimaryCardClick(card);                    }}                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"                  >                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />                    </svg>                    <span>Add</span>                  </button>                )}              </div>            </div>
          );
        })}
      </div>
      
      {/* Loading more indicator */}
      {isLoading && results.length > 0 && (
        <div className="flex justify-center items-center mt-8 pb-4">
          <svg className="animate-spin h-8 w-8 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-300">Loading more cards...</span>
        </div>
      )}
      
      {/* Load more button as fallback */}
      {!isLoading && hasMore && (
        <div className="flex justify-center mt-8 pb-4">
          <button
            onClick={loadMore}
            className="btn-modern btn-modern-primary btn-modern-sm"
          >
            Load More Cards
          </button>
        </div>
      )}
      
      {/* End of results indicator */}
      {!hasMore && results.length > 0 && (
        <div className="text-center text-gray-400 mt-8 pb-4">
          <div className="inline-block mx-auto h-px w-16 bg-slate-700/50 mb-3"></div>
          <p>End of results</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults; 