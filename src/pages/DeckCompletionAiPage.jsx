import React, { useState, useEffect } from 'react';
import { useDeck } from '../context/DeckContext'; // Assuming path to DeckContext
import { useAuth } from '../context/AuthContext';   // Assuming path to AuthContext
import CardDetailModal from '../components/ui/CardDetailModal'; // Import the modal

const DeckCompletionAiPage = () => {
  const [currentDecklist, setCurrentDecklist] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [suggestedCards, setSuggestedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For AI suggestions loading
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

  const { savedDecks, fetchAndSetUserDecks, loading: decksLoading, error: decksError } = useDeck();
  const { currentUser } = useAuth(); // Assuming currentUser has contactId or similar GHL ID

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY; // Prepare for OpenAI integration

  // Fetch user's decks when the component mounts or currentUser changes
  useEffect(() => {
    if (currentUser && currentUser.contactId) { // Adjust currentUser.contactId to actual GHL contact ID field
      fetchAndSetUserDecks(currentUser.contactId);
    }
  }, [currentUser, fetchAndSetUserDecks]);

  // Handle deck selection from dropdown
  const handleDeckSelectChange = (event) => {
    const deckId = event.target.value;
    setSelectedDeckId(deckId);

    if (deckId) {
      const selectedDeck = savedDecks.find(deck => deck.id === deckId);
      if (selectedDeck) {
        let decklistString = '';
        if (selectedDeck.commander) {
          decklistString += `${selectedDeck.commander.name} (Commander)\n`;
        }
        selectedDeck.cards.forEach(card => {
          decklistString += `${card.quantity}x ${card.name}\n`;
        });
        setCurrentDecklist(decklistString.trim());
      } else {
        setCurrentDecklist('');
      }
    } else {
      setCurrentDecklist('');
    }
  };

  const handleInputChange = (event) => {
    setCurrentDecklist(event.target.value);
    // If user types in textarea, deselect the deck from dropdown
    if (selectedDeckId) {
        setSelectedDeckId('');
    }
  };

  // Placeholder: will be used by actual AI call to Scryfall for images
  const fetchScryfallImage = async (cardName) => {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
      if (!response.ok) {
        console.warn(`Scryfall API error for ${cardName}: ${response.status}`);
        return null;
      }
      const cardData = await response.json();
      // Return more complete card data for the modal, not just image_uris
      return cardData;
    } catch (scryfallError) {
      console.error(`Failed to fetch full card data from Scryfall for ${cardName}:`, scryfallError);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentDecklist.trim()) return;
    // if (!OPENAI_API_KEY) { // This check will be active when OpenAI is wired
    //   setError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    //   return;
    // }

    setIsLoading(true);
    setSuggestedCards([]);
    setError(null);

    // TODO: Replace with actual OpenAI API call
    // The prompt should ask for ~30 card suggestions based on currentDecklist.
    // Example: The AI should provide name, type, mana_cost, quantity, and a reason/description.
    console.log('Decklist for AI (aiming for 30 suggestions):', currentDecklist);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate longer network delay for more cards

    // Expanded mock suggestions (not 30, but more than before to test layout)
    const mockSuggestionsData = [
      { name: 'Sol Ring', type: 'Artifact', mana_cost: '{1}', description: 'Mana ramp.', quantity: 1 },
      { name: 'Arcane Signet', type: 'Artifact', mana_cost: '{2}', description: 'Fixes mana.', quantity: 1 },
      { name: 'Command Tower', type: 'Land', mana_cost: '', description: 'Essential land.', quantity: 1 },
      { name: 'Path to Exile', type: 'Instant', mana_cost: '{W}', description: 'Exile removal.', quantity: 1 },
      { name: 'Counterspell', type: 'Instant', mana_cost: '{U}{U}', description: 'Classic counter.', quantity: 1 },
      { name: 'Demonic Tutor', type: 'Sorcery', mana_cost: '{1}{B}', description: 'Powerful tutor.', quantity: 1 },
      { name: 'Lightning Bolt', type: 'Instant', mana_cost: '{R}', description: 'Efficient burn.', quantity: 1 },
      { name: 'Birds of Paradise', type: 'Creature', mana_cost: '{G}', description: 'Mana dork.', quantity: 1 }, 
      { name: 'Cyclonic Rift', type: 'Instant', mana_cost: '{1}{U}', description: 'Board clear.', quantity: 1 },
      { name: 'Rhystic Study', type: 'Enchantment', mana_cost: '{2}{U}', description: 'Card draw.', quantity: 1 },
      { name: 'Smothering Tithe', type: 'Enchantment', mana_cost: '{3}{W}', description: 'Treasure generation.', quantity: 1 },
      { name: 'Vampiric Tutor', type: 'Instant', mana_cost: '{B}', description: 'Instant speed tutor.', quantity: 1 },
    ];

    // Simulate fetching images for mock suggestions
    const suggestionsWithFullData = await Promise.all(
        mockSuggestionsData.map(async (cardStub) => {
            const fullCardData = await fetchScryfallImage(cardStub.name);
            if (fullCardData) {
              return {
                ...cardStub, // Keep original data like quantity, AI description
                ...fullCardData, // Add full Scryfall data
                imageUrl: fullCardData.image_uris?.art_crop || fullCardData.image_uris?.normal || null, // Explicitly set imageUrl for grid
                // AI might provide a specific description/reason, so keep that too if different from oracle_text
                description: cardStub.description || fullCardData.oracle_text, 
              };
            }
            return { ...cardStub, imageUrl: null }; // Fallback if Scryfall fetch fails
        })
    );

    setSuggestedCards(suggestionsWithFullData);
    setIsLoading(false);
  };

  const handleOpenModal = (card) => {
    setSelectedCardForModal(card);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardForModal(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Deck Completion AI</h1>
      <p className="text-lg text-center mb-6 text-gray-600">
        Select one of your saved decks or manually enter card names (one per line) below.
      </p>
      <p className="text-sm text-center mb-10 text-gray-500">
        The AI will suggest up to 30 cards to help you round out your deck!
      </p>

      {!OPENAI_API_KEY && (
        <div className="max-w-xl mx-auto bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-md" role="alert">
          <p className="font-bold">OpenAI API Key Not Yet In Use</p>
          <p>This page is currently using placeholder data. Ensure your VITE_OPENAI_API_KEY is set in <code>.env</code> for when AI integration is live.</p>
        </div>
      )}

      <div className="max-w-xl mx-auto mb-8">
        <label htmlFor="deckSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select a Saved Deck:
        </label>
        <select
          id="deckSelect"
          name="deckSelect"
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out bg-white"
          value={selectedDeckId}
          onChange={handleDeckSelectChange}
          disabled={decksLoading || isLoading}
        >
          <option value="">-- Select a Deck --</option>
          {decksLoading && <option value="" disabled>Loading decks...</option>}
          {!decksLoading && savedDecks && savedDecks.map(deck => (
            <option key={deck.id} value={deck.id}>
              {deck.name} (Commander: {deck.commander ? deck.commander.name : 'N/A'})
            </option>
          ))}
        </select>
        {decksError && <p className="text-xs text-red-600 mt-1">Error loading decks: {typeof decksError === 'string' ? decksError : decksError.message}</p>}
        {!decksLoading && savedDecks.length === 0 && !decksError && currentUser && <p className="text-xs text-gray-500 mt-1">No saved decks found for your account.</p>}
        {!currentUser && <p className="text-xs text-gray-500 mt-1">Login to see your saved decks.</p>}
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-xl mb-12">
        <div className="mb-4">
            <p className="text-center text-gray-500 text-sm mb-2">--- OR ---</p>
        </div>
        <div className="mb-6">
          <label htmlFor="decklist" className="block text-sm font-medium text-gray-700 mb-2">
            Manually Enter Card List (one card per line, include commander):
          </label>
          <textarea
            id="decklist"
            name="decklist"
            rows="10"
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition duration-150 ease-in-out"
            placeholder="e.g.,\nAtraxa, Praetors\' Voice (Commander)\n1x Sol Ring\n1x Command Tower\n..."
            value={currentDecklist}
            onChange={handleInputChange}
            disabled={isLoading || decksLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || decksLoading || !currentDecklist.trim() || !OPENAI_API_KEY } // Added OPENAI_API_KEY check for submit
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {isLoading ? 'Analyzing Deck...' : 'Get Card Suggestions'}
        </button>
      </form>

      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Finding up to 30 card suggestions for you...</p>
        </div>
      )}

      {error && (
        <div className="max-w-xl mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6 shadow-md" role="alert">
          <strong className="font-bold">Oops! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {suggestedCards.length > 0 && !isLoading && (
        <div>
          <h2 className="text-3xl font-semibold text-center mb-8 text-gray-700">Suggested Cards ({suggestedCards.length} shown):</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {suggestedCards.map((card, index) => (
              <div 
                key={`${card.name}-${index}`}
                className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer"
                onClick={() => handleOpenModal(card)} // Attach click handler
              >
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={`Art for ${card.name}`} className="w-full h-48 object-cover object-top" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="absolute text-xs bottom-2 left-2 p-1 bg-gray-700 bg-opacity-50 text-white rounded">No Image</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-md font-semibold text-gray-800 mb-1 truncate">{card.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">{card.type_line || card.type} - {card.mana_cost}</p>
                  <p className="text-xs text-gray-600 leading-tight mb-2">Qty: {card.quantity}</p>
                  <p className="text-xs text-gray-600 leading-tight h-16 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && selectedCardForModal && (
        <CardDetailModal card={selectedCardForModal} onClose={handleCloseModal} />
      )}
    </div>
  );
};

export default DeckCompletionAiPage; 