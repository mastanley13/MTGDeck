import React, { useState, useEffect, useRef } from 'react';
import CommanderSearch from '../components/search/CommanderSearch.jsx';
import SearchBar from '../components/search/SearchBar.jsx';
import SearchResults from '../components/search/SearchResults.jsx';
import DeckBuilder from '../components/deck/DeckBuilder.jsx';
import DeckStats from '../components/deck/DeckStats.jsx';
import ValidationResults from '../components/deck/ValidationResults.jsx';
// import SuggestionPanel from '../components/suggestions/SuggestionPanel.jsx';
// import AIChatbot from '../components/ai/AIChatbot.jsx';
import AutoDeckBuilder from '../components/ai/AutoDeckBuilder.jsx';
import StickyCommanderHeader from '../components/deck/StickyCommanderHeader.jsx';
import useCardSearch from '../hooks/useCardSearch';
import { useDeck } from '../context/DeckContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { validateColorIdentity, validateFormatLegality, isDeckValid } from '../utils/deckValidator';
import AlertModal from '../components/ui/AlertModal.jsx';
import InputModal from '../components/ui/InputModal.jsx';
import CardDetailModal from '../components/ui/CardDetailModal.jsx';

const DeckBuilderPage = () => {
  const [activeTab, setActiveTab] = useState('deck'); // 'search', 'deck', 'stats'
  const [validationError, setValidationError] = useState(null);
  const [isCommanderSearchModalOpen, setIsCommanderSearchModalOpen] = useState(false);
  
  // State for the AlertModal
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK',
    showCancelButton: false,
  });

  // State for the InputModal
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

  // State for CardDetailModal
  const [isCardDetailModalOpen, setIsCardDetailModalOpen] = useState(false);
  const [selectedCardForDetailModal, setSelectedCardForDetailModal] = useState(null);

  const { currentUser } = useAuth();

  const {
    commander,
    cards,
    totalCardCount,
    setCommander,
    addCard,
    currentDeckName,
    setDeckName,
    saveCurrentDeckToGHL,
    loading: deckContextLoading,
    error: deckContextError,
  } = useDeck();

  const deckViewRef = useRef(null); // Ref for scrolling

  // Card search hook for the general card search
  const cardSearch = useCardSearch({
    order: 'edhrec', // Default sort by popularity
  });

  // Handler to open the card detail modal
  const handleOpenCardDetailModal = (card) => {
    setSelectedCardForDetailModal(card);
    setIsCardDetailModalOpen(true);
  };

  // Handler to close the card detail modal
  const handleCloseCardDetailModal = () => {
    setIsCardDetailModalOpen(false);
    setSelectedCardForDetailModal(null);
  };

  // Handle clicking a card in the search results
  const handleCardClick = (card) => {
    // Clear previous validation errors
    setValidationError(null);

    // Check if we have a commander (required for adding cards)
    if (!commander) {
      setValidationError({
        message: 'Please select a commander first!',
        card
      });
      return;
    }

    // Verify color identity compliance
    const colorIdentityCheck = isColorIdentityCompliant(card);
    if (!colorIdentityCheck.isCompliant) {
      setValidationError({
        message: colorIdentityCheck.message,
        card
      });
      return;
    }

    // Verify format legality
    const formatLegalityCheck = isFormatLegal(card);
    if (!formatLegalityCheck.isLegal) {
      setValidationError({
        message: formatLegalityCheck.message,
        card
      });
      return;
    }

    // Add the card to the deck
    addCard(card);
  };

  // Helper function to check color identity compliance
  const isColorIdentityCompliant = (card) => {
    if (!commander || !card) {
      return { 
        isCompliant: false,
        message: 'No commander selected.' 
      };
    }

    // Extract commander's color identity
    const commanderColors = commander.color_identity || [];
    
    // Extract card's color identity
    const cardColors = card.color_identity || [];
    
    // For each color in the card, check if it's in the commander's color identity
    const isCompliant = cardColors.every(color => commanderColors.includes(color));
    
    return {
      isCompliant,
      message: isCompliant 
        ? 'Color identity compliant.' 
        : `Card's color identity (${cardColors.join('')}) is not allowed in ${commander.name}'s color identity (${commanderColors.join('')}).`
    };
  };

  // Helper function to check format legality
  const isFormatLegal = (card) => {
    if (!card || !card.legalities) {
      return { 
        isLegal: false,
        message: 'Unable to verify card legality.' 
      };
    }

    const isLegal = card.legalities.commander === 'legal';
    
    return {
      isLegal,
      message: isLegal 
        ? 'Card is legal in Commander format.' 
        : `${card.name} is not legal in Commander format.`
    };
  };

  // Refined handleSaveDeck
  const handleSaveDeck = async (isFabClick = false) => {
    if (!commander) {
        setAlertModalConfig({
            title: 'No Commander',
            message: 'Please select a commander before saving your deck.',
            showCancelButton: false,
        });
        setIsAlertModalOpen(true);
        return;
    }
    if (!currentUser || !currentUser.id) {
        setAlertModalConfig({
            title: 'User Not Found',
            message: 'Could not identify user. Please ensure you are logged in to save to the cloud.',
            showCancelButton: false,
        });
        setIsAlertModalOpen(true);
        return;
    }

    const deckValidation = isDeckValid(commander, cards);

    const performSaveFlow = async (deckNameToSaveLocally) => {
      if (!deckNameToSaveLocally || deckNameToSaveLocally.trim() === '') {
        setAlertModalConfig({
          title: 'Missing Name',
          message: 'Please enter a valid deck name for your local records.',
          showCancelButton: false,
        });
        setIsAlertModalOpen(true);
        return;
      }

      // Call the GHL save function
      // commander.name will be the name stored in the GHL 'Decks' field
      // deckNameToSaveLocally will be stored in localStorage and within the GHL JSON payload
      const success = await saveCurrentDeckToGHL(currentUser.id, commander.name, deckNameToSaveLocally.trim());

      if (success) {
        setAlertModalConfig({
          title: 'Deck Saved!',
          message: `Deck "${deckNameToSaveLocally.trim()}" (Commander: ${commander.name}) saved to cloud and locally!`,
          showCancelButton: false,
        });
        setIsAlertModalOpen(true);
        // Ensure local deck name state is updated if it was prompted or different
        if (deckNameToSaveLocally.trim() !== currentDeckName) {
            setDeckName(deckNameToSaveLocally.trim());
        }
      } else {
        // Error is handled by DeckContext and will be in deckContextError
        // Displaying the error from context
        setAlertModalConfig({
          title: 'Save Failed',
          message: deckContextError || 'An unknown error occurred while saving the deck. Please try again.',
          showCancelButton: false,
        });
        setIsAlertModalOpen(true);
      }
    };

    const launchInputModal = (forcePrompt = false) => {
      setInputModalConfig({
        title: 'Enter Deck Name for Local Save',
        message: forcePrompt ? 'Please provide a name for your deck to save it (this name is for your local records).': 'Enter a name for your deck (for local records):',
        inputLabel: 'Local Deck Name',
        initialValue: currentDeckName.trim() || commander.name, // Default to commander name if currentDeckName is empty
        placeholder: 'e.g., My Awesome Deck',
        onConfirm: async (inputValue) => { // Make onConfirm async
          setIsInputModalOpen(false);
          await performSaveFlow(inputValue); // await the save flow
        },
        confirmText: 'Confirm & Save',
      });
      setIsInputModalOpen(true);
    };

    if (!deckValidation) { // isDeckValid returns a boolean, so check if false
      setAlertModalConfig({
        title: 'Validation Issues',
        message: 'Your deck has validation issues. Do you still want to save it? Click "Save Anyway" to name and save, or "Review Issues" to check them first.',
        onConfirm: () => {
          setIsAlertModalOpen(false);
          launchInputModal(true); 
        },
        confirmText: 'Save Anyway',
        showCancelButton: true,
        cancelText: 'Review Issues',
        onCloseOverride: () => { 
            setIsAlertModalOpen(false);
            setActiveTab('stats');
        }
      });
      setIsAlertModalOpen(true);
      return;
    }

    // If deck is valid
    let deckNameToSaveLocally = currentDeckName.trim();
    if (isFabClick || !deckNameToSaveLocally) { 
      launchInputModal(true); 
    } else {
      await performSaveFlow(deckNameToSaveLocally); // await the save flow
    }
  };

  const openCommanderSearchModal = () => setIsCommanderSearchModalOpen(true);
  const closeCommanderSearchModal = () => setIsCommanderSearchModalOpen(false);

  // This function will be passed to the modal's onCommanderSelect prop
  const handleCommanderSelectionFromModal = (selectedCmdr) => {
    setCommander(selectedCmdr); // Update global commander state via useDeck
    // Modal closes itself upon selection (if card is not null)
  };

  useEffect(() => {
    // If no commander is selected, and the modal isn't already open, open it.
    // This ensures new users are prompted to select a commander.
    if (!commander && !isCommanderSearchModalOpen) {
      // Check if this is the initial load or commander was deliberately cleared.
      // For now, let's assume we want to open it if no commander.
      // A more sophisticated approach might use a flag for initial visit.
      // setIsCommanderSearchModalOpen(true); // Potentially too aggressive, user might want to see page first.
      // Let's rely on the explicit button for now.
    }
  }, [commander, isCommanderSearchModalOpen]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto px-4 py-8 text-gray-300">
        {/* Button to open Commander Search Modal - replaces inline search */}
        {!commander && (
          <div className="w-full mb-6 text-center p-8 bg-logoScheme-darkGray rounded-lg shadow border border-logoScheme-brown">
            <h2 className="text-xl font-bold mb-2 text-logoScheme-gold">No Commander Selected</h2>
            <p className="text-gray-300 mb-4">
                Start by selecting your commander to build your deck.
            </p>
            <button 
                onClick={openCommanderSearchModal}
                className="btn-primary px-6 py-3"
            >
                Select Commander
            </button>
          </div>
        )}
        
        {/* Sticky Commander Header - Appears once commander is selected */}
        {commander && <StickyCommanderHeader commander={commander} />}

        {/* CommanderSearch Modal Component */}
        <CommanderSearch 
            isOpen={isCommanderSearchModalOpen}
            onClose={closeCommanderSearchModal}
            onCommanderSelect={handleCommanderSelectionFromModal}
            selectedCommander={commander} // Pass current commander for display if modal is reopened
        />

        {/* Alert Modal for custom notifications */}
        <AlertModal
          isOpen={isAlertModalOpen}
          title={alertModalConfig.title}
          message={alertModalConfig.message}
          onConfirm={alertModalConfig.onConfirm}
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
        />

        {/* Input Modal for deck name */}
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
        />

        {/* Render CardDetailModal */}
        {isCardDetailModalOpen && selectedCardForDetailModal && (
          <CardDetailModal 
            card={selectedCardForDetailModal} 
            onClose={handleCloseCardDetailModal} 
          />
        )}

        {commander ? (
          <>
            {/* Deck Info Header - Title, Card Count, and potentially Change Commander button */}
            <div className="flex justify-center items-center mb-8 pt-6">

              <button 
                onClick={openCommanderSearchModal} 
                className="btn-secondary px-5 py-2.5"
              >
                Change Commander
              </button>
            </div>
            
            {/* AI Features Section - Now includes Auto Deck Builder */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
              {/* Auto Deck Builder - Added prominently */} 
              <div className="lg:col-span-6 lg:col-start-4 flex flex-col">
                <AutoDeckBuilder />
              </div>
              
              {/* AI Card Suggestions */}
              {/*
              <div className="lg:col-span-5">
                <SuggestionPanel />
              </div>
              */}
              
              {/* AI Chatbot */}
              {/*
              <div className="lg:col-span-3">
                <AIChatbot />
              </div>
              */}
            </div>
            
            {/* Main Tabs and Content */}
            <div className="border-b border-logoScheme-brown mb-4" ref={deckViewRef}>
              <nav className="flex -mb-px justify-around md:justify-start">
                {/* View Deck Tab */}
                <button
                  onClick={() => setActiveTab('deck')}
                  className={`pb-2 pt-1 px-2 md:px-4 md:py-2 font-medium text-xs md:text-sm focus:outline-none transition-colors duration-150 ${
                    activeTab === 'deck'
                      ? 'border-b-2 border-logoScheme-gold text-logoScheme-gold active:bg-logoScheme-brown'
                      : 'text-gray-400 hover:text-logoScheme-gold hover:border-yellow-400 active:bg-logoScheme-brown'
                  }`}
                >
                  <div className="md:hidden flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M5 11v6m14-6v6" />
                    </svg>
                    <span>View Deck</span>
                  </div>
                  <span className="hidden md:inline">View Deck ({totalCardCount})</span>
                </button>

                {/* Deck Stats Tab */}
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`pb-2 pt-1 px-2 md:px-4 md:py-2 font-medium text-xs md:text-sm focus:outline-none transition-colors duration-150 ${
                    activeTab === 'stats'
                      ? 'border-b-2 border-logoScheme-gold text-logoScheme-gold active:bg-logoScheme-brown'
                      : 'text-gray-400 hover:text-logoScheme-gold hover:border-yellow-400 active:bg-logoScheme-brown'
                  }`}
                >
                  <div className="md:hidden flex flex-col items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Deck Stats</span>
                  </div>
                  <span className="hidden md:inline">Deck Stats</span>
                </button>
              </nav>
            </div>
            
            {/* Tab Content */}
            <div className="w-full">
              {activeTab === 'deck' && (
                <>
                  {/* Save Controls - Now inside Deck tab and responsive */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-3 mb-6 p-1">
                    <input
                      type="text"
                      value={currentDeckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="flex-grow px-4 py-3 rounded-lg text-sm bg-gray-700 border border-gray-500 text-gray-100 focus:outline-none focus:ring-2 focus:ring-logoScheme-gold focus:border-logoScheme-gold placeholder-gray-400 shadow-sm w-full sm:w-auto"
                      placeholder="Enter Local Deck Name (e.g., Eris Roars)"
                      disabled={deckContextLoading} // Disable input while saving
                    />
                    <button
                      onClick={() => handleSaveDeck(false)}
                      disabled={deckContextLoading || !commander} // Disable if loading or no commander
                      className="btn-primary px-6 py-3 w-full sm:w-auto whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deckContextLoading ? 'Saving...' : 'Save Deck to Cloud'}
                    </button>
                  </div>
                  <DeckBuilder 
                    deckSaveControls={null} 
                    onViewCardDetails={handleOpenCardDetailModal}
                  />
                </>
              )}
              
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <DeckStats />
                  <ValidationResults setActiveTab={setActiveTab} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-8 bg-logoScheme-darkGray rounded-lg shadow mt-6 border border-logoScheme-brown">
            <h2 className="text-xl font-bold mb-2 text-logoScheme-gold">Start by Selecting a Commander</h2>
            <p className="text-gray-300">
              Use the commander search above to select your commander and begin building your deck.
            </p>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default DeckBuilderPage; 