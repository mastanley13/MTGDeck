import React, { useRef, useCallback } from 'react';
import { getCardImageUris } from '../../utils/scryfallAPI';

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
        <svg className="loading-spinner h-12 w-12 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-4 text-gray-600 font-medium">Searching cards...</p>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center my-4">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="font-bold text-lg text-red-800 mb-2">Search Error</div>
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  // Display empty results
  if (results.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center my-4">
        <div className="flex justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="font-bold text-lg text-gray-700 mb-2">No cards found</div>
        <div className="text-gray-600">Try adjusting your search query or filters</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          Found {totalCards} card{totalCards !== 1 ? 's' : ''}
        </div>
        {hasMore && !isLoading && (
          <button
            onClick={loadMore}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Show more results
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {results.map((card, index) => {
          // Get the appropriate image URIs for the card
          const imageUris = getCardImageUris(card);
          
          // For the last card, add a ref for infinite scrolling
          const isLastCard = index === results.length - 1;
          
          return (
            <div 
              key={card.id || index}
              ref={isLastCard ? lastCardRef : null}
              className="magic-card group transform transition duration-200 hover:scale-105 hover:rotate-1 hover:z-10 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrimaryCardClick(card);
              }}
            >
              <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-card-hover">
                {imageUris ? (
                  <img 
                    src={imageUris.normal || imageUris.small || imageUris.large} 
                    alt={card.name}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                ) : (
                  <div className="bg-gray-200 w-full aspect-[63/88] flex items-center justify-center text-center p-2">
                    <span className="text-gray-700 font-medium">{card.name}</span>
                  </div>
                )}
                
                {/* Details button - positioned over the card image */}
                {onViewDetailsClick && (
                    <button 
                        onClick={(e) => handleViewDetails(e, card)}
                        className="absolute top-1.5 right-1.5 p-1.5 bg-black bg-opacity-40 hover:bg-opacity-60 rounded-full text-white transition-colors duration-150 z-20"
                        aria-label="View card details"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
                
                {/* Hover overlay with card info */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-end">
                  <div className="p-2 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="text-sm font-semibold drop-shadow-md leading-tight">{card.name}</div>
                    <div className="text-xs drop-shadow-md opacity-90">{card.type_line}</div>
                  </div>
                </div>
              </div>
              
              {/* Card rarity indicator */}
              {card.rarity && (
                <div className={`absolute top-1.5 left-1.5 h-2 w-2 rounded-full 
                  ${card.rarity === 'mythic' ? 'bg-orange-500' : 
                    card.rarity === 'rare' ? 'bg-yellow-400' : 
                    card.rarity === 'uncommon' ? 'bg-gray-300' : 
                    'bg-black'}`}>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Loading more indicator */}
      {isLoading && results.length > 0 && (
        <div className="flex justify-center items-center mt-8 pb-4">
          <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-600">Loading more cards...</span>
        </div>
      )}
      
      {/* Load more button as fallback */}
      {!isLoading && hasMore && (
        <div className="flex justify-center mt-8 pb-4">
          <button
            onClick={loadMore}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-sm"
          >
            Load More Cards
          </button>
        </div>
      )}
      
      {/* End of results indicator */}
      {!hasMore && results.length > 0 && (
        <div className="text-center text-gray-500 mt-8 pb-4">
          <div className="inline-block mx-auto h-px w-16 bg-gray-300 mb-3"></div>
          <p>End of results</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults; 