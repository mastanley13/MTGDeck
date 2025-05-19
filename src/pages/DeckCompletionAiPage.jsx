import React, { useState, useEffect } from 'react';
import { useDeck } from '../context/DeckContext'; // Assuming path to DeckContext
import { useAuth } from '../context/AuthContext';   // Assuming path to AuthContext
import CardDetailModal from '../components/ui/CardDetailModal'; // Import the modal

// Checkmark Icon Component (can be moved to a shared UI components file)
const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

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
    if (!OPENAI_API_KEY) { 
      setError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      return;
    }

    setIsLoading(true);
    setSuggestedCards([]);
    setError(null);

    const prompt = `
      You are an expert Magic: The Gathering deck completion AI.
      A user has provided the following partial decklist:
      """
      ${currentDecklist}
      """
      Based on this list, please suggest approximately 30 cards to help complete a 99-card Commander deck (plus the commander if it's mentioned in the list or inferable).
      The suggestions should aim to improve the deck's synergy, power level, and address potential weaknesses (like ramp, card draw, removal, mana fixing, win conditions) based on the provided cards.
      For each suggested card, provide:
      1. name: The full name of the card.
      2. quantity: The number of copies to suggest (typically 1 for Commander, unless it's a basic land or a card that explicitly allows multiple copies like Seven Dwarves).
      3. type: The card's primary type (e.g., Creature, Instant, Sorcery, Artifact, Enchantment, Land, Planeswalker).
      4. mana_cost: The mana cost of the card (e.g., {1}{W}{U}).
      5. description: A brief explanation (1-2 sentences) of why this card is a good suggestion for THIS deck, considering the existing cards and potential strategy. This reason is important.

      Return your response as a valid JSON array of objects, like this example:
      [
        {
          "name": "Sol Ring",
          "quantity": 1,
          "type": "Artifact",
          "mana_cost": "{1}",
          "description": "Provides excellent mana ramp, crucial for any Commander deck."
        },
        {
          "name": "Swords to Plowshares",
          "quantity": 1,
          "type": "Instant",
          "mana_cost": "{W}",
          "description": "Efficient single-target removal for problematic creatures."
        }
        // ... more card suggestions (around 30 total)
      ]
      Ensure the JSON is well-formed and contains only the JSON array. Do not include any other text or explanations outside the JSON structure.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Consider gpt-4 for potentially better suggestions if available/budget allows
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 3000, // Increased max_tokens to accommodate ~30 card suggestions with details
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch suggestions from OpenAI.');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        let parsedAiSuggestions = [];
        try {
          // Remove potential markdown formatting and ensure it's valid JSON
          const cleanedJsonResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
          parsedAiSuggestions = JSON.parse(cleanedJsonResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError, "Raw response:", aiResponse);
          setError('Received an invalid format from AI. Please try again. The AI might have provided text instead of pure JSON.');
          setIsLoading(false);
          return;
        }

        // Simulate fetching images for mock suggestions
        const suggestionsWithFullData = await Promise.all(
            parsedAiSuggestions.map(async (cardStub) => {
                const fullCardData = await fetchScryfallImage(cardStub.name);
                if (fullCardData) {
                  return {
                    ...cardStub, // Keep AI-provided data like quantity, AI description
                    ...fullCardData, // Add full Scryfall data
                    imageUrl: fullCardData.image_uris?.art_crop || fullCardData.image_uris?.normal || null, 
                    // Use AI's description if provided, otherwise fallback to Scryfall's oracle_text
                    description: cardStub.description || fullCardData.oracle_text, 
                    // Ensure mana_cost and type from AI are used if Scryfall's format differs or is missing
                    mana_cost: cardStub.mana_cost || fullCardData.mana_cost,
                    type: cardStub.type || fullCardData.type_line,
                  };
                }
                // Fallback if Scryfall fetch fails but AI provided a card
                return { 
                    ...cardStub, 
                    name: cardStub.name, 
                    imageUrl: null, 
                    description: cardStub.description || "No Scryfall data found for this card, AI reason provided."
                }; 
            })
        );
        setSuggestedCards(suggestionsWithFullData);
      } else {
        setError('Received no response content from AI.');
      }
    } catch (apiError) {
      console.error('API call failed:', apiError);
      setError(apiError.message || 'An unexpected error occurred while fetching suggestions.');
    }
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
    <div className="min-h-screen bg-stone-700 py-12 px-4 text-slate-200 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto bg-slate-700 border-2 border-logoScheme-gold rounded-xl p-6 md:p-8 shadow-2xl">

        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-bold text-logoScheme-gold">
            Deck Completion A.I.
          </h1>
        </div>

        <div className="text-center mb-6">
          <span className="bg-logoScheme-gold text-slate-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
            Refine Your Masterpiece
          </span>
        </div>

        <p className="text-slate-300 text-center mb-4">
          Select a saved deck or enter card names below. The AI will suggest up to 30 cards to round out your deck!
        </p>
        
        {!OPENAI_API_KEY && (
          <div className="mx-auto bg-yellow-900 bg-opacity-50 border-l-4 border-yellow-500 text-yellow-300 p-4 mb-6 rounded-md shadow-md" role="alert">
            <p className="font-bold">OpenAI API Key Not Yet In Use</p>
            <p className="text-sm">This page currently uses placeholder data. Ensure your VITE_OPENAI_API_KEY is set for full AI integration.</p>
          </div>
        )}

        <div className="mb-8">
          <label htmlFor="deckSelect" className="block text-sm font-medium text-slate-200 mb-2">
            Select a Saved Deck:
          </label>
          <select
            id="deckSelect"
            name="deckSelect"
            className="w-full p-3 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-logoScheme-gold focus:border-logoScheme-gold transition duration-150 ease-in-out bg-slate-800 text-slate-100 placeholder-slate-400"
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
          {decksError && <p className="text-xs text-logoScheme-red mt-1">Error loading decks: {typeof decksError === 'string' ? decksError : decksError.message}</p>}
          {!decksLoading && savedDecks.length === 0 && !decksError && currentUser && <p className="text-xs text-slate-400 mt-1">No saved decks found.</p>}
          {!currentUser && <p className="text-xs text-slate-400 mt-1">Login to see your saved decks.</p>}
        </div>

        <form onSubmit={handleSubmit} className="mb-10">
          <div className="relative flex py-5 items-center mb-4">
            <div className="flex-grow border-t border-slate-600"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm uppercase">Or</span>
            <div className="flex-grow border-t border-slate-600"></div>
          </div>
      
          <div className="mb-6">
            <label htmlFor="decklist" className="block text-sm font-medium text-slate-200 mb-2">
              Manually Enter Card List (one card per line, include commander):
            </label>
            <textarea
              id="decklist"
              name="decklist"
              rows="8" // Reduced rows slightly
              className="w-full p-3 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-logoScheme-gold focus:border-logoScheme-gold transition duration-150 ease-in-out bg-slate-800 text-slate-100 placeholder-slate-400"
              placeholder="e.g.,\nAtraxa, Praetors' Voice (Commander)\n1x Sol Ring\n1x Command Tower\n..."
              value={currentDecklist}
              onChange={handleInputChange}
              disabled={isLoading || decksLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || decksLoading || !currentDecklist.trim() || !OPENAI_API_KEY } 
            className="w-full bg-logoScheme-gold hover:bg-yellow-500 text-slate-800 font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:ring-offset-2 focus:ring-offset-slate-700"
          >
            {isLoading ? 'Analyzing Deck...' : 'Get Card Suggestions'}
          </button>
        </form>

        <div className="space-y-3 text-slate-300 mb-10 text-sm">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-logoScheme-gold mr-2 mt-0.5 flex-shrink-0" />
            <span>AI-powered suggestions to complement your existing deck strategy.</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-logoScheme-gold mr-2 mt-0.5 flex-shrink-0" />
            <span>Optimized for Commander format, aiming for around 30 card ideas.</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-logoScheme-gold mr-2 mt-0.5 flex-shrink-0" />
            <span>Quickly view card details and art with Scryfall integration.</span>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logoScheme-gold mx-auto"></div>
            <p className="mt-4 text-slate-300">Finding up to 30 card suggestions for you...</p>
          </div>
        )}

        {error && (
          <div className="mx-auto bg-red-900 bg-opacity-50 border border-logoScheme-red text-red-300 px-4 py-3 rounded-xl relative mb-6 shadow-md" role="alert">
            <strong className="font-bold">Oops! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {suggestedCards.length > 0 && !isLoading && (
          <div>
            <h2 className="text-2xl font-semibold text-center mb-8 text-logoScheme-gold">Suggested Cards ({suggestedCards.length} shown):</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {suggestedCards.map((card, index) => (
                <div 
                  key={`${card.name}-${index}`}
                  className="bg-slate-800 border border-slate-600 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer flex flex-col"
                  onClick={() => handleOpenModal(card)}
                >
                  {card.imageUrl ? (
                    <img src={card.imageUrl} alt={`Art for ${card.name}`} className="w-full h-60 object-cover object-top" />
                  ) : (
                    <div className="w-full h-60 bg-slate-700 flex items-center justify-center text-slate-500 relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="absolute text-xs bottom-2 left-2 p-1 bg-slate-800 bg-opacity-70 text-slate-200 rounded">No Image</span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-md font-semibold text-logoScheme-gold mb-1 truncate min-h-[3em]">{card.name}</h3>
                    <p className="text-xs text-slate-400 mb-1">{card.type_line || card.type} - {card.mana_cost}</p>
                    <p className="text-xs text-slate-300 leading-snug mb-2">Qty: {card.quantity}</p>
                    <p className="text-xs text-slate-300 leading-snug flex-grow h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-700">{card.description}</p>
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
    </div>
  );
};

export default DeckCompletionAiPage; 