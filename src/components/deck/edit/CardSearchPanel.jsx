import React, { useState } from 'react';
import { IconSearch, IconPlus, IconLoader } from '@tabler/icons-react';
import SearchBar from '../../search/SearchBar.jsx';
import SearchResults from '../../search/SearchResults.jsx';
import useCardSearch from '../../../hooks/useCardSearch';
import { useDeck } from '../../../context/DeckContext.jsx';

const CardSearchPanel = ({ isEditMode, onCardAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const { addCard } = useDeck();

  // Use existing card search hook
  const cardSearch = useCardSearch({
    order: 'edhrec',
  });

  if (!isEditMode) return null;

  const handleSearch = (query) => {
    console.log('Search triggered with query:', query);
    setSearchQuery(query);
    if (query.trim()) {
      cardSearch.setQuery(query);
    } else {
      cardSearch.setQuery('');
    }
  };

  const handleAddCard = (card) => {
    // Add to deck context
    addCard(card);
    
    // Track recently added
    setRecentlyAdded(prev => {
      const updated = [card, ...prev.filter(c => c.id !== card.id)];
      return updated.slice(0, 10); // Keep last 10
    });

    // Callback for parent component
    if (onCardAdd) {
      onCardAdd(card);
    }
  };

  const handleRemoveRecent = (cardId) => {
    setRecentlyAdded(prev => prev.filter(c => c.id !== cardId));
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-primary-500/20 border border-primary-500/50 flex items-center justify-center">
          <IconSearch size={16} className="text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Search & Add Cards</h3>
          <p className="text-sm text-slate-400">Find and add cards to your deck</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glassmorphism-card p-6 border-slate-700/50">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search for cards to add..."
          className="mb-4"
        />

        {/* Search Loading */}
        {cardSearch.isLoading && (
          <div className="flex items-center justify-center py-8">
            <IconLoader className="animate-spin h-6 w-6 text-primary-400" />
            <span className="ml-2 text-slate-400">Searching cards...</span>
          </div>
        )}

        {/* Search Results */}
        {cardSearch.results.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-slate-300">
              Search Results ({cardSearch.results.length})
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto">
              {cardSearch.results.map(card => (
                <div
                  key={card.id}
                  className="group relative glassmorphism-card p-3 border-slate-700/50 hover:border-primary-500/50 transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="relative">
                    {card.image_uris ? (
                      <img
                        src={card.image_uris.small}
                        alt={card.name}
                        className="rounded-lg shadow-sm w-full block object-cover aspect-[63/88]"
                      />
                    ) : (
                      <div className="bg-slate-800 rounded-lg shadow-sm w-full aspect-[63/88] flex items-center justify-center p-2">
                        <span className="text-slate-300 text-center text-xs">{card.name}</span>
                      </div>
                    )}

                    {/* Add Button Overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => handleAddCard(card)}
                        className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors"
                        title={`Add ${card.name} to deck`}
                      >
                        <IconPlus size={20} className="text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Card Name */}
                  <div className="mt-2">
                    <span className="text-xs text-slate-300 truncate block" title={card.name}>
                      {card.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {searchQuery && !cardSearch.isLoading && cardSearch.results.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <IconSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No cards found for "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <div className="glassmorphism-card p-6 border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-slate-300">
              Recently Added ({recentlyAdded.length})
            </h4>
            <button
              onClick={() => setRecentlyAdded([])}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {recentlyAdded.map(card => (
              <div
                key={card.id}
                className="group relative glassmorphism-card p-3 border-slate-700/50 hover:border-red-500/50 transition-all duration-300"
              >
                {/* Card Image */}
                <div className="relative">
                  {card.image_uris ? (
                    <img
                      src={card.image_uris.small}
                      alt={card.name}
                      className="rounded-lg shadow-sm w-full block object-cover aspect-[63/88]"
                    />
                  ) : (
                    <div className="bg-slate-800 rounded-lg shadow-sm w-full aspect-[63/88] flex items-center justify-center p-2">
                      <span className="text-slate-300 text-center text-xs">{card.name}</span>
                    </div>
                  )}

                  {/* Remove from Recent */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleRemoveRecent(card.id)}
                      className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
                      title="Remove from recent"
                    >
                      <span className="text-white text-xs">×</span>
                    </button>
                  </div>
                </div>

                {/* Card Name */}
                <div className="mt-2">
                  <span className="text-xs text-slate-300 truncate block" title={card.name}>
                    {card.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSearchPanel; 