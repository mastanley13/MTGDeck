import React, { useState, useEffect } from 'react';
import CardDetailModal from '../components/ui/CardDetailModal';
import AlertModal from '../components/ui/AlertModal.jsx';
import InputModal from '../components/ui/InputModal.jsx';
import { useNavigate } from 'react-router-dom';
import { useDeck } from '../context/DeckContext';
import { useAuth } from '../context/AuthContext.jsx';
import { isDeckValid } from '../utils/deckValidator.js';

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
          model: 'gpt-3.5-turbo',
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
              return {
                ...scryfallData,
                aiDescription: aiSuggestion.description,
                colors: aiSuggestion.colors,
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
    <div className="min-h-screen bg-stone-700 py-12 px-4 text-slate-200 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto bg-slate-700 border-2 border-logoScheme-gold rounded-xl p-6 md:p-8 shadow-2xl">
        
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-3xl font-bold text-logoScheme-gold">
            Commander A.I.
          </h1>
          {/* Optional: Up arrow icon - keeping it simple for now */}
        </div>

        <div className="text-center mb-6">
          <span className="bg-logoScheme-gold text-slate-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
            Find Your Perfect Leader
          </span>
        </div>
      
        <p className="text-slate-300 text-center mb-8">
          Describe your preferred playstyle, colors, or mechanics, and let the AI suggest some commanders for you!
        </p>
      
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

        {!OPENAI_API_KEY && (
          <div className="max-w-xl mx-auto bg-red-900 bg-opacity-50 border-l-4 border-logoScheme-red text-red-300 p-4 mb-6 rounded-md shadow-md" role="alert">
            <p className="font-bold">API Key Missing</p>
            <p>Your OpenAI API key (VITE_OPENAI_API_KEY) is not configured in your <code>.env</code> file. Please add it to enable AI suggestions.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mb-10">
          <div className="mb-6">
            <label htmlFor="preferences" className="block text-sm font-medium text-slate-200 mb-2">
              What are you looking for in a Commander?
            </label>
            <textarea
              id="preferences"
              name="preferences"
              rows="4"
              className="w-full p-3 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-logoScheme-gold focus:border-logoScheme-gold transition duration-150 ease-in-out bg-slate-800 text-slate-100 placeholder-slate-400"
              placeholder="e.g., I love drawing cards and controlling the board, maybe in Blue and White. Or, I want an aggressive Red commander that deals a lot of damage quickly."
              value={preferences}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !preferences.trim() || !OPENAI_API_KEY}
            className="w-full bg-logoScheme-gold hover:bg-yellow-500 text-slate-800 font-bold py-3 px-4 rounded-lg shadow-md disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:ring-offset-2 focus:ring-offset-slate-700"
          >
            {isLoading ? 'Thinking...' : 'Get Suggestions'}
          </button>
        </form>

        <div className="space-y-3 text-slate-300 mb-10 text-sm">
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-logoScheme-gold mr-2 mt-0.5 flex-shrink-0" />
            <span>Explore diverse commanders tailored to your playstyle preferences.</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-logoScheme-gold mr-2 mt-0.5 flex-shrink-0" />
            <span>Gain insights into each commander's strategy and strengths.</span>
          </div>
          <div className="flex items-start">
            <CheckIcon className="h-5 w-5 text-logoScheme-gold mr-2 mt-0.5 flex-shrink-0" />
            <span>View rich card details powered by Scryfall integration.</span>
          </div>
        </div>
        

        {isLoading && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-logoScheme-gold mx-auto"></div>
            <p className="mt-4 text-slate-300">Finding commanders and images for you...</p>
          </div>
        )}

        {error && (
          <div className="max-w-xl mx-auto bg-red-900 bg-opacity-50 border border-logoScheme-red text-red-300 px-4 py-3 rounded-xl relative mb-6 shadow-md" role="alert">
            <strong className="font-bold">Oops! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {suggestions.length > 0 && !isLoading && (
          <div>
            <h2 className="text-2xl font-semibold text-center mb-8 text-logoScheme-gold">Commander Suggestions:</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {suggestions.map((commander, index) => (
                <div 
                  key={`${commander.name}-${index}`}
                  className="bg-slate-800 border border-slate-600 rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer flex flex-col"
                  onClick={() => handleOpenModal(commander)}
                >
                  {commander.imageUrl ? (
                    <img src={commander.imageUrl} alt={`Art for ${commander.name}`} className="w-full h-60 object-cover object-top" />
                  ) : (
                    <div className="w-full h-60 bg-slate-700 flex items-center justify-center text-slate-400 relative">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="absolute text-xs bottom-2 left-2 p-1 bg-slate-800 bg-opacity-70 text-slate-200 rounded">Image not found</span>
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-logoScheme-gold mb-2 min-h-[3em]">{commander.name}</h3>
                    <p className="text-sm text-slate-400 mb-2">Colors: {Array.isArray(commander.colors) ? commander.colors.join(', ') : 'N/A'}</p>
                    <p className="text-xs text-slate-300 leading-relaxed flex-grow h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-500 scrollbar-track-slate-700 mb-3">{commander.aiDescription || commander.description}</p>
                    <div className="mt-auto pt-3 border-t border-slate-700 flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveNewDeckFromAI(commander);
                        }}
                        className="w-full sm:w-auto flex-grow text-sm bg-logoScheme-blue hover:bg-blue-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-logoScheme-blue focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={deckContextLoading || !isAuthenticated}
                      >
                        {deckContextLoading ? 'Saving...' : 'Save as New Deck'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                              setAlertModalConfig({
                                  title: 'Login Required',
                                  message: 'Please log in to build a new deck. You will be redirected to the login page.',
                                  onConfirm: () => navigate('/login', { state: { from: '/builder' } }),
                                  confirmText: 'Go to Login',
                                  showCancelButton: true,
                              });
                              setIsAlertModalOpen(true);
                          } else {
                              handleBuildWithCommander(commander);
                          }
                        }}
                        className="w-full sm:w-auto flex-grow text-sm bg-logoScheme-green hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-logoScheme-green focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!OPENAI_API_KEY || isLoading }
                      >
                        Build Deck
                      </button>
                    </div>
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

export default CommanderAiPage; 