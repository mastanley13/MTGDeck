import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDeck } from '../context/DeckContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getCardImageUris } from '../utils/scryfallAPI';
import DeckAnalytics from '../components/deck/DeckAnalytics';
import DeckExporter from '../components/deck/DeckExporter';
import DeckShare from '../components/deck/DeckShare';
import CardDetailModal from '../components/ui/CardDetailModal.jsx';

const DeckViewer = () => {
  const { deckId } = useParams();
  const { savedDecks, loadDeck, fetchAndSetUserDecks, loading: deckLoading, error: deckError } = useDeck();
  const { currentUser, loadingAuth } = useAuth();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'analytics', 'export', 'share'
  const [hasFetchedDecks, setHasFetchedDecks] = useState(false);
  const [isCardDetailModalOpen, setIsCardDetailModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

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

  // Handler to open the card detail modal
  const handleOpenCardDetailModal = (card) => {
    // The card object from selectedDeck.cards might be minimal.
    // We need to ensure it has all the fields CardDetailModal expects,
    // especially image_uris and oracle_text.
    // If not, we might need to fetch full card data here or ensure selectedDeck.cards has it.
    // For now, assuming `card` has enough details or CardDetailModal can handle missing fields.
    setSelectedCardForModal(card);
    setIsCardDetailModalOpen(true);
  };

  // Handler to close the card detail modal
  const handleCloseCardDetailModal = () => {
    setIsCardDetailModalOpen(false);
    setSelectedCardForModal(null);
  };

  // Handle loading states
  if (loadingAuth || deckLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-300">
        <p className="text-xl">Loading decks...</p>
        {/* You might want to add a spinner component here */}
      </div>
    );
  }

  // Handle error state
  if (deckError) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-logoScheme-red">
        <p className="text-xl">Error loading decks: {deckError}</p>
      </div>
    );
  }

  if (!deckId && savedDecks.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-logoScheme-gold">Your Decks</h1>
        <div className="bg-logoScheme-darkGray border border-logoScheme-brown rounded-lg shadow-md p-8 text-center">
          <p className="text-xl mb-4 text-gray-100">You haven't saved any decks yet.</p>
          <Link to="/builder" className="btn-primary px-6 py-3">
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
            <h3 className="text-2xl font-bold mb-4 text-logoScheme-gold">Cards ({selectedDeck.cards.length})</h3>
            
            {/* Group cards by type and show them */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {selectedDeck.cards.map(card => {
                const imageUris = getCardImageUris(card);
                // Add a conditional class for game changers
                const cardItemClasses = [
                  "card-item",
                  "cursor-pointer",
                  "relative", // Needed for potential future badges/icons positioned absolutely
                  card.game_changer ? `ring-4 ring-logoScheme-gold ring-offset-2 ring-offset-logoScheme-darkGray rounded-lg` : ""
                ].join(" ").trim();

                return (
                  <div 
                    key={card.id} 
                    className={cardItemClasses} // Updated className
                    onClick={() => handleOpenCardDetailModal(card)}
                  >
                    {imageUris ? (
                      <img
                        src={imageUris.small}
                        alt={card.name}
                        className="rounded-lg shadow-md w-full block" // Ensure image is a block and rounded
                      />
                    ) : (
                      <div className="bg-gray-700 rounded-lg shadow-md w-full aspect-[63/88] flex items-center justify-center p-2">
                        <span className="text-gray-200">{card.name}</span>
                      </div>
                    )}
                    {/* Optional: Add a specific badge/icon for game_changer here if preferred over border */}
                    {/* Example badge:
                    {card.game_changer && (
                      <span className="absolute top-1 right-1 bg-yellow-400 text-black text-xs font-bold px-1.5 py-0.5 rounded-full shadow-md">GC</span>
                    )}
                    */}
                    <div className="mt-1 flex justify-between text-gray-300">
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
    <div className="container mx-auto px-4 py-8 text-gray-300">
      <h1 className="text-3xl font-bold mb-6 text-logoScheme-gold">Your Decks</h1>
      
      {deckId ? (
        // Single deck view
        selectedDeck ? (
          <div>
            <Link to="/decks" className="text-logoScheme-blue mb-4 inline-block hover:underline">
              ← Back to All Decks
            </Link>
            
            <div className="bg-logoScheme-darkGray border border-logoScheme-brown rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start">
                {selectedDeck.commander && selectedDeck.commander.image_uris && (
                  <img
                    src={selectedDeck.commander.image_uris.art_crop}
                    alt={selectedDeck.commander.name}
                    className="w-32 h-auto mr-6 rounded-lg border border-logoScheme-brown"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-logoScheme-gold">{selectedDeck.name}</h2>
                  <div className="text-gray-300 mb-2">Commander: {selectedDeck.commander ? selectedDeck.commander.name : 'Unknown'}</div>
                  {selectedDeck.description && (
                    <p className="text-gray-300">{selectedDeck.description}</p>
                  )}
                  <div className="text-sm text-gray-400 mt-2">
                    Last updated: {new Date(selectedDeck.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tab navigation */}
            <div className="border-b border-logoScheme-brown mb-6">
              <nav className="flex space-x-8">
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cards' ? 'border-logoScheme-gold text-logoScheme-gold' : 'border-transparent text-gray-400 hover:text-logoScheme-gold hover:border-yellow-400'}`}
                  onClick={() => setActiveTab('cards')}
                >
                  Cards
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics' ? 'border-logoScheme-gold text-logoScheme-gold' : 'border-transparent text-gray-400 hover:text-logoScheme-gold hover:border-yellow-400'}`}
                  onClick={() => setActiveTab('analytics')}
                >
                  Analytics
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'export' ? 'border-logoScheme-gold text-logoScheme-gold' : 'border-transparent text-gray-400 hover:text-logoScheme-gold hover:border-yellow-400'}`}
                  onClick={() => setActiveTab('export')}
                >
                  Export
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'share' ? 'border-logoScheme-gold text-logoScheme-gold' : 'border-transparent text-gray-400 hover:text-logoScheme-gold hover:border-yellow-400'}`}
                  onClick={() => setActiveTab('share')}
                >
                  Share
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            {renderTabContent()}
            
            <div className="mt-8 flex space-x-4">
              <Link to={`/builder?deck=${selectedDeck.id}`} className="btn-secondary px-4 py-2">
                Edit Deck
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-logoScheme-darkGray border border-logoScheme-brown rounded-lg shadow-md p-8 text-center">
            <p className="text-xl mb-4 text-gray-100">Deck not found.</p>
            <Link to="/decks" className="btn-primary px-6 py-3">
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
              className="bg-logoScheme-darkGray border border-logoScheme-brown rounded-lg shadow-md p-6 hover:border-logoScheme-gold hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center">
                {deck.commander && deck.commander.image_uris && (
                  <img
                    src={deck.commander.image_uris.art_crop}
                    alt={deck.commander.name}
                    className="w-16 h-16 mr-4 rounded-full object-cover border border-logoScheme-gold"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-logoScheme-gold">{deck.name}</h3>
                  <div className="text-sm text-gray-300">Commander: {deck.commander ? deck.commander.name : 'Unknown'}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {deck.cards.length} cards • Last updated: {new Date(deck.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
          
          <Link 
            to="/builder"
            className="bg-gray-700 rounded-lg border-2 border-dashed border-logoScheme-brown p-6 flex items-center justify-center hover:bg-gray-600 transition-colors"
          >
            <div className="text-center">
              <div className="text-4xl font-light text-gray-400 mb-2">+</div>
              <div className="text-gray-300 font-medium">Create New Deck</div>
            </div>
          </Link>
        </div>
      )}

      {/* Render CardDetailModal */}
      {isCardDetailModalOpen && selectedCardForModal && (
        <CardDetailModal 
          card={selectedCardForModal} 
          onClose={handleCloseCardDetailModal} 
        />
      )}
    </div>
  );
};

export default DeckViewer; 