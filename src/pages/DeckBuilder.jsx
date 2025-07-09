import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CommanderSearch from '../components/search/CommanderSearch.jsx';
import SearchBar from '../components/search/SearchBar.jsx';
import SearchResults from '../components/search/SearchResults.jsx';
import DeckBuilderAI from '../components/deck/DeckBuilder.jsx';
import DeckStats from '../components/deck/DeckStats.jsx';
import DeckStatsIndex from '../components/deckstats/DeckStatsIndex.jsx';
import ValidationResults from '../components/deck/ValidationResults.jsx';
import DeckPlaybook from '../components/deck/DeckPlaybook.jsx';
// import SuggestionPanel from '../components/suggestions/SuggestionPanel.jsx';
// import AIChatbot from '../components/ai/AIChatbot.jsx';
import AutoDeckBuilder from '../components/ai/AutoDeckBuilder.jsx';
import StickyCommanderHeader from '../components/deck/StickyCommanderHeader.jsx';
import DeckImporter from '../components/deck/DeckImporter.jsx';
import useCardSearch from '../hooks/useCardSearch';
import { useDeck } from '../context/DeckContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { validateColorIdentity, validateFormatLegality, isDeckValid, useDeckValidation, validateDeck } from '../utils/deckValidator';
import { validateDeckWithAI } from '../services/deckValidationService.js';
import AlertModal from '../components/ui/AlertModal.jsx';
import InputModal from '../components/ui/InputModal.jsx';
import CardDetailModal from '../components/ui/CardDetailModal.jsx';
import { IconCrown } from '@tabler/icons-react';
import GameChangerTooltip from '../components/ui/GameChangerTooltip';
import { getTotalCardCount, getMainDeckCardCount } from '../utils/deckHelpers.js';

const DeckBuilderAIPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('deck'); // 'search', 'deck', 'stats', 'playbook'
  const [validationError, setValidationError] = useState(null);
  const [isCommanderSearchModalOpen, setIsCommanderSearchModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
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
    savedDecks,
    loading: deckContextLoading,
    error: deckContextError,
    clearDeck,
  } = useDeck();

  const deckViewRef = useRef(null); // Ref for scrolling

  // Card search hook for the general card search
  const cardSearch = useCardSearch({
    order: 'edhrec', // Default sort by popularity
  });

  // Memoize validation results
  const deckValidation = useDeckValidation(commander, cards);
  
  // Search query state (if needed for future search functionality)
  const [searchQuery, setSearchQuery] = useState('');

  // Clear deck context when DeckBuilder loads to prevent "sticky" behavior
  useEffect(() => {
    // Clear the deck context to start fresh each time
    clearDeck();
  }, []); // Run only once on mount

  // Handler to open the card detail modal
  const handleOpenCardDetailModal = (card) => {
    // Only open modal if card is fully loaded (not a fallback card)
    if (card && !card._isFallbackCard && card.isLoaded !== false) {
      setSelectedCardForDetailModal(card);
      setIsCardDetailModalOpen(true);
    } else {
      // Optionally show a brief message that the card is still loading
      console.log('Card is still loading, modal will not open:', card?.name);
    }
  };

  // Handler to close the card detail modal
  const handleCloseCardDetailModal = () => {
    setIsCardDetailModalOpen(false);
    setSelectedCardForDetailModal(null);
  };

  // Memoized card click handler
  const handleCardClick = useCallback((card) => {
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

    // Use memoized validation results
    const validationResult = deckValidation;
    if (!validationResult.isValid) {
      setValidationError({
        message: validationResult.message,
        card
      });
      return;
    }

    // Add the card to the deck
    addCard(card);
  }, [commander, deckValidation, addCard]);

  // Function to perform the actual save flow
  const performSaveFlow = useCallback(async (deckName) => {
    if (!commander || !currentUser) return;

    try {
      const success = await saveCurrentDeckToGHL(
        currentUser.id,
        commander.name, // GHL deck name field (required)
        deckName // Local deck name
      );

      if (success) {
        setAlertModalConfig({
          title: 'Deck Saved Successfully!',
          message: `Your deck "${deckName}" has been saved to the cloud and is now accessible from any device.`,
          showCancelButton: false,
        });
      } else {
        setAlertModalConfig({
          title: 'Save Failed',
          message: deckContextError || 'An error occurred while saving your deck. Please try again.',
          showCancelButton: false,
        });
      }
      setIsAlertModalOpen(true);
    } catch (error) {
      console.error('Error in performSaveFlow:', error);
      setAlertModalConfig({
        title: 'Save Failed',
        message: 'An unexpected error occurred while saving your deck. Please try again.',
        showCancelButton: false,
      });
      setIsAlertModalOpen(true);
    }
  }, [commander, currentUser, saveCurrentDeckToGHL, deckContextError]);

  // Function to launch input modal for deck name
  const launchInputModal = useCallback((forSave = false) => {
    setInputModalConfig({
      title: 'Save Deck to Cloud',
      message: 'Choose a name for your deck. This will be saved to your cloud account.',
      inputLabel: 'Deck Name',
      initialValue: currentDeckName || '',
      placeholder: 'Enter deck name...',
      onConfirm: async (deckName) => {
        if (deckName.trim()) {
          setIsInputModalOpen(false);
          await performSaveFlow(deckName.trim());
        }
      },
      confirmText: 'Save Deck',
    });
    setIsInputModalOpen(true);
  }, [currentDeckName, performSaveFlow]);

  // Enhanced handleSaveDeck with paywall integration
  const handleSaveDeck = useCallback(async (isFabClick = false) => {
    if (!commander) {
      setAlertModalConfig({
        title: 'No Commander',
        message: 'Please select a commander before saving your deck.',
        showCancelButton: false,
      });
      setIsAlertModalOpen(true);
      return;
    }

    try {
      // Step 1: Validate deck
      const validationResults = validateDeck(commander, cards);
      const hasValidationErrors = validationResults.some(result => !result.valid);
      
      if (hasValidationErrors) {
        const errorMessages = validationResults
          .filter(result => !result.valid)
          .map(result => result.message)
          .join('\n');
        
        setAlertModalConfig({
          title: 'Validation Error',
          message: errorMessages,
          showCancelButton: false,
        });
        setIsAlertModalOpen(true);
        return;
      }

      // Step 2: Check user and paywall status
      if (!currentUser || !currentUser.id) {
        setAlertModalConfig({
          title: 'Login Required to Save Deck',
          message: 'To save your deck to the cloud, please log in or create an account. Your progress will be preserved!',
          onConfirm: () => {
            setIsAlertModalOpen(false);
            navigate('/login', { state: { from: '/builder' } });
          },
          confirmText: 'Go to Login',
          showCancelButton: true,
          cancelText: 'Continue Building',
          onCloseOverride: () => setIsAlertModalOpen(false)
        });
        setIsAlertModalOpen(true);
        return;
      }

      // Step 3: Launch input modal or save directly
      if (isFabClick || !currentDeckName) { 
        launchInputModal(true); 
      } else {
        await performSaveFlow(currentDeckName);
      }
    } catch (error) {
      console.error('Error saving deck:', error);
      setAlertModalConfig({
        title: 'Error',
        message: 'Failed to save deck. Please try again.',
        showCancelButton: false,
      });
      setIsAlertModalOpen(true);
    }
  }, [commander, cards, currentUser, currentDeckName, savedDecks, navigate]);

  const openCommanderSearchModal = () => setIsCommanderSearchModalOpen(true);
  const closeCommanderSearchModal = () => setIsCommanderSearchModalOpen(false);

  // This function will be passed to the modal's onCommanderSelect prop
  const handleCommanderSelectionFromModal = (selectedCmdr) => {
    setCommander(selectedCmdr); // Update global commander state via useDeck
    // Modal closes itself upon selection (if card is not null)
  };

  // Handle import completion
  const handleImportComplete = (importedDeck) => {
    const { name, unresolvedCards, savedToCloud } = importedDeck;
    
    // Show results
    let message = `Successfully imported "${name}" with ${getTotalCardCount(importedDeck)} cards.`;
    if (unresolvedCards && unresolvedCards.length > 0) {
      message += ` ${unresolvedCards.length} cards could not be resolved and were skipped.`;
    }
    if (savedToCloud) {
      message += ' Deck saved to cloud!';
    }
    
    setAlertModalConfig({
      title: 'Import Complete',
      message,
      onConfirm: () => setIsAlertModalOpen(false),
      confirmText: 'OK',
      showCancelButton: false,
    });
    setIsAlertModalOpen(true);
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
      <div className="min-h-screen bg-slate-900">
        {/* Background effects */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-primary-600/6 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
                    {/* Header */}          <div className="text-center">            <div className="mb-8">              <img                 src="https://storage.googleapis.com/msgsndr/zKZ8Zy6VvGR1m7lNfRkY/media/6830e4ad6417b23718765500.png"                 alt="MTG Commander Deck Builder Logo"                 className="h-16 sm:h-20 mx-auto drop-shadow-2xl hover:scale-105 transition-transform duration-300 mb-6"              />            </div>            <h1 className="text-5xl font-bold text-gradient-primary mb-4">              <span className="flex items-center justify-center space-x-4">                <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>                  <path d="M11.414 10l-7.383 7.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l7.407 -7.385" />                  <path d="M18.121 15.293l2.586 -2.586a1 1 0 0 0 0 -1.414l-7.586 -7.586a1 1 0 0 0 -1.414 0l-2.586 2.586a1 1 0 0 0 0 1.414l7.586 7.586a1 1 0 0 0 1.414 0z" />                </svg>                <span>Deck Builder</span>              </span>            </h1>            <p className="text-xl text-slate-400">              Create and optimize your perfect Commander deck            </p>          </div>

          {/* Button to open Commander Search Modal - replaces inline search */}
          {!commander && (
            <div className="glassmorphism-card p-8 text-center border-primary-500/20">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>                    <path d="M12 6l4 6l5 -4l-2 10h-14l-2 -10l5 4z" />                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Choose Your Commander</h2>
                <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
                  Start by selecting your commander to unlock the full deck building experience.
                </p>
                <button 
                    onClick={openCommanderSearchModal}
                    className="btn-modern btn-modern-primary btn-modern-xl premium-glow group"
                >
                  <span className="flex items-center space-x-3">
                    <span>🎯 Select Commander</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </div>
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

          {/* Deck Import Modal */}
          {isImportModalOpen && (
            <DeckImporter
              onImportComplete={handleImportComplete}
              onClose={() => setIsImportModalOpen(false)}
            />
          )}

          {commander ? (
            <>
              {/* Deck Info Header - Title, Card Count, and Action Buttons */}
              <div className="glassmorphism-card p-6 border-primary-500/20 mb-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-gradient-primary mb-2">
                      {currentDeckName || 'Untitled Deck'}
                    </h2>
                    <p className="text-slate-400 text-lg">
                      {getTotalCardCount({ commander, cards })} cards • Commander: {commander?.name || 'None'}
                    </p>
                  </div>
                  
                  {/* Action Buttons - Top Right */}
                  <div className="flex-shrink-0 ml-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={openCommanderSearchModal} 
                        className="btn-modern btn-modern-secondary btn-modern-md group"
                >
                  <span className="flex items-center space-x-2">
                    <IconCrown size={16} />
                    <span>Change Commander</span>
                  </span>
                </button>
                      
                      <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="btn-modern btn-modern-secondary btn-modern-md"
                      >
                        <span className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                          </svg>
                          <span>Import</span>
                        </span>
                      </button>
                      
                      <button
                        onClick={() => handleSaveDeck(false)}
                        disabled={deckContextLoading || !commander}
                        className="btn-modern btn-modern-primary btn-modern-md disabled:opacity-50 disabled:cursor-not-allowed premium-glow"
                      >
                        {deckContextLoading ? (
                          <span className="flex items-center space-x-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Saving...</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Save</span>
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Deck Name Input - Below header */}
                <div className="mt-4">
                  <div className="relative max-w-md">
                    <input
                      type="text"
                      value={currentDeckName}
                      onChange={(e) => setDeckName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300 hover:border-slate-500/50"
                      placeholder="Enter deck name..."
                      disabled={deckContextLoading}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* AI Features Section - Now includes Auto Deck Builder */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Auto Deck Builder - Added prominently */} 
                <div className="lg:col-span-8 lg:col-start-3 flex flex-col">
                  <AutoDeckBuilder />
                </div>
              </div>
              
              {/* Main Tabs and Content */}
              <div className="glassmorphism-card border-slate-700/50">
                {/* Tab Navigation */}
                <div className="border-b border-slate-700/50">
                  <nav className="flex space-x-8 px-8">
                    {/* View Deck Tab */}
                    <button
                      onClick={() => setActiveTab('deck')}
                      className={`py-4 px-1 font-semibold text-sm transition-all duration-300 border-b-2 ${
                        activeTab === 'deck'
                          ? 'border-primary-500 text-primary-400'
                          : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>View Deck ({getTotalCardCount({ commander, cards })})</span>
                      </div>
                    </button>

                    {/* Deck Stats Tab */}
                    <button
                      onClick={() => setActiveTab('stats')}
                      className={`py-4 px-1 font-semibold text-sm transition-all duration-300 border-b-2 ${
                        activeTab === 'stats'
                          ? 'border-primary-500 text-primary-400'
                          : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span>Deck Stats</span>
                      </div>
                    </button>

                    {/* Playbook Tab */}
                    <button
                      onClick={() => setActiveTab('playbook')}
                      className={`py-4 px-1 font-semibold text-sm transition-all duration-300 border-b-2 ${
                        activeTab === 'playbook'
                          ? 'border-primary-500 text-primary-400'
                          : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Playbook</span>
                      </div>
                    </button>
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === 'deck' && (
                      <DeckBuilderAI 
                        deckSaveControls={null} 
                        onViewCardDetails={handleOpenCardDetailModal}
                      />
                  )}
                  
                  {activeTab === 'stats' && (
                    <div className="space-y-6">
                      <DeckStats />
                      <DeckStatsIndex />
                      <ValidationResults setActiveTab={setActiveTab} />
                    </div>
                  )}

                  {activeTab === 'playbook' && (
                    <DeckPlaybook />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="glassmorphism-card p-12 text-center border-slate-700/50">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Build?</h2>
                <p className="text-slate-400 text-lg leading-relaxed">
                  Select your commander above to begin building your deck and unlock all the powerful tools and features.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default DeckBuilderAIPage; 