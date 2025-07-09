import React from 'react';

const AddToDeckModal = ({
  isOpen,
  card,
  savedDecks = [],
  isLoading = false,
  onAddToDeck,
  onClose,
  currentDeckName = 'Untitled',
}) => {
  if (!isOpen || !card) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glassmorphism-card p-8 max-w-md w-full border-primary-500/30">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add "{card.name}"</span>
        </h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mr-4"></div>
            <span className="text-slate-300 text-lg">Loading decks...</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
            {/* Current Deck Option */}
            <button 
              onClick={() => onAddToDeck('current')}
              className="w-full btn-modern btn-modern-primary btn-modern-md text-left"
            >
              <div className="flex items-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Current Deck: {currentDeckName}</span>
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
                    onClick={() => onAddToDeck(deck.id)}
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
            {(!savedDecks || savedDecks.length === 0) && !isLoading && (
              <p className="text-xs text-slate-500 text-center py-4">No other saved decks found.</p>
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

export default AddToDeckModal; 