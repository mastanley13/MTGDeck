import React, { useRef, useCallback, useState, useMemo } from 'react';
import { getCardImageUris } from '../../utils/scryfallAPI';
import EnhancedCardImage from '../ui/EnhancedCardImage';

/**
 * SearchResults component to display card search results with optimized images
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
  // Memoize sorted results
  const sortedResults = useMemo(() => {
    if (!results || results.length === 0) return results;
    
    const originalCards = [];
    const arenaCards = [];
    
    results.forEach(card => {
      if (card.name && card.name.startsWith('A-')) {
        arenaCards.push(card);
      } else {
        originalCards.push(card);
      }
    });
    
    return [...originalCards, ...arenaCards];
  }, [results]);

  const observer = useRef();
  
  // Memoized intersection observer callback
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

  // Memoized card click handlers
  const handlePrimaryCardClick = useCallback((card) => {
    if (onCardClick) {
      onCardClick(card);
    }
  }, [onCardClick]);

  const handleViewDetails = useCallback((e, card) => {
    e.stopPropagation();
    if (onViewDetailsClick) {
      onViewDetailsClick(card);
    }
  }, [onViewDetailsClick]);

  // Display loading state
  if (isLoading && sortedResults.length === 0) {
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
  if (sortedResults.length === 0) {
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

  // Memoized card renderer
  const CardItem = useMemo(() => ({ card, isLastCard }) => (
    <div 
      ref={isLastCard ? lastCardRef : null}
      key={card.id}
      className="magic-card group bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 hover:border-primary-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer"
      onClick={() => handlePrimaryCardClick(card)}
    >
      <div className="relative rounded-xl overflow-hidden shadow-card hover:shadow-card-hover mb-3">
        <EnhancedCardImage
          card={card}
          context="GRID_VIEW"
          aspectRatio="card"
          className="w-full h-auto"
          showDoubleFaceToggle={true}
          alt={`${card.name} Magic: The Gathering card`}
        />
        
        {card.rarity && (
          <div className={`absolute top-1.5 left-1.5 h-2 w-2 rounded-full z-40
            ${card.rarity === 'mythic' ? 'bg-orange-500' :
              card.rarity === 'rare' ? 'bg-yellow-400' :
              card.rarity === 'uncommon' ? 'bg-gray-300' :
              'bg-black'}`}>
          </div>
        )}
        
        {card.name && card.name.startsWith('A-') && (
          <div className="absolute top-1.5 right-1.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-lg z-40">
            Arena
          </div>
        )}
      </div>
      
      <div className="mb-3">
        <div className="text-sm font-semibold text-white leading-tight mb-1">{card.name}</div>
        <div className="text-xs text-slate-400 truncate">{card.type_line}</div>
      </div>
      
      <div className="flex space-x-2">
        {onViewDetailsClick && (
          <button
            onClick={(e) => handleViewDetails(e, card)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Details</span>
          </button>
        )}
        
        {onCardClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrimaryCardClick(card);
            }}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Select</span>
          </button>
        )}
      </div>
    </div>
  ), [handlePrimaryCardClick, handleViewDetails, lastCardRef]);

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">
          Found {totalCards} card{totalCards !== 1 ? 's' : ''}
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sortedResults.map((card, index) => (
          <CardItem
            key={card.id}
            card={card}
            isLastCard={index === sortedResults.length - 1}
          />
        ))}
      </div>
      
      {/* Loading more indicator */}
      {isLoading && sortedResults.length > 0 && (
        <div className="flex justify-center items-center mt-8 pb-4">
          <svg className="animate-spin h-8 w-8 text-primary-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="ml-3 text-gray-300">Loading more cards...</span>
        </div>
      )}
      
      {/* End of results indicator */}
      {!hasMore && sortedResults.length > 0 && (
        <div className="text-center text-gray-400 mt-8 pb-4">
          <div className="inline-block mx-auto h-px w-16 bg-slate-700/50 mb-3"></div>
          <p>End of results</p>
        </div>
      )}
    </div>
  );
};

export default SearchResults; 