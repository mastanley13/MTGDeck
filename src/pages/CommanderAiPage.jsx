import React, { useState, useEffect } from 'react';
import CardDetailModal from '../components/ui/CardDetailModal';
import AlertModal from '../components/ui/AlertModal.jsx';
import InputModal from '../components/ui/InputModal.jsx';
import { useNavigate } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { useAuth } from '../context/AuthContext.jsx';
import { isDeckValid } from '../utils/deckValidator.js';
import GameChangerTooltip from '../components/ui/GameChangerTooltip';

// Checkmark Icon Component
const CheckIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const CommanderAiPage = () => {
  const [preferences, setPreferences] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK',
    showCancelButton: false,
  });

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [inputModalConfig, setInputModalConfig] = useState({
    title: '',
    message: '',
    inputLabel: '',
    initialValue: '',
    placeholder: '',
    onConfirm: () => {},
    confirmText: 'Submit',
  });

  // State for triggering save via useEffect
  const [deckNameFromModal, setDeckNameFromModal] = useState(null);
  const [commanderForSaving, setCommanderForSaving] = useState(null);

  const { 
    setCommander: setContextCommander, 
    clearDeckContents,
    setDeckName: setContextDeckName,
    saveCurrentDeckToGHL,
    loading: deckContextLoading,
    error: deckContextError,
  } = useDeck();
  
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

  const handleInputChange = (event) => {
    setPreferences(event.target.value);
  };

  const fetchScryfallCardData = async (cardName) => {
    try {
      const response = await fetch(`https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardName)}`);
      if (!response.ok) {
        console.warn(`Scryfall API error for ${cardName}: ${response.status}`);
        return null;
      }
      return await response.json();
    } catch (scryfallError) {
      console.error(`Failed to fetch card data from Scryfall for ${cardName}:`, scryfallError);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!preferences.trim()) return;
    if (!OPENAI_API_KEY) {
      setError('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
      return;
    }

    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    const prompt = `
      You are an expert Magic: The Gathering Commander suggestion AI.
      A user is looking for commander suggestions based on the following preferences: "${preferences}"
      Please suggest 15 commanders that fit these preferences.
      For each commander, provide:
      1. name: The full name of the commander card.
      2. colors: An array of strings representing the commander's color identity (e.g., ["W", "U", "B", "R", "G"]).
      3. description: A brief explanation (1-2 sentences) of why this commander fits the preferences or its general strategy. This description will be shown on the card tile.

      Return your response as a valid JSON array of objects, like this example:
      [
        {
          "name": "Atraxa, Praetors\' Voice",
          "colors": ["W", "U", "B", "G"],
          "description": "Atraxa excels with +1/+1 counters, proliferate mechanics, and can support various strategies like Superfriends or Infect."
        }
        // ... more commanders
      ]
      Ensure the JSON is well-formed and contains only the JSON array.
    `;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000,
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
          const cleanedJsonResponse = aiResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '');
          parsedAiSuggestions = JSON.parse(cleanedJsonResponse);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError, "Raw response:", aiResponse);
          setError('Received an invalid format from AI. Please try again.');
          setIsLoading(false);
          return;
        }

        const suggestionsWithFullData = await Promise.all(
          parsedAiSuggestions.map(async (aiSuggestion) => {
            const scryfallData = await fetchScryfallCardData(aiSuggestion.name);
            if (scryfallData) {
              // Verify color identity matches between AI suggestion and Scryfall data
              const aiColors = aiSuggestion.colors || [];
              const scryfallColors = scryfallData.color_identity || [];
              
              // Check if colors match (both arrays should contain the same elements)
              const colorsMatch = aiColors.length === scryfallColors.length && 
                                aiColors.every(color => scryfallColors.includes(color)) &&
                                scryfallColors.every(color => aiColors.includes(color));
              
              if (!colorsMatch) {
                console.warn(`Color mismatch for ${aiSuggestion.name}: AI suggested [${aiColors.join(',')}] but Scryfall has [${scryfallColors.join(',')}]. Using Scryfall data.`);
              }
              
              return {
                ...scryfallData,
                aiDescription: aiSuggestion.description,
                colors: scryfallColors, // Use Scryfall color identity as the authoritative source
                imageUrl: scryfallData.image_uris?.art_crop || scryfallData.image_uris?.normal || null,
              };
            }
            return { 
                ...aiSuggestion, 
                name: aiSuggestion.name,
                description: aiSuggestion.description,
                imageUrl: null 
            };
          })
        );
        setSuggestions(suggestionsWithFullData);
      } else {
        setError('Received no response content from AI.');
      }
    } catch (apiError) {
      console.error('API call failed:', apiError);
      setError(apiError.message || 'An unexpected error occurred.');
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

  // useEffect to handle the actual saving logic after modal confirmation
  useEffect(() => {
    const performSaveActual = async () => {
      // Check if already loading to prevent potential re-entry if states flap weirdly
      if (deckContextLoading) {
        console.warn("Save already in progress, skipping redundant call in useEffect.");
        return;
      }

      if (deckNameFromModal && commanderForSaving && currentUser && isAuthenticated) { // Ensure isAuthenticated here too
        // Ensure deck name in context is updated just before save, though saveCurrentDeckToGHL takes it as arg
        setContextDeckName(deckNameFromModal); 
        
        const success = await saveCurrentDeckToGHL(
          currentUser.id, 
          commanderForSaving.name, // GHL deck name field
          deckNameFromModal       // Local deck name (also stored in GHL payload)
        );

        if (success) {
          setAlertModalConfig({
            title: 'New Deck Saved!',
            message: `Deck "${deckNameFromModal}" (Commander: ${commanderForSaving.name}) saved to cloud and locally! You can now build it.`,
            showCancelButton: false,
          });
        } else {
          setAlertModalConfig({
            title: 'Save Failed',
            message: deckContextError || 'An unknown error occurred while saving the new deck. Please try again.',
            showCancelButton: false,
          });
        }
        setIsAlertModalOpen(true);

        // Reset state to prevent re-triggering
        setDeckNameFromModal(null);
        setCommanderForSaving(null);
      }
    };

    if (deckNameFromModal && commanderForSaving && !deckContextLoading) { // Add !deckContextLoading here
      performSaveActual();
    }
  }, [
    deckNameFromModal, 
    commanderForSaving, 
    saveCurrentDeckToGHL, 
    setContextDeckName, 
    currentUser, 
    deckContextError, 
    isAuthenticated, 
    deckContextLoading // Added deckContextLoading
]);

  const handleSaveNewDeckFromAI = async (commanderToSaveAsNewDeck) => {
    if (!isAuthenticated) {
        setAlertModalConfig({
            title: 'Login Required',
            message: 'Please log in to save a new deck.',
            showCancelButton: false,
        });
        setIsAlertModalOpen(true);
        return;
    }

    // This is the card object from AI suggestions, potentially augmented by Scryfall
    const cardDataForContext = {
        ...commanderToSaveAsNewDeck,
        // Ensure all fields expected by setContextCommander and GHL save are present
        // The AI suggestion already has 'name', 'colors'. Scryfall data adds more.
        // For GHL save, 'name' is primary. For context, various fields might be used.
        // Re-mapping or ensuring fields are correctly named if AI output differs from Scryfall structure.
        name: commanderToSaveAsNewDeck.name,
        image_uris: commanderToSaveAsNewDeck.image_uris || { art_crop: commanderToSaveAsNewDeck.imageUrl, normal: commanderToSaveAsNewDeck.imageUrl },
        color_identity: commanderToSaveAsNewDeck.colors, // From AI suggestion
        // Include other fields if DeckContext's setCommander expects them, or GHL save needs them directly from commanderForSaving
        mana_cost: commanderToSaveAsNewDeck.mana_cost, 
        type_line: commanderToSaveAsNewDeck.type_line, 
        oracle_text: commanderToSaveAsNewDeck.oracle_text, 
        power: commanderToSaveAsNewDeck.power,
        toughness: commanderToSaveAsNewDeck.toughness,
        loyalty: commanderToSaveAsNewDeck.loyalty,
        legalities: commanderToSaveAsNewDeck.legalities,
        set_name: commanderToSaveAsNewDeck.set_name,
        set: commanderToSaveAsNewDeck.set,
        collector_number: commanderToSaveAsNewDeck.collector_number,
        edhrec_rank: commanderToSaveAsNewDeck.edhrec_rank,
    };
    
    setContextCommander(cardDataForContext); // Set new commander in context
    if (clearDeckContents) {
      clearDeckContents(); // Clear existing cards from context state
    } else {
      console.warn("clearDeckContents function not found in DeckContext. Proceeding without clearing existing cards.");
    }

    // Deck validation (isDeckValid might not be relevant here if we are just saving commander)
    // const deckValidation = isDeckValid(cardDataForContext, []); // Always true if cards is empty

    const launchInputModalForNewDeck = () => {
      setInputModalConfig({
        title: 'Enter Deck Name',
        message: 'Please provide a name for your new deck (this name is for your local records).',
        inputLabel: 'Local Deck Name',
        initialValue: cardDataForContext.name, // Default to commander's name
        placeholder: 'e.g., My Awesome New Deck',
        onConfirm: async (inputValue) => { // inputValue is the deck name from modal
          setIsInputModalOpen(false);
          if (!inputValue || inputValue.trim() === '') {
            setAlertModalConfig({
              title: 'Missing Name',
              message: 'Please enter a valid deck name for your local records.',
              showCancelButton: false,
            });
            setIsAlertModalOpen(true);
            return;
          }
          // Trigger the useEffect to perform the save by setting state
          setCommanderForSaving(cardDataForContext); // Pass the full commander data
          setDeckNameFromModal(inputValue.trim());
        },
        confirmText: 'Confirm & Save',
      });
      setIsInputModalOpen(true);
    };

    // Simplified flow: always ask for a name for a new deck from AI.
    // The 'deckValidation' for a brand new deck with only a commander isn't very meaningful.
    // The original logic had an alert asking if they want to name and save. We can go directly to naming.
     setAlertModalConfig({
        title: 'Initial Deck Setup',
        message: 'This new deck will only contain your selected commander. Provide a name to save it and start building.',
        onConfirm: () => {
          setIsAlertModalOpen(false);
          launchInputModalForNewDeck(); 
        },
        confirmText: 'Name and Save',
        showCancelButton: true,
        cancelText: 'Cancel',
        onCloseOverride: () => setIsAlertModalOpen(false)
      });
      setIsAlertModalOpen(true);
    // Old logic:
    // if (!deckValidation) { ... } else { launchInputModalForNewDeck(); }
    // launchInputModalForNewDeck(); // Simplified: always launch after confirmation
  };

  const handleBuildWithCommander = (commanderToBuild) => {
     const cardDataForDeck = {
        ...commanderToBuild,
        name: commanderToBuild.name,
        image_uris: commanderToBuild.image_uris || { art_crop: commanderToBuild.imageUrl },
        color_identity: commanderToBuild.colors,
        mana_cost: commanderToBuild.mana_cost,
        type_line: commanderToBuild.type_line,
        oracle_text: commanderToBuild.oracle_text,
        power: commanderToBuild.power,
        toughness: commanderToBuild.toughness,
        loyalty: commanderToBuild.loyalty,
        legalities: commanderToBuild.legalities,
        set_name: commanderToBuild.set_name,
        set: commanderToBuild.set,
        collector_number: commanderToBuild.collector_number,
        edhrec_rank: commanderToBuild.edhrec_rank,
    };
    setContextCommander(cardDataForDeck);
    if (clearDeckContents) {
      clearDeckContents();
    }
    setContextDeckName(commanderToBuild.name);
    navigate('/builder');
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
            <h1 className="text-5xl lg:text-6xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-4">
              <svg className="w-12 h-12 lg:w-16 lg:h-16 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" />
              </svg>
              <span>Commander AI</span>
            </h1>
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-500/20 to-blue-500/20 rounded-full px-6 py-3 border border-primary-500/30">
              <span className="text-primary-400 text-lg font-semibold">Find Your Perfect Leader</span>
            </div>
          </div>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Describe your preferred playstyle, colors, or mechanics, and let our AI suggest the perfect commanders for you!
          </p>
        </div>

        {/* Modals */}
        <AlertModal
          isOpen={isAlertModalOpen}
          title={alertModalConfig.title}
          message={alertModalConfig.message}
          onConfirm={() => {
              if (alertModalConfig.onConfirm) alertModalConfig.onConfirm();
              setIsAlertModalOpen(false);
          }}
          onClose={() => {
            if (alertModalConfig.onCloseOverride) {
                alertModalConfig.onCloseOverride();
            } else {
                setIsAlertModalOpen(false);
            }
          }}
          confirmText={alertModalConfig.confirmText}
          cancelText={alertModalConfig.cancelText || 'Cancel'}
          showCancelButton={alertModalConfig.showCancelButton}
          disabled={deckContextLoading}
        />

        <InputModal
          isOpen={isInputModalOpen}
          title={inputModalConfig.title}
          message={inputModalConfig.message}
          inputLabel={inputModalConfig.inputLabel}
          initialValue={inputModalConfig.initialValue}
          placeholder={inputModalConfig.placeholder}
          onConfirm={inputModalConfig.onConfirm}
          onClose={() => setIsInputModalOpen(false)}
          confirmText={inputModalConfig.confirmText}
          disabled={deckContextLoading}
        />

        {/* API Key Warning */}
        {!OPENAI_API_KEY && (
          <div className="glassmorphism-card p-6 border-red-500/30 bg-red-500/10">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-300">API Key Missing</h3>
                <p className="text-red-200">Your OpenAI API key (VITE_OPENAI_API_KEY) is not configured in your <code>.env</code> file. Please add it to enable AI suggestions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="glassmorphism-card p-8 lg:p-12 border-primary-500/20">
          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span>Describe Your Ideal Commander</span>
              </h2>

              <div className="space-y-2">
                <label htmlFor="preferences" className="block text-sm font-semibold text-white">
                  What are you looking for in a Commander?
                </label>
                <textarea
                  id="preferences"
                  name="preferences"
                  rows="6"
                  className="w-full p-4 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50 resize-y"
                  placeholder="Examples:
• I love drawing cards and controlling the board, maybe in Blue and White
• I want an aggressive Red commander that deals damage quickly
• Looking for a token-based strategy with Green and White
• Want a commander that cares about the graveyard or recursion
• Need something that synergizes with artifacts or enchantments"
                  value={preferences}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !preferences.trim() || !OPENAI_API_KEY}
              className="btn-modern btn-modern-primary btn-modern-xl w-full premium-glow group"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-3">
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Finding Perfect Commanders...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M9 16a5 5 0 116 0a3.5 3.5 0 00-1 3h-4a3.5 3.5 0 00-1-3" />
                    <path d="M9.7 17h4.6" />
                  </svg>
                  <span>Get AI Suggestions</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>
          </form>

          {/* Features List */}
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center space-x-2">
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                <path d="M9.5 2l.5 5l5 .5l-5 .5l-.5 5l-.5 -5l-5 -.5l5 -.5z" />
                <path d="M4 12l2 2l2 -2l-2 -2z" />
                <path d="M16 12l2 2l2 -2l-2 -2z" />
                <path d="M11 19l1 1l1 -1l-1 -1z" />
              </svg>
              <span>What You Get</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-300">Explore diverse commanders tailored to your playstyle preferences.</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-300">Gain insights into each commander's strategy and strengths.</span>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckIcon className="h-3 w-3 text-white" />
                </div>
                <span className="text-slate-300">View rich card details powered by Scryfall integration.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="glassmorphism-card p-12 text-center border-primary-500/30">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-2">AI Finding Your Commanders</h3>
            <p className="text-slate-400 text-lg">Analyzing preferences and fetching perfect matches...</p>
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
        {suggestions.length > 0 && !isLoading && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-3">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" />
                </svg>
                <span>Commander Suggestions</span>
              </h2>
              <p className="text-xl text-slate-400">
                Click on any commander to view detailed information
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {suggestions.map((commander, index) => {
                const gameChangerEffect = commander.game_changer 
                  ? 'ring-4 ring-yellow-400/90 shadow-lg shadow-yellow-400/50' 
                  : '';

                return (
                  <div 
                    key={`${commander.name}-${index}`}
                    className={`group relative glassmorphism-card p-0 overflow-hidden border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 hover:shadow-modern-primary ${gameChangerEffect} flex flex-col h-full`}
                    onClick={() => handleOpenModal(commander)}
                  >
                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden flex-shrink-0">
                      {commander.imageUrl ? (
                        <img 
                          src={commander.imageUrl} 
                          alt={`Art for ${commander.name}`} 
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
                      {commander.game_changer && (
                        <div className="absolute top-2 right-2">
                          <GameChangerTooltip className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg z-10" />
                        </div>
                      )}
                    </div>
                    
                    {/* Card Details */}
                    <div className="p-4 space-y-3 flex-1 flex flex-col min-h-0">
                      <div className="flex items-start justify-between flex-shrink-0">
                        <h3 className="text-sm font-bold text-white flex-1 pr-2 group-hover:text-primary-300 transition-colors leading-tight">
                          {commander.name}
                        </h3>
                        {/* Mana Cost Display */}
                        {commander.mana_cost && (
                          <div className="flex items-center space-x-0.5 flex-shrink-0">
                            {parseManaSymbols(commander.mana_cost)}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 flex-shrink-0">
                        {commander.type_line || commander.type}
                      </p>
                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 flex-grow overflow-hidden">
                        {commander.aiDescription || commander.description}
                      </p>
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
      </div>
    </div>
  );
};

export default CommanderAiPage; 