import React from 'react';

const SelectDeckModal = ({
  isOpen,
  savedDecks = [],
  isLoading = false,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glassmorphism-card p-8 max-w-md w-full border-primary-500/30">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Select a Saved Deck</span>
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mr-4"></div>
            <span className="text-slate-300 text-lg">Loading decks...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
            {savedDecks && savedDecks.length > 0 ? (
              savedDecks.map((deck) => (
                <button
                  key={deck.id}
                  onClick={() => onSelect(deck)}
                  className="w-full btn-modern btn-modern-secondary btn-modern-md text-left mb-1"
                >
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{deck.name}{deck.commander ? ` (Commander: ${deck.commander.name})` : ''}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No saved decks found.</p>
            )}
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full btn-modern btn-modern-outline btn-modern-md"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default SelectDeckModal; 