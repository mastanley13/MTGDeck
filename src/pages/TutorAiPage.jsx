import React, { useState, useEffect } from 'react';
import { useDeck } from '../context/DeckContext';
import { useAuth } from '../context/AuthContext';
import CardDetailModal from '../components/ui/CardDetailModal';
import { parseManaSymbols } from '../utils/manaSymbols';
import GameChangerTooltip from '../components/ui/GameChangerTooltip';
import { validateCardForCommander } from '../utils/deckValidator';
import { toast } from 'react-toastify';
import AddToDeckModal from '../components/ui/AddToDeckModal';
import SelectDeckModal from '../components/ui/SelectDeckModal';
import { useLocation } from 'react-router-dom';

const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const TutorAiPage = () => {
  const [currentDecklist, setCurrentDecklist] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [suggestedCards, setSuggestedCards] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  
  // Add states for deck selection modal
  const [isDeckModalOpen, setIsDeckModalOpen] = useState(false);
  const [selectedCardForAdding, setSelectedCardForAdding] = useState(null);

  // Remove the old deck dropdown and replace with a button to open the modal
  const [showAddDeckModal, setShowAddDeckModal] = useState(false);

  // Deck selection modal state
  const [showSelectDeckModal, setShowSelectDeckModal] = useState(false);

  const { savedDecks, fetchAndSetUserDecks, loading: decksLoading, error: decksError, addCard, currentDeckName, saveCurrentDeckToGHL } = useDeck();
  const { currentUser } = useAuth();
  const location = useLocation();
  const passedDeck = location.state?.deck;

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  useEffect(() => {
    // Use both contactId and id for maximum compatibility, just like CardSearchPage.jsx
    if (currentUser && (currentUser.contactId || currentUser.id)) {
      const userId = currentUser.contactId || currentUser.id;
      console.log('TutorAiPage: Fetching decks for userId:', userId);
      fetchAndSetUserDecks(userId);
    }
  }, [currentUser, fetchAndSetUserDecks]);

  // Pre-fill deck if passed from navigation state
  useEffect(() => {
    if (passedDeck) {
      setSelectedDeckId(passedDeck.id);
      let decklistString = '';
      if (passedDeck.commander) {
        decklistString += `${passedDeck.commander.name} (Commander)\n`;
      }
      if (passedDeck.cards && Array.isArray(passedDeck.cards)) {
        passedDeck.cards.forEach(card => {
          decklistString += `${card.quantity || 1}x ${card.name}\n`;
        });
      }
      setCurrentDecklist(decklistString.trim());
    }
  }, [passedDeck]);

  useEffect(() => {
    console.log('TutorAiPage: savedDecks', savedDecks);
  }, [savedDecks]);

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
    if (selectedDeckId) {
      setSelectedDeckId('');
    }
  };

  const fetchScryfallImage = async (cardName) => {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
      if (!response.ok) {
        console.warn(`Scryfall API error for ${cardName}: ${response.status}`);
        return null;
      }
      const cardData = await response.json();
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
          model: 'o3-2025-04-16',
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 15000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API Error:', errorData);
        throw new Error(errorData.error?.message || 'Failed to fetch suggestions from OpenAI.');
      }

      const data = await response.json();
      let aiResponse = data.choices[0]?.message?.content;
      if (!aiResponse && data.choices[0]?.text) {
        aiResponse = data.choices[0].text;
      }
      if (!aiResponse) {
        console.error('No AI response found. Full choices:', data.choices);
        setError('Received no response content from AI.');
        setIsLoading(false);
        return;
      }

      if (aiResponse) {
        let parsedAiSuggestions = [];
        try {
          const cleanedJsonResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
          parsedAiSuggestions = JSON.parse(cleanedJsonResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError, "Raw response:", aiResponse);
          setError('Received an invalid format from AI. Please try again. The AI might have provided text instead of pure JSON.');
          setIsLoading(false);
          return;
        }

        const suggestionsWithFullData = await Promise.all(
          parsedAiSuggestions.map(async (cardStub) => {
            const fullCardData = await fetchScryfallImage(cardStub.name);
            if (fullCardData) {
              // Validate card against commander's color identity
              if (savedDecks && selectedDeckId) {
                const selectedDeck = savedDecks.find(deck => deck.id === selectedDeckId);
                if (selectedDeck && selectedDeck.commander) {
                  const validation = validateCardForCommander(fullCardData, selectedDeck.commander);
                  if (!validation.valid) {
                    console.warn(`Skipping ${fullCardData.name}: ${validation.message}`);
                    return null;
                  }
                }
              }
              
              return {
                ...cardStub,
                ...fullCardData,
                imageUrl: fullCardData.image_uris?.art_crop || fullCardData.image_uris?.normal || null, 
                description: cardStub.description || fullCardData.oracle_text, 
                mana_cost: cardStub.mana_cost || fullCardData.mana_cost,
                type: cardStub.type || fullCardData.type_line,
              };
            }
            return null;
          })
        );
        
        // Filter out null entries (invalid cards) and remove duplicates by name
        const validSuggestions = suggestionsWithFullData
          .filter(card => card !== null)
          .filter((card, index, self) => 
            index === self.findIndex((c) => c.name === card.name)
          );
          
        setSuggestedCards(validSuggestions);
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
    // Only open modal if card is fully loaded (not a fallback card)
    if (card && !card._isFallbackCard && card.isLoaded !== false) {
      setSelectedCardForModal(card);
      setIsModalOpen(true);
    } else {
      // Optionally show a brief message that the card is still loading
      console.log('Card is still loading, modal will not open:', card?.name);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCardForModal(null);
  };

  // Add deck modal functions
  const handleOpenDeckModal = (card) => {
    setSelectedCardForAdding(card);
    setIsDeckModalOpen(true);
  };

  const handleCloseDeckModal = () => {
    setSelectedCardForAdding(null);
    setIsDeckModalOpen(false);
  };

  const handleAddCardToDeck = async (deckId) => {
    if (!selectedCardForAdding) return;

    if (deckId === 'current') {
      addCard(selectedCardForAdding, deckId);
      toast.success(`Added ${selectedCardForAdding.name} to current deck`);
      handleCloseDeckModal();
      return;
    }

    // Check authentication for saving to cloud decks
    if (!currentUser) {
      toast.error('Please log in to add cards to saved decks');
      handleCloseDeckModal();
      return;
    }

    // --- Step 1: Fetch the latest version of the selected deck from GHL ---
    let latestDeckRecord = null;
    try {
      const res = await fetch(
        `https://services.leadconnectorhq.com/objects/custom_objects.decks/records/${deckId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch latest deck from GHL');
      const data = await res.json();
      latestDeckRecord = data.record;
    } catch (err) {
      toast.error('Failed to fetch latest deck from cloud: ' + (err.message || err));
      handleCloseDeckModal();
      return;
    }

    // --- Step 2: Parse and upsert the card into deck_data ---
    let deckDataObj;
    try {
      deckDataObj = latestDeckRecord.properties && latestDeckRecord.properties.deck_data
        ? JSON.parse(latestDeckRecord.properties.deck_data)
        : null;
    } catch (e) {
      deckDataObj = null;
    }
    if (!deckDataObj) {
      deckDataObj = {
        v: "1.1_shortkeys",
        adn: latestDeckRecord.properties.decks || 'Untitled Deck',
        cmd: null,
        mb: [],
        ls: new Date().toISOString()
      };
    }
    let found = false;
    for (let i = 0; i < deckDataObj.mb.length; i++) {
      if (deckDataObj.mb[i].n === selectedCardForAdding.name) {
        if ((selectedCardForAdding.type_line || '').toLowerCase().includes('basic land')) {
          deckDataObj.mb[i].q = (deckDataObj.mb[i].q || 1) + 1;
        }
        found = true;
        break;
      }
    }
    if (!found) {
      deckDataObj.mb.push({
        i: selectedCardForAdding.id,
        n: selectedCardForAdding.name,
        q: 1,
        t: selectedCardForAdding.type_line,
        c: selectedCardForAdding.cmc,
        ct: selectedCardForAdding.type_line
      });
    }
    deckDataObj.ls = new Date().toISOString();

    // --- Step 3: Send PUT request to update only deck_data field ---
    try {
      const putProperties = {
        decks: latestDeckRecord.properties.decks || "Untitled Deck",
        deck_data: JSON.stringify(deckDataObj)
      };
      const putRes = await fetch(
        `https://services.leadconnectorhq.com/objects/custom_objects.decks/records/${deckId}?locationId=${import.meta.env.VITE_LOCATION_ID}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ properties: putProperties })
        }
      );
      let putResBody = null;
      try { putResBody = await putRes.json(); } catch (e) { putResBody = null; }
      if (!putRes.ok) {
        throw new Error((putResBody && putResBody.message) || `Failed to update deck: ${putRes.status}`);
      }
      await fetchAndSetUserDecks(currentUser.contactId || currentUser.id);
      toast.success(`${selectedCardForAdding.name} added to ${latestDeckRecord.properties.decks || 'deck'} and saved to cloud!`);
    } catch (err) {
      toast.error('Failed to update deck in cloud: ' + (err.message || err));
    }
    handleCloseDeckModal();
    setSelectedCardForAdding(null);
  };

  // Handler for selecting a deck from the modal
  const handleSelectDeck = (deck) => {
    setSelectedDeckId(deck.id);
    // Build decklist string for manual entry area
    let decklistString = '';
    if (deck.commander) {
      decklistString += `${deck.commander.name} (Commander)\n`;
    }
    if (deck.cards && Array.isArray(deck.cards)) {
      deck.cards.forEach(card => {
        decklistString += `${card.quantity || 1}x ${card.name}\n`;
      });
    }
    setCurrentDecklist(decklistString.trim());
    setShowSelectDeckModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 space-y-12">
        {/* Hero Header */}
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-4">              <svg className="w-12 h-12 lg:w-16 lg:h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>                <path d="M3 19a9 9 0 019 0a9 9 0 019 0" />                <path d="M3 6a9 9 0 019 0a9 9 0 019 0" />                <path d="M3 6v13" />                <path d="M12 6v13" />                <path d="M21 6v13" />              </svg>              <span>Tutor AI</span>            </h1>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-full px-6 py-3 border border-primary-500/30">
              <span className="text-primary-400 text-lg font-semibold">Refine Your Masterpiece</span>
            </div>
          </div>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Select a saved deck or enter card names below. Our AI will suggest up to 30 cards to perfect your Commander deck!
          </p>
        </div>

        {/* API Key Warning */}
        {!OPENAI_API_KEY && (
          <div className="glassmorphism-card p-6 border-yellow-500/30 bg-yellow-500/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-300">OpenAI API Key Not Configured</h3>
                <p className="text-yellow-200">This page currently uses placeholder data. Ensure your VITE_OPENAI_API_KEY is set for full AI integration.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="glassmorphism-card p-8 lg:p-12 border-primary-500/20">
          {/* Deck Selection */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span>Select a Saved Deck</span>
            </h2>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white">
                Choose from your saved decks:
              </label>
              <button
                type="button"
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50 appearance-none"
                onClick={() => setShowSelectDeckModal(true)}
                disabled={decksLoading || isLoading}
              >
                <span className="flex items-center">
                  <svg className="h-5 w-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  {decksLoading ? 'Loading your saved decks...' : '-- Select a Deck --'}
                </span>
              </button>
              {decksError && (
                <p className="text-sm text-red-300">Error loading decks: {typeof decksError === 'string' ? decksError : decksError.message}</p>
              )}
              {!decksLoading && savedDecks.length === 0 && !decksError && currentUser && (
                <p className="text-sm text-slate-400">No saved decks found.</p>
              )}
              {!currentUser && (
                <p className="text-sm text-slate-400">Login to see your saved decks.</p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex py-8 items-center mb-10">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-6 text-slate-400 text-sm font-semibold uppercase tracking-wider">Or</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span>Manual Card Entry</span>
              </h2>

              <div className="space-y-2">
                <label htmlFor="decklist" className="block text-sm font-semibold text-white">
                  Enter your card list (one card per line, include commander):
                </label>
                <textarea
                  id="decklist"
                  name="decklist"
                  rows="12"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50 resize-y"
                  placeholder={`Example format:\n\nAtraxa, Praetors' Voice (Commander)\n1x Sol Ring\n1x Command Tower\n1x Rhystic Study\n1x Smothering Tithe\n1x Fierce Guardianship\n...\n\nInclude quantities (1x, 2x, etc.) and card names exactly as they appear on the cards.`}
                  value={currentDecklist}
                  onChange={handleInputChange}
                  disabled={isLoading || decksLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || decksLoading || !currentDecklist.trim() || !OPENAI_API_KEY } 
              className="btn-modern btn-modern-primary btn-modern-xl w-full premium-glow group"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-3">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analyzing Deck...</span>
                </span>
              ) : (
                                <span className="flex items-center justify-center space-x-3">                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>                    <path d="M4 13a8 8 0 017 7a6 6 0 003 -5l3.5 -3.5a9 9 0 01 -7 -7a6 6 0 00-3 5l-3.5 3.5" />                    <path d="M7 14a6 6 0 003 -5l3.5 -3.5a9 9 0 01 7 7a6 6 0 00-3 5l-3.5 3.5a9 9 0 01-7 -7" />                    <path d="M15 9h.01" />                  </svg>                  <span>Get AI Card Suggestions</span>                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />                  </svg>                </span>
              )}
            </button>
          </form>

          {/* Features List */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center space-x-2">              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>                <path d="M9.5 2l.5 5l5 .5l-5 .5l-.5 5l-.5 -5l-5 -.5l5 -.5z" />                <path d="M4 12l2 2l2 -2l-2 -2z" />                <path d="M16 12l2 2l2 -2l-2 -2z" />                <path d="M11 19l1 1l1 -1l-1 -1z" />              </svg>              <span>What You Get</span>            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-300">AI-powered suggestions to complement your existing deck strategy.</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-300">Optimized for Commander format, aiming for around 30 card ideas.</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-300">Quickly view card details and art with Scryfall integration.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glassmorphism-card p-12 text-center border-primary-500/30">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-2">Analyzing Your Deck</h3>
            <p className="text-slate-400 text-lg">Finding up to 30 perfect card suggestions for you...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glassmorphism-card p-8 border-red-500/30 bg-red-500/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-300">Oops! Something went wrong</h3>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Grid */}
        {suggestedCards.length > 0 && !isLoading && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-3">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Suggested Cards ({suggestedCards.length} found)</span>
              </h2>
              <p className="text-xl text-slate-400">
                Click Details to view card information or Add to add cards to your decks
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {suggestedCards.map((card, index) => {
                const gameChangerEffect = card.game_changer 
                  ? 'ring-4 ring-yellow-400/90 shadow-lg shadow-yellow-400/50' 
                  : '';

                return (
                  <div 
                    key={`${card.name}-${index}`}
                    className={`group relative glassmorphism-card p-0 overflow-hidden border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 hover:shadow-modern-primary ${gameChangerEffect} flex flex-col h-full`}
                  >
                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={`Art for ${card.name}`} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-500">
                          <div className="text-center">
                            <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs">No Image</span>
                          </div>
                        </div>
                      )}

                      {/* Game Changer Badge */}
                      {card.game_changer && (
                        <div className="absolute top-2 right-2">
                          <GameChangerTooltip className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg z-10" />
                        </div>
                      )}
                    </div>
                    
                    {/* Card Details */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
                      <div className="flex items-start justify-between flex-shrink-0">
                        <h3 className="text-sm font-bold text-white flex-1 pr-2 group-hover:text-primary-300 transition-colors leading-tight">
                          {card.name}
                        </h3>
                        {/* Mana Cost Display */}
                        {card.mana_cost && (
                          <div className="flex items-center space-x-0.5 flex-shrink-0">
                            {parseManaSymbols(card.mana_cost)}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 flex-shrink-0">
                        {card.type_line || card.type}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 flex-grow overflow-hidden">
                        {card.description}
                      </p>
                      
                      {/* Action buttons - side by side - Fixed at bottom */}
                      <div className="flex space-x-2 pt-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(card);
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Details</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDeckModal(card);
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1 transition-colors shadow-md hover:shadow-lg transform hover:scale-105 transition-transform duration-200"
                        >
                          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && selectedCardForModal && (
          <CardDetailModal card={selectedCardForModal} onClose={handleCloseModal} />
        )}

        {/* AddToDeckModal for TutorAiPage */}
        <AddToDeckModal
          isOpen={!!selectedCardForAdding}
          card={selectedCardForAdding}
          savedDecks={savedDecks}
          isLoading={decksLoading}
          onAddToDeck={handleAddCardToDeck}
          onClose={() => setSelectedCardForAdding(null)}
          currentDeckName={currentDeckName}
        />

        {/* SelectDeckModal for TutorAiPage */}
        <SelectDeckModal
          isOpen={showSelectDeckModal}
          savedDecks={savedDecks}
          isLoading={decksLoading}
          onSelect={handleSelectDeck}
          onClose={() => setShowSelectDeckModal(false)}
        />
      </div>
    </div>
  );
};

export default TutorAiPage; 