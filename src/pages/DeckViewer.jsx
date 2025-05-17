import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDeck } from '../context/DeckContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getCardImageUris } from '../utils/scryfallAPI';
import DeckAnalytics from '../components/deck/DeckAnalytics';
import DeckExporter from '../components/deck/DeckExporter';
import DeckShare from '../components/deck/DeckShare';

const DeckViewer = () => {
  const { deckId } = useParams();
  const { savedDecks, loadDeck, fetchAndSetUserDecks, loading: deckLoading, error: deckError } = useDeck();
  const { currentUser, loadingAuth } = useAuth();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'analytics', 'export', 'share'
  const [hasFetchedDecks, setHasFetchedDecks] = useState(false);

  useEffect(() => {
    // Fetch all decks for the user if no specific deckId is in URL and not already fetched
    if (!loadingAuth && currentUser && currentUser.id && !deckId && !hasFetchedDecks) {
      console.log('DeckViewer: Current user found, fetching decks for contact ID:', currentUser.id);
      fetchAndSetUserDecks(currentUser.id);
      setHasFetchedDecks(true); // Mark that fetching has been initiated
    }
  }, [currentUser, loadingAuth, fetchAndSetUserDecks, deckId, hasFetchedDecks]);

  // Reset hasFetchedDecks if the user logs out (currentUser becomes null)
  useEffect(() => {
    if (!currentUser) {
      setHasFetchedDecks(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // If a specific deck ID is provided, find and load that deck
    if (deckId && savedDecks && savedDecks.length > 0) {
      const deck = savedDecks.find(d => d.id === deckId);
      if (deck) {
        setSelectedDeck(deck);
        loadDeck(deck);
      }
    }
  }, [deckId, savedDecks, loadDeck]);

  // Handle loading states
  if (loadingAuth || deckLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-xl">Loading decks...</p>
        {/* You might want to add a spinner component here */}
      </div>
    );
  }

  // Handle error state
  if (deckError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        <p className="text-xl">Error loading decks: {deckError}</p>
      </div>
    );
  }

  if (!deckId && savedDecks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Decks</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-xl mb-4">You haven't saved any decks yet.</p>
          <Link to="/builder" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Start Building
          </Link>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (!selectedDeck) return null;

    switch (activeTab) {
      case 'cards':
        return (
          <div className="mt-6">
            <h3 className="text-2xl font-bold mb-4">Cards ({selectedDeck.cards.length})</h3>
            
            {/* Group cards by type and show them */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedDeck.cards.map(card => {
                const imageUris = getCardImageUris(card);
                return (
                  <div key={card.id} className="card-item">
                    {imageUris ? (
                      <img
                        src={imageUris.small}
                        alt={card.name}
                        className="rounded-lg shadow-md w-full"
                      />
                    ) : (
                      <div className="bg-gray-200 rounded-lg shadow-md w-full aspect-[63/88] flex items-center justify-center p-2">
                        <span>{card.name}</span>
                      </div>
                    )}
                    <div className="mt-1 flex justify-between">
                      <div className="text-xs truncate">{card.name}</div>
                      <div className="text-xs font-bold">{card.quantity || 1}x</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'analytics':
        return <DeckAnalytics deck={selectedDeck} />;
      case 'export':
        return <DeckExporter deck={selectedDeck} />;
      case 'share':
        return <DeckShare deck={selectedDeck} />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Decks</h1>
      
      {deckId ? (
        // Single deck view
        selectedDeck ? (
          <div>
            <Link to="/decks" className="text-indigo-600 mb-4 inline-block hover:underline">
              ← Back to All Decks
            </Link>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start">
                {selectedDeck.commander && selectedDeck.commander.image_uris && (
                  <img
                    src={selectedDeck.commander.image_uris.art_crop}
                    alt={selectedDeck.commander.name}
                    className="w-32 h-auto mr-6 rounded-lg"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold">{selectedDeck.name}</h2>
                  <div className="text-gray-600 mb-2">Commander: {selectedDeck.commander ? selectedDeck.commander.name : 'Unknown'}</div>
                  {selectedDeck.description && (
                    <p className="text-gray-700">{selectedDeck.description}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date(selectedDeck.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tab navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cards' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('cards')}
                >
                  Cards
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'export' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('export')}
                >
                  Export
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'share' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('share')}
                >
                  Share
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            {renderTabContent()}
            
            <div className="mt-8 flex space-x-4">
              <Link to={`/builder?deck=${selectedDeck.id}`} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                Edit Deck
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-xl mb-4">Deck not found.</p>
            <Link to="/decks" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              View All Decks
            </Link>
          </div>
        )
      ) : (
        // Decks list view
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDecks.map(deck => (
            <Link 
              key={deck.id} 
              to={`/decks/${deck.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                {deck.commander && deck.commander.image_uris && (
                  <img
                    src={deck.commander.image_uris.art_crop}
                    alt={deck.commander.name}
                    className="w-16 h-16 mr-4 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold">{deck.name}</h3>
                  <div className="text-sm text-gray-600">Commander: {deck.commander ? deck.commander.name : 'Unknown'}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {deck.cards.length} cards • Last updated: {new Date(deck.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          <Link 
            to="/builder"
            className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-6 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <div className="text-center">
              <div className="text-4xl font-light text-gray-400 mb-2">+</div>
              <div className="text-gray-600 font-medium">Create New Deck</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default DeckViewer; 