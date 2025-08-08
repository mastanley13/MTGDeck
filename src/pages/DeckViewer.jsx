import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Seo } from '../components/Seo.tsx';
import { useDeck } from '../context/DeckContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getCardImageUris } from '../utils/scryfallAPI';
import DeckAnalytics from '../components/deck/DeckAnalytics';
import DeckExporter from '../components/deck/DeckExporter';
import DeckShare from '../components/deck/DeckShare';
import CardDetailModal from '../components/ui/CardDetailModal.jsx';
import GameChangerTooltip from '../components/ui/GameChangerTooltip';
import DeckImporter from '../components/deck/DeckImporter.jsx';
import AlertModal from '../components/ui/AlertModal.jsx';
import CardQuantityControls from '../components/deck/edit/CardQuantityControls.jsx';
import CardSearchPanel from '../components/deck/edit/CardSearchPanel.jsx';
import UnsavedChangesWarning from '../components/deck/edit/UnsavedChangesWarning.jsx';
import DeckActionButtons from '../components/ui/DeckActionButtons.jsx';
import CardLoadingPlaceholder from '../components/ui/ProgressiveCardLoader.jsx';

import { getTotalCardCount, getMainDeckCardCount, validateDeckStructure } from '../utils/deckHelpers.js';

const DeckViewer = () => {
  const { deckId } = useParams();
  const { 
    savedDecks, 
    loadDeck, 
    fetchAndSetUserDecks, 
    loading: deckLoading, 
    error: deckError, 
    deleteDeckFromGHL, 
    cardsByType, 
    updateCardCategory, 
    getCardType,
    updateCardQuantity,
    removeCard,
    saveCurrentDeckToGHL,
    currentDeckName,
    setDeckName,
    cards,
    commander,
    cardCategories
  } = useDeck();
  const { currentUser, loadingAuth } = useAuth();
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [activeTab, setActiveTab] = useState('cards');
  const [hasFetchedDecks, setHasFetchedDecks] = useState(false);
  const [isCardDetailModalOpen, setIsCardDetailModalOpen] = useState(false);
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModalConfig, setAlertModalConfig] = useState({
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'OK',
    showCancelButton: false,
  });
  const [isShowingCategoryView, setIsShowingCategoryView] = useState(true);
  const [isLoadingSpecificDeck, setIsLoadingSpecificDeck] = useState(false);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCards, setSelectedCards] = useState(new Set());
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingAuth && currentUser && currentUser.id && !hasFetchedDecks) {
      console.log('DeckViewer: Current user found, fetching decks for contact ID:', currentUser.id);
      setIsLoadingSpecificDeck(true);
      fetchAndSetUserDecks(currentUser.id)
        .then(() => {
          setHasFetchedDecks(true);
          // Only set loading to false if we're not looking for a specific deck
          if (!deckId) {
            setIsLoadingSpecificDeck(false);
          }
        })
        .catch((error) => {
          console.error('Error fetching decks:', error);
          setIsLoadingSpecificDeck(false);
          setHasFetchedDecks(true);
        });
    }
  }, [currentUser, loadingAuth, fetchAndSetUserDecks, deckId, hasFetchedDecks]);

  useEffect(() => {
    if (!currentUser) {
      setHasFetchedDecks(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (deckId) {
      setIsLoadingSpecificDeck(true);
      
      if (savedDecks && savedDecks.length > 0) {
        const deck = savedDecks.find(d => d.id === deckId);
        if (deck) {
          // Validate and fix deck structure before setting
          const validatedDeck = validateDeckStructure(deck);
          setSelectedDeck(validatedDeck);
          loadDeck(validatedDeck);
          setIsLoadingSpecificDeck(false);
        }
      }
      
      // Always set a timeout to ensure loading state persists
      const timer = setTimeout(() => {
        if (!savedDecks?.find(d => d.id === deckId)) {
          setIsLoadingSpecificDeck(false);
        }
      }, 5000); // Increased to 5 seconds to give more time for loading
      
      return () => clearTimeout(timer);
    } else {
      setIsLoadingSpecificDeck(false);
      setSelectedDeck(null);
    }
  }, [deckId, savedDecks]); // Removed loadDeck from dependencies to prevent infinite loop

  const handleOpenCardDetailModal = (card) => {
    // Only open modal if card is fully loaded (not a fallback card)
    if (card && !card._isFallbackCard && card.isLoaded !== false) {
      setSelectedCardForModal(card);
      setIsCardDetailModalOpen(true);
    } else {
      // Optionally show a brief message that the card is still loading
      console.log('Card is still loading, modal will not open:', card?.name);
    }
  };

  const handleCloseCardDetailModal = () => {
    setIsCardDetailModalOpen(false);
    setSelectedCardForModal(null);
  };

  // Edit mode handlers
  const handleToggleEditMode = () => {
    console.log('DeckViewer: handleToggleEditMode called, current isEditMode:', isEditMode);
    
    if (isEditMode) {
      // Exiting edit mode - check for unsaved changes
      if (hasUnsavedChanges) {
        console.log('DeckViewer: Exiting edit mode with unsaved changes, asking for confirmation');
        const confirmed = window.confirm(
          'You have unsaved changes. Are you sure you want to exit edit mode? Your changes will be lost.'
        );
        if (!confirmed) {
          console.log('DeckViewer: User cancelled exit edit mode');
          return;
        }
        
        // Reload the deck from saved state to discard changes
        if (selectedDeck) {
          console.log('DeckViewer: Reloading deck to discard changes');
          loadDeck(selectedDeck);
        }
      }
      
      console.log('DeckViewer: Exiting edit mode');
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setSelectedCards(new Set());
    } else {
      // Entering edit mode
      console.log('DeckViewer: Entering edit mode');
      setIsEditMode(true);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedDeck || !currentUser) {
      console.warn('DeckViewer: Cannot save - missing selectedDeck or currentUser', { selectedDeck: !!selectedDeck, currentUser: !!currentUser });
      return;
    }
    
    console.log('DeckViewer: handleSaveChanges called');
    setIsSaving(true);
    try {
      console.log('💾 Saving deck changes:', {
        deckId: selectedDeck.id,
        commanderName: commander?.name,
        cardsCount: cards?.length || 0,
        deckName: currentDeckName || selectedDeck.name
      });
      
      // Pass the current context state (edited cards/commander) instead of selectedDeck
      const currentDeckState = {
        id: selectedDeck.id, // Keep the original ID
        commander: commander, // Use current commander from context
        cards: cards, // Use current cards from context
        cardCategories: cardCategories, // Use current card categories from context
        description: selectedDeck.description || ''
      };
      
      const success = await saveCurrentDeckToGHL(
        currentUser.id,
        commander?.name || selectedDeck.commander?.name || 'Unknown',
        currentDeckName || selectedDeck.name,
        currentDeckState
      );
      
      if (success) {
        setHasUnsavedChanges(false);
        setIsEditMode(false); // Exit edit mode after successful save
        setSelectedCards(new Set()); // Clear selected cards
        console.log('✅ Deck saved successfully to GHL');
        
        // Refresh the deck list to show updated data
        if (currentUser?.id) {
          await fetchAndSetUserDecks(currentUser.id);
        }
      }
    } catch (error) {
      console.error('❌ Error saving deck:', error);
      // Optionally show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    console.log('DeckViewer: handleDiscardChanges called');
    const confirmed = window.confirm('Are you sure you want to discard all unsaved changes?');
    if (confirmed) {
      // Reload the deck from saved state
      if (selectedDeck) {
        console.log('DeckViewer: Reloading deck from saved state');
        loadDeck(selectedDeck);
      }
      setHasUnsavedChanges(false);
      setIsEditMode(false); // Exit edit mode after discarding changes
      setSelectedCards(new Set());
    }
  };

  const handleCardQuantityUpdate = (cardId, newQuantity) => {
    console.log('Updating card quantity:', cardId, newQuantity);
    updateCardQuantity(cardId, newQuantity);
    setHasUnsavedChanges(true);
  };

  const handleCardRemove = (cardId) => {
    console.log('Removing card:', cardId);
    removeCard(cardId);
    setHasUnsavedChanges(true);
    
    // Remove from selection if selected
    setSelectedCards(prev => {
      const updated = new Set(prev);
      updated.delete(cardId);
      return updated;
    });
  };

  const handleCardAdd = (card) => {
    console.log('Adding card:', card.name);
    setHasUnsavedChanges(true);
  };

  const handleDeleteDeck = async () => {
    console.log('DeckViewer: handleDeleteDeck called');
    if (!selectedDeck) {
      console.warn('DeckViewer: Cannot delete - no selectedDeck');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the deck "${selectedDeck.name}"? This action cannot be undone.`)) return;
    
    console.log('DeckViewer: Deleting deck:', selectedDeck.id);
    const result = await deleteDeckFromGHL(selectedDeck.id, currentUser?.id);
    if (result.success) {
      console.log('DeckViewer: Deck deleted successfully');
      alert('Deck deleted successfully.');
      navigate('/decks');
    } else {
      console.error('DeckViewer: Failed to delete deck:', result.error);
      alert('Failed to delete deck: ' + (result.error || 'Unknown error'));
    }
  };

  // Handle import completion
  const handleImportComplete = (importedDeck) => {
    const { name, unresolvedCards, savedToCloud } = importedDeck;
    
    // Validate deck structure to ensure proper card counting
    const validatedDeck = validateDeckStructure(importedDeck);
    
    // Show results
    let message = `Successfully imported "${name}" with ${getTotalCardCount(validatedDeck)} cards.`;
    if (unresolvedCards && unresolvedCards.length > 0) {
      message += ` ${unresolvedCards.length} cards could not be resolved and were skipped.`;
    }
    if (savedToCloud) {
      message += ' Deck saved to cloud!';
    }
    
    setAlertModalConfig({
      title: 'Import Complete',
      message,
      onConfirm: () => {
        setIsAlertModalOpen(false);
        // Refresh the deck list to show the new imported deck
        if (currentUser && currentUser.id) {
          fetchAndSetUserDecks(currentUser.id);
        }
      },
      confirmText: 'OK',
      showCancelButton: false,
    });
    setIsAlertModalOpen(true);
  };

  if (loadingAuth || deckLoading || (deckId && (isLoadingSpecificDeck || !hasFetchedDecks))) {
    return (
      <div className="min-h-screen bg-slate-900">
        {/* Add background effects div */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glassmorphism-card p-12 text-center">
            <div className="animate-spin h-16 w-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {deckId ? 'Loading Deck' : 'Loading Your Decks'}
            </h3>
            <p className="text-slate-400 text-lg">
              {deckId ? 'Fetching deck details...' : 'Fetching your collection...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (deckError) {
    return (
      <div className="min-h-screen bg-slate-900">
        {/* Add background effects div */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="glassmorphism-card p-12 text-center border-red-500/30 bg-red-500/10">
            <div className="w-16 h-16 rounded-lg bg-red-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-300 mb-4">Error Loading Decks</h3>
            <p className="text-red-200">{deckError}</p>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    if (!selectedDeck) return null;

    switch (activeTab) {
      case 'cards':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-2">
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                                        <span>Cards ({getTotalCardCount(selectedDeck)})</span>
              </h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsShowingCategoryView(!isShowingCategoryView)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isShowingCategoryView 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                  title="Toggle category view"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{isShowingCategoryView ? 'Category View' : 'List View'}</span>
                  </div>
                </button>
              </div>
            </div>
            


            {/* Commander Section */}
            {selectedDeck.commander && (
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full"></div>
                  <h4 className="text-xl font-bold text-yellow-300">Commander</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {(() => {
                    const commander = selectedDeck.commander;
                    const imageUris = getCardImageUris(commander);
                    const gameChangerEffect = commander.game_changer 
                      ? 'ring-4 ring-yellow-400/90 shadow-lg shadow-yellow-400/50' 
                      : '';
                    return (
                      <div
                        key={commander.id + "-commander"} 
                        className={`group relative glassmorphism-card p-3 border-yellow-500/50 hover:border-yellow-400/70 transition-all duration-300 cursor-pointer hover:scale-105 ${gameChangerEffect}`}
                        onClick={() => handleOpenCardDetailModal(commander)}
                        title={`${commander.name} (Commander)`}
                      >
                        {/* Commander Image */}
                        <div className="relative">
                          {imageUris ? (
                            <img
                              src={imageUris.small}
                              alt={commander.name}
                              className="rounded-lg shadow-sm w-full block object-cover aspect-[63/88]"
                            />
                          ) : (
                            <div className="bg-slate-800 rounded-lg shadow-sm w-full aspect-[63/88] flex items-center justify-center p-2">
                              <span className="text-slate-300 text-center text-xs">{commander.name}</span>
                            </div>
                          )}

                          {/* Game Changer Badge */}
                          {commander.game_changer && (
                            <div className="absolute top-2 right-2">
                              <GameChangerTooltip className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg z-10" />
                            </div>
                          )}


                        </div>

                        {/* Commander Name */}
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs text-yellow-300 truncate mr-1" title={commander.name}>{commander.name}</span>
                          <span className="text-xs text-yellow-300 font-semibold flex-shrink-0 bg-yellow-500/30 px-2 py-1 rounded-full">Commander</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Cards Display - Either by Category or as List */}
            {isShowingCategoryView ? (
              /* Cards by Category */
              cardsByType && Object.keys(cardsByType).length > 0 && (
              <div className="space-y-8">
                {Object.entries(cardsByType)
                  .sort(([a], [b]) => {
                    // Define category order for better organization
                    const categoryOrder = {
                      'Creatures': 1,
                      'Planeswalkers': 2, 
                      'Instants': 3,
                      'Sorceries': 4,
                      'Artifacts': 5,
                      'Enchantments': 6,
                      'Lands': 7,
                      'Other': 8
                    };
                    return (categoryOrder[a] || 999) - (categoryOrder[b] || 999);
                  })
                  .map(([category, cards]) => {
                    const categoryCount = cards.reduce((sum, card) => sum + (card.quantity || 1), 0);
                    
                    // Define category colors
                    const categoryColors = {
                      // Default type-based categories
                      'Creatures': 'from-green-400 to-green-600',
                      'Planeswalkers': 'from-purple-400 to-purple-600',
                      'Instants': 'from-blue-400 to-blue-600',
                      'Sorceries': 'from-red-400 to-red-600',
                      'Artifacts': 'from-gray-400 to-gray-600',
                      'Enchantments': 'from-pink-400 to-pink-600',
                      'Lands': 'from-amber-400 to-amber-600',
                      'Other': 'from-slate-400 to-slate-600',
                      
                      // Custom functional categories
                      'Removal': 'from-red-400 to-red-600',
                      'Protection': 'from-blue-400 to-blue-600',
                      'Finisher': 'from-yellow-400 to-yellow-600',
                      'Ramp': 'from-green-500 to-green-700',
                      'Card Draw': 'from-cyan-400 to-cyan-600',
                      'Tokens': 'from-orange-400 to-orange-600',
                      'Combo': 'from-purple-500 to-purple-700',
                      'Stax': 'from-gray-500 to-gray-700',
                      'Utility': 'from-slate-400 to-slate-600',
                      'Maybeboard': 'from-yellow-500 to-yellow-700',
                      'Sideboard': 'from-indigo-400 to-indigo-600',
                    };

                    const categoryTextColors = {
                      // Default type-based categories
                      'Creatures': 'text-green-300',
                      'Planeswalkers': 'text-purple-300',
                      'Instants': 'text-blue-300',
                      'Sorceries': 'text-red-300',
                      'Artifacts': 'text-gray-300',
                      'Enchantments': 'text-pink-300',
                      'Lands': 'text-amber-300',
                      'Other': 'text-slate-300',
                      
                      // Custom functional categories
                      'Removal': 'text-red-400',
                      'Protection': 'text-blue-400',
                      'Finisher': 'text-yellow-400',
                      'Ramp': 'text-green-400',
                      'Card Draw': 'text-cyan-400',
                      'Tokens': 'text-orange-400',
                      'Combo': 'text-purple-400',
                      'Stax': 'text-gray-400',
                      'Utility': 'text-slate-400',
                      'Maybeboard': 'text-yellow-500',
                      'Sideboard': 'text-indigo-400',
                    };

                    const gradientClass = categoryColors[category] || 'from-slate-400 to-slate-600';
                    const textColorClass = categoryTextColors[category] || 'text-slate-300';

                    return (
                      <div key={category} className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-8 bg-gradient-to-b ${gradientClass} rounded-full`}></div>
                          <h4 className={`text-xl font-bold ${textColorClass}`}>
                            {category} ({categoryCount})
                          </h4>
                          <div className={`flex-1 h-px bg-gradient-to-r ${gradientClass.replace('to-', 'to-transparent from-')} opacity-50`}></div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                          {cards.map(card => {
                            const imageUris = getCardImageUris(card);
                            const gameChangerEffect = card.game_changer 
                              ? 'ring-4 ring-yellow-400/90 shadow-lg shadow-yellow-400/50' 
                              : '';

                            return (
                              <div 
                                key={card.id}
                                className={`group relative glassmorphism-card p-3 border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 cursor-pointer hover:scale-105 ${gameChangerEffect}`}
                                onClick={() => handleOpenCardDetailModal(card)}
                                title={card.name}
                              >
                                                        {/* Card Image */}
                        <div className="relative">
                          {imageUris ? (
                            <img
                              src={imageUris.small}
                              alt={card.name}
                              className="rounded-lg shadow-sm w-full block object-cover aspect-[63/88]"
                            />
                          ) : (
                            <div className="bg-slate-800 rounded-lg shadow-sm w-full aspect-[63/88] flex items-center justify-center p-2">
                              <span className="text-slate-300 text-center text-xs">{card.name}</span>
                            </div>
                          )}

                          {/* Loading Placeholder Overlay */}
                          <CardLoadingPlaceholder card={card} />

                          {/* Game Changer Badge */}
                          {card.game_changer && (
                            <div className="absolute top-2 right-2">
                              <GameChangerTooltip className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg z-10" />
                            </div>
                          )}

                          {/* Edit Controls Overlay */}
                          <CardQuantityControls
                            card={card}
                            isEditMode={isEditMode}
                            onUpdateQuantity={handleCardQuantityUpdate}
                            onRemoveCard={handleCardRemove}
                            maxQuantity={['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'].includes(card.name) ? 99 : 4}
                          />
                        </div>

                                {/* Card Name and Quantity */}
                                <div className="mt-2 flex justify-between items-center">
                                  <span className="text-xs text-slate-300 truncate mr-1" title={card.name}>{card.name}</span>
                                  <span className="text-xs text-white font-semibold flex-shrink-0 bg-primary-500/30 px-2 py-1 rounded-full">{card.quantity || 1}x</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              )
            ) : (
              /* Simple List View */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {selectedDeck.cards && Array.isArray(selectedDeck.cards) ? selectedDeck.cards
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(card => {
                    const imageUris = getCardImageUris(card);
                    const gameChangerEffect = card.game_changer 
                      ? 'ring-4 ring-yellow-400/90 shadow-lg shadow-yellow-400/50' 
                      : '';

                    return (
                      <div 
                        key={card.id}
                        className={`group relative glassmorphism-card p-3 border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 cursor-pointer hover:scale-105 ${gameChangerEffect}`}
                        onClick={() => handleOpenCardDetailModal(card)}
                        title={card.name}
                      >
                        {/* Card Image */}
                        <div className="relative">
                          {imageUris ? (
                            <img
                              src={imageUris.small}
                              alt={card.name}
                              className="rounded-lg shadow-sm w-full block object-cover aspect-[63/88]"
                            />
                          ) : (
                            <div className="bg-slate-800 rounded-lg shadow-sm w-full aspect-[63/88] flex items-center justify-center p-2">
                              <span className="text-slate-300 text-center text-xs">{card.name}</span>
                            </div>
                          )}
                          
                          {/* Loading Placeholder Overlay */}
                          <CardLoadingPlaceholder card={card} />

                          {/* Game Changer Badge */}
                          {card.game_changer && (
                            <div className="absolute top-2 right-2">
                              <GameChangerTooltip className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full shadow-lg z-10" />
                            </div>
                          )}

                          {/* Edit Controls Overlay */}
                          <CardQuantityControls
                            card={card}
                            isEditMode={isEditMode}
                            onUpdateQuantity={handleCardQuantityUpdate}
                            onRemoveCard={handleCardRemove}
                            maxQuantity={['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'].includes(card.name) ? 99 : 4}
                          />
                        </div>

                        {/* Card Name and Quantity */}
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs text-slate-300 truncate mr-1" title={card.name}>{card.name}</span>
                          <span className="text-xs text-white font-semibold flex-shrink-0 bg-primary-500/30 px-2 py-1 rounded-full">{card.quantity || 1}x</span>
                        </div>
                      </div>
                    );
                  }) : []}
              </div>
            )}
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
    <div className="min-h-screen bg-slate-900">
      <Seo
        title={deckId ? `Your Deck – ${selectedDeck?.name || 'Deck Viewer'}` : 'Your Decks – Deck Viewer'}
        description={deckId ? 'View and manage your Commander deck.' : 'Browse, view, and manage your saved Commander decks.'}
      />
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Inline Report Issue CTA */}
        <div className="text-right">
          <button
            onClick={() => {
              const params = new URLSearchParams({ type: 'Bug', feature: 'Deck Viewer' });
              navigate(`/feedback?${params.toString()}`);
            }}
            className="text-sm text-slate-300 hover:text-primary-300 underline"
          >
            Report issue with Deck Viewer
          </button>
        </div>
        {loadingAuth || deckLoading || (deckId && (isLoadingSpecificDeck || !hasFetchedDecks)) ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="glassmorphism-card p-12 text-center">
              <div className="animate-spin h-16 w-16 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-6"></div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {deckId ? 'Loading Deck' : 'Loading Your Decks'}
              </h3>
              <p className="text-slate-400 text-lg">
                {deckId ? 'Fetching deck details...' : 'Fetching your collection...'}
              </p>
            </div>
          </div>
        ) : deckError ? (
          <div className="glassmorphism-card p-12 text-center border-red-500/30 bg-red-500/10">
            <div className="w-16 h-16 rounded-lg bg-red-500 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-red-300 mb-4">Error Loading Decks</h3>
            <p className="text-red-200">{deckError}</p>
          </div>
        ) : !deckId && savedDecks.length === 0 ? (
          /* Empty State */
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-4">
                <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Your Deck Collection</span>
              </h1>
              <p className="text-xl text-slate-400">
                Build and manage your Magic: The Gathering decks
              </p>
            </div>

            <div className="glassmorphism-card p-12 text-center border-slate-700/50">
              <div className="mb-6">
                <svg className="h-20 w-20 mx-auto mb-6 text-slate-400 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <h2 className="text-3xl font-bold text-white mb-4">No Decks Yet</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                  You haven't saved any decks yet. Start building your first deck or import an existing one to begin your collection!
                </p>
                <div className="flex flex-col sm:flex-row items-stretch gap-4 justify-center">
                  <Link to="/builder" className="btn-modern btn-modern-primary btn-modern-xl premium-glow group">
                    <span className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M4 13a8 8 0 017 7a6 6 0 003 -5l3.5 -3.5a9 9 0 01 -7 -7a6 6 0 00-3 5l-3.5 3.5" />
                        <path d="M7 14a6 6 0 003 -5l3.5 -3.5a9 9 0 01 7 7a6 6 0 00-3 5l-3.5 3.5a9 9 0 01-7 -7" />
                        <path d="M15 9h.01" />
                      </svg>
                      <span>Start Building</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </Link>
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="btn-modern btn-modern-secondary btn-modern-xl group"
                  >
                    <span className="flex items-center space-x-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      <span>Import Deck</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : deckId ? (
          selectedDeck ? (
            <div className="space-y-8">
              {/* Back Navigation */}
              <div>
                <Link to="/decks" className="inline-flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors group">
                  <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back to All Decks</span>
                </Link>
              </div>
              
              {/* Deck Header */}
              <div className="glassmorphism-card p-8 border-primary-500/20">
                {/* Top row with title and action buttons */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gradient-primary mb-4">{selectedDeck.name}</h1>
                  </div>
                  {/* Action Buttons - Top Right */}
                  <div className="flex-shrink-0 ml-6">
                    <DeckActionButtons
                      deck={selectedDeck}
                      isEditMode={isEditMode}
                      hasUnsavedChanges={hasUnsavedChanges}
                      onToggleEditMode={handleToggleEditMode}
                      onSave={handleSaveChanges}
                      onDiscard={handleDiscardChanges}
                      onDelete={handleDeleteDeck}
                      isSaving={isSaving}
                      className="justify-end"
                    />
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
                  {selectedDeck.commander && selectedDeck.commander.image_uris && (
                    <img
                      src={selectedDeck.commander.image_uris.art_crop}
                      alt={selectedDeck.commander.name}
                      className="w-40 h-40 rounded-2xl border-2 border-primary-500/50 shadow-lg shadow-primary-500/20 object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-lg">
                        <span className="text-slate-400">Commander:</span>
                        <span className="text-white font-semibold">{selectedDeck.commander ? selectedDeck.commander.name : 'Unknown'}</span>
                      </div>
                      {selectedDeck.description && (
                        <p className="text-slate-300 text-lg leading-relaxed">{selectedDeck.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-slate-400">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M4 7a2 2 0 012 -2h12a2 2 0 012 2v12a2 2 0 01-2 2h-12a2 2 0 01-2 -2v-12z" />
                            <path d="M16 3v4" />
                            <path d="M8 3v4" />
                            <path d="M4 11h16" />
                            <path d="M11 15h1" />
                            <path d="M12 15v3" />
                          </svg>
                          <span>Last updated: {new Date(selectedDeck.lastUpdated).toLocaleDateString()}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>{getTotalCardCount(selectedDeck)} cards</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Unsaved Changes Warning */}
              <UnsavedChangesWarning
                hasUnsavedChanges={hasUnsavedChanges}
                onSave={handleSaveChanges}
                onDiscard={handleDiscardChanges}
                isSaving={isSaving}
              />
              
              {/* Tabs */}
              <div className="glassmorphism-card border-slate-700/50">
                {/* Tab Navigation */}
                <div className="border-b border-slate-700/50">
                  <nav className="flex space-x-8 px-8">
                    {[
                      { id: 'cards', label: 'Cards', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                      ...(isEditMode ? [{ id: 'search', label: 'Search & Add', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }] : []),
                      { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
                      { id: 'export', label: 'Export', icon: 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                      { id: 'share', label: 'Share', icon: 'M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 font-semibold text-sm transition-all duration-300 border-b-2 ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-400'
                            : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                          </svg>
                          <span>{tab.label}</span>
                        </div>
                      </button>
                    ))}
                  </nav>
                </div>
                
                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === 'search' && isEditMode ? (
                    <CardSearchPanel 
                      isEditMode={isEditMode}
                      onCardAdd={handleCardAdd}
                    />
                  ) : (
                    renderTabContent()
                  )}
                </div>
              </div>
              

            </div>
          ) : hasFetchedDecks && !isLoadingSpecificDeck ? (
            /* Deck Not Found - Only show if we're not loading AND we've completed fetching */
            <div className="glassmorphism-card p-12 text-center border-red-500/30 bg-red-500/10">
              <div className="w-16 h-16 rounded-lg bg-red-500 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-red-300 mb-4">Deck Not Found</h3>
              <p className="text-red-200 mb-6">The deck you're looking for doesn't exist or may have been deleted.</p>
              <Link to="/decks" className="btn-modern btn-modern-secondary btn-modern-md">
                View All Decks
              </Link>
            </div>
          ) : null
        ) : (
          /* Deck List View */
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-gradient-primary mb-4 flex items-center justify-center space-x-4">
                <svg className="w-12 h-12 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}>
                  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                  <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>Your Deck Collection</span>
              </h1>
              <p className="text-xl text-slate-400">
                {savedDecks.length} {savedDecks.length === 1 ? 'deck' : 'decks'} in your collection
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 justify-center">
              <Link 
                to="/builder"
                className="btn-modern btn-modern-primary btn-modern-xl premium-glow group"
              >
                <span className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Create New Deck</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="btn-modern btn-modern-secondary btn-modern-xl group"
              >
                <span className="flex items-center space-x-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>Import Deck</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedDecks.map(deck => (
                <Link 
                  key={deck.id} 
                  to={`/decks/${deck.id}`}
                  className="group glassmorphism-card p-6 border-slate-700/50 hover:border-primary-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-modern-primary"
                >
                  <div className="flex items-start space-x-4">
                    {deck.commander && deck.commander.image_uris ? (
                      <img
                        src={deck.commander.image_uris.art_crop}
                        alt={deck.commander.name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500/50 shadow-lg group-hover:border-primary-400/70 transition-colors"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {deck.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white group-hover:text-primary-300 transition-colors truncate">{deck.name}</h3>
                      <div className="text-sm text-slate-400 mb-2">
                        <span className="font-medium">Commander:</span> {deck.commander ? deck.commander.name : 'Unknown'}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>{getTotalCardCount(deck)} cards</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}>
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M4 7a2 2 0 012 -2h12a2 2 0 012 2v12a2 2 0 01-2 2h-12a2 2 0 01-2 -2v-12z" />
                            <path d="M16 3v4" />
                            <path d="M8 3v4" />
                            <path d="M4 11h16" />
                            <path d="M11 15h1" />
                            <path d="M12 15v3" />
                          </svg>
                          <span>{new Date(deck.lastUpdated).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </Link>
              ))}
              
              {/* Create New Deck Card */}
              <Link 
                to="/builder"
                className="group glassmorphism-card p-6 border-2 border-dashed border-slate-600 hover:border-primary-500/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center min-h-[120px]"
              >
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-blue-500 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-slate-300 font-semibold group-hover:text-white transition-colors">Create New Deck</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Card Detail Modal */}
        {isCardDetailModalOpen && selectedCardForModal && (
          <CardDetailModal 
            card={selectedCardForModal} 
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

        {/* Alert Modal */}
        <AlertModal
          isOpen={isAlertModalOpen}
          title={alertModalConfig.title}
          message={alertModalConfig.message}
          onConfirm={alertModalConfig.onConfirm}
          onClose={() => setIsAlertModalOpen(false)}
          confirmText={alertModalConfig.confirmText}
          showCancelButton={alertModalConfig.showCancelButton}
        />
      </div>
    </div>
  );
};

export default DeckViewer; 