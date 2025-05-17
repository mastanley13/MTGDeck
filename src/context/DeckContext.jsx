import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { getCachedCard, cacheCard } from '../utils/cardCache';
import { getCardById } from '../utils/scryfallAPI';

// GHL API Constants
const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';
const GHL_API_TOKEN = import.meta.env.VITE_GHL_API_KEY;
const GHL_API_VERSION = '2021-07-28';
const GHL_LOCATION_ID = 'zKZ8Zy6VvGR1m7lNfRkY';
const GHL_DECK_OBJECT_KEY = 'custom_objects.decks';
const GHL_ASSOCIATION_ID = '6826283c413da0c2068739e9';
const GHL_SHORT_DECK_NAME_FIELD_KEY = 'decks';
const GHL_SHORT_DECK_DATA_FIELD_KEY = 'deck_data';

// Helper function to minimize card data for storage using shortened keys
const minimizeCardDataForKeySaving = (card) => {
  if (!card) return null;
  return {
    i: card.id,                                // id
    n: card.name,                              // name
    q: card.quantity || 1,                   // quantity
    t: card.type_line,                       // type_line
    c: card.cmc,                             // cmc
    // iu: {                                      // image_uris (shortened) - REMOVED
    //     s: card.image_uris?.small,
    //     n: card.image_uris?.normal,
    // },
    // ci: card.color_identity,                 // color_identity - REMOVED
    // ct (category) will be added after this function call
  };
};

// Helper function to rehydrate a minimized card to a fuller object
const rehydrateCard = async (minimizedCard) => {
  if (!minimizedCard || !minimizedCard.i) return null;

  let fullCardData = getCachedCard(minimizedCard.i);

  if (!fullCardData) {
    try {
      // console.log(`Rehydrating card ${minimizedCard.n} (ID: ${minimizedCard.i}) from Scryfall`);
      fullCardData = await getCardById(minimizedCard.i);
      if (fullCardData) {
        cacheCard(fullCardData); // Cache it for future use
      }
    } catch (error) {
      console.error(`Error fetching card ${minimizedCard.i} from Scryfall:`, error);
      // Return a card object with at least the minimized data so the app doesn't break
      return {
        id: minimizedCard.i,
        name: minimizedCard.n,
        type_line: minimizedCard.t,
        cmc: minimizedCard.c,
        quantity: minimizedCard.q,
        customCategory: minimizedCard.ct, // Preserve category
        image_uris: { small: '', normal: '', art_crop: '' }, // Placeholder
        mana_cost: '',
        color_identity: [],
        // Add other essential fields with default values if necessary
      };
    }
  }

  if (!fullCardData) { // Still no data after fetch attempt
     return {
        id: minimizedCard.i,
        name: minimizedCard.n,
        type_line: minimizedCard.t,
        cmc: minimizedCard.c,
        quantity: minimizedCard.q,
        customCategory: minimizedCard.ct,
        image_uris: { small: '', normal: '', art_crop: '' },
        mana_cost: '',
        color_identity: [],
      };
  }
  
  // Combine fetched data with quantity and category from minimized data
  return {
    ...fullCardData, // Spread the comprehensive data from cache/API
    quantity: minimizedCard.q,
    customCategory: minimizedCard.ct, // Add custom category if it exists
    // Ensure essential fields like id and name are prioritized from fullCardData if different
    id: fullCardData.id || minimizedCard.i,
    name: fullCardData.name || minimizedCard.n,
  };
};

// Define initial state
const initialState = {
  commander: null,
  cards: [],
  loading: false,
  error: null,
  savedDecks: [],
  currentDeckName: 'New Deck',
  deckDescription: '',
  cardCategories: {}, // Track custom categories for cards
  UPDATE_CARD_CATEGORY: 'UPDATE_CARD_CATEGORY', // New action for categories
  SAVE_DECK_START: 'SAVE_DECK_START', // For GHL saving
  SAVE_DECK_GHL_SUCCESS: 'SAVE_DECK_GHL_SUCCESS', // For GHL saving
  SAVE_DECK_GHL_ERROR: 'SAVE_DECK_GHL_ERROR', // For GHL saving
  FETCH_USER_DECKS_START: 'FETCH_USER_DECKS_START',
  FETCH_USER_DECKS_SUCCESS: 'FETCH_USER_DECKS_SUCCESS',
  FETCH_USER_DECKS_ERROR: 'FETCH_USER_DECKS_ERROR',
};

// Action types
const Actions = {
  SET_COMMANDER: 'SET_COMMANDER',
  ADD_CARD: 'ADD_CARD',
  REMOVE_CARD: 'REMOVE_CARD',
  UPDATE_CARD_QUANTITY: 'UPDATE_CARD_QUANTITY',
  CLEAR_DECK: 'CLEAR_DECK',
  RESET_DECK_EXCEPT_COMMANDER: 'RESET_DECK_EXCEPT_COMMANDER',
  LOAD_DECK: 'LOAD_DECK',
  SAVE_DECK: 'SAVE_DECK',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_DECK_NAME: 'SET_DECK_NAME',
  SET_DECK_DESCRIPTION: 'SET_DECK_DESCRIPTION',
  IMPORT_DECK: 'IMPORT_DECK',
  INIT_SAVED_DECKS: 'INIT_SAVED_DECKS',
  UPDATE_CARD_CATEGORY: 'UPDATE_CARD_CATEGORY', // New action for categories
  SAVE_DECK_START: 'SAVE_DECK_START', // For GHL saving
  SAVE_DECK_GHL_SUCCESS: 'SAVE_DECK_GHL_SUCCESS', // For GHL saving
  SAVE_DECK_GHL_ERROR: 'SAVE_DECK_GHL_ERROR', // For GHL saving
  FETCH_USER_DECKS_START: 'FETCH_USER_DECKS_START',
  FETCH_USER_DECKS_SUCCESS: 'FETCH_USER_DECKS_SUCCESS',
  FETCH_USER_DECKS_ERROR: 'FETCH_USER_DECKS_ERROR',
};

// Create context
const DeckContext = createContext();

// Reducer function
const deckReducer = (state, action) => {
  switch (action.type) {
    case Actions.SET_COMMANDER:
      return {
        ...state,
        commander: action.payload,
      };
      
    case Actions.ADD_CARD: {
      const card = action.payload;
      
      // Calculate current non-commander card quantity
      const currentNonCommanderCardsCount = state.cards.reduce((sum, c) => sum + (c.quantity || 1), 0);

      // If deck is already at 99 non-commander cards, block additions/increments
      if (currentNonCommanderCardsCount >= 99) {
        const isExistingCard = state.cards.some(c => c.id === card.id);
        // Allow incrementing quantity only if the card is already in the deck AND its increment won't push total over 99
        // However, simpler is: if count is 99, only allow if it's an existing card AND its quantity won't increase total.
        // Safest: if current count >= 99, only allow adding if it's an existing card AND we are NOT increasing its quantity.
        // But the original logic was just to add a card. The goal is to not exceed 99 total.
        if (isExistingCard) {
          // If card exists, existing logic tries to increment quantity.
          // If currentNonCommanderCardsCount is 99, incrementing an existing card's quantity also makes it > 99.
          // So, if count is 99, no more additions or increments.
          console.warn(`Deck has ${currentNonCommanderCardsCount} non-commander cards. Cannot add/increment card ${card.name} as deck would exceed 99 cards.`);
          return state;
        } else {
          // Trying to add a new card type when deck is already at 99.
          console.warn(`Deck has ${currentNonCommanderCardsCount} non-commander cards. Cannot add NEW card ${card.name} as deck is full.`);
          return state;
        }
      }

      const cardIndex = state.cards.findIndex(c => c.id === card.id);
      
      if (cardIndex >= 0) {
        // Card already exists, update quantity
        const updatedCards = [...state.cards];
        updatedCards[cardIndex] = {
          ...updatedCards[cardIndex],
          quantity: Math.min((updatedCards[cardIndex].quantity || 1) + 1, 99) // Max 99 copies
        };
        return {
          ...state,
          cards: updatedCards
        };
      } else {
        // Add new card with quantity 1
        return {
          ...state,
          cards: [...state.cards, { ...card, quantity: 1 }]
        };
      }
    }
    
    case Actions.REMOVE_CARD: {
      const cardId = action.payload;
      // Also remove from cardCategories if it exists
      const updatedCategories = { ...state.cardCategories };
      delete updatedCategories[cardId];
      
      return {
        ...state,
        cards: state.cards.filter(card => card.id !== cardId),
        cardCategories: updatedCategories
      };
    }
    
    case Actions.UPDATE_CARD_QUANTITY: {
      const { cardId, quantity } = action.payload;
      if (quantity <= 0) {
        // Remove card if quantity is 0 or negative
        const updatedCategories = { ...state.cardCategories };
        delete updatedCategories[cardId];
        
        return {
          ...state,
          cards: state.cards.filter(card => card.id !== cardId),
          cardCategories: updatedCategories
        };
      }
      
      const updatedCards = state.cards.map(card =>
        card.id === cardId ? { ...card, quantity: Math.min(quantity, 99) } : card
      );
      
      return {
        ...state,
        cards: updatedCards
      };
    }
    
    case Actions.CLEAR_DECK:
      return {
        ...state,
        commander: null,
        cards: [],
        currentDeckName: 'New Deck',
        deckDescription: '',
        cardCategories: {},
      };
      
    case Actions.RESET_DECK_EXCEPT_COMMANDER:
      return {
        ...state,
        cards: [],
        cardCategories: {},
      };
      
    case Actions.LOAD_DECK: {
      const deck = action.payload;
      return {
        ...state,
        commander: deck.commander,
        cards: deck.cards,
        currentDeckName: deck.name,
        deckDescription: deck.description || '',
        cardCategories: deck.cardCategories || {},
      };
    }
    
    case Actions.SAVE_DECK: {
      const { name, description, id } = action.payload;
      const newDeck = {
        id: id || Date.now().toString(), // Use provided ID or generate new
        name: name || state.currentDeckName,
        description: description || state.deckDescription,
        commander: state.commander,
        cards: state.cards,
        cardCategories: state.cardCategories,
        lastUpdated: new Date().toISOString(),
      };
      
      const existingDeckIndex = state.savedDecks.findIndex(deck => deck.id === newDeck.id || deck.name === newDeck.name);
      let updatedDecks;
      
      if (existingDeckIndex >= 0) {
        updatedDecks = [...state.savedDecks];
        updatedDecks[existingDeckIndex] = newDeck;
      } else {
        updatedDecks = [...state.savedDecks, newDeck];
      }
      
      return {
        ...state,
        savedDecks: updatedDecks,
        currentDeckName: newDeck.name, // Ensure currentDeckName reflects the saved name
        deckDescription: newDeck.description,
        loading: false, // Stop loading after local save
        error: null, 
      };
    }
    
    case Actions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
      
    case Actions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
      
    case Actions.SET_DECK_NAME:
      return {
        ...state,
        currentDeckName: action.payload,
      };
      
    case Actions.SET_DECK_DESCRIPTION:
      return {
        ...state,
        deckDescription: action.payload,
      };
      
    case Actions.IMPORT_DECK:
      return {
        ...state,
        commander: action.payload.commander,
        cards: action.payload.cards,
        currentDeckName: action.payload.name || 'Imported Deck',
        deckDescription: action.payload.description || '',
        cardCategories: action.payload.cardCategories || {},
      };
    
    case Actions.INIT_SAVED_DECKS:
      return {
        ...state,
        savedDecks: action.payload
      };
      
    case Actions.UPDATE_CARD_CATEGORY: {
      const { cardId, category } = action.payload;
      return {
        ...state,
        cardCategories: {
          ...state.cardCategories,
          [cardId]: category
        }
      };
    }
    
    case Actions.SAVE_DECK_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case Actions.SAVE_DECK_GHL_SUCCESS: 
      return {
        ...state,
        // loading: false, // GHL part done, local save will set loading to false
        // error: null,
      };
    case Actions.SAVE_DECK_GHL_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload, 
      };

    case Actions.FETCH_USER_DECKS_START:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case Actions.FETCH_USER_DECKS_SUCCESS:
      return {
        ...state,
        loading: false,
        savedDecks: action.payload, // Replace savedDecks with fetched ones
        error: null,
      };
    case Actions.FETCH_USER_DECKS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
      
    default:
      return state;
  }
};

// Create provider component
export const DeckProvider = ({ children }) => {
  const [state, dispatch] = useReducer(deckReducer, initialState);
  
  // Load saved decks from localStorage on mount
  useEffect(() => {
    try {
      const savedDecks = localStorage.getItem('mtg_saved_decks');
      if (savedDecks) {
        const parsedDecks = JSON.parse(savedDecks);
        dispatch({ 
          type: Actions.INIT_SAVED_DECKS, 
          payload: parsedDecks 
        });
      }
    } catch (error) {
      console.error('Error loading saved decks:', error);
    }
  }, []);
  
  // Save decks to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem('mtg_saved_decks', JSON.stringify(state.savedDecks));
    } catch (error) {
      console.error('Error saving decks to local storage:', error);
    }
  }, [state.savedDecks]);
  
  // Derived state computations (memoized)
  const { cardsByType, totalCardCount } = useMemo(() => {
    const newCardsByType = {};
    let newTotalCardCount = 0;

    if (state.cards && Array.isArray(state.cards)) {
      state.cards.forEach(card => {
        const customCategory = state.cardCategories && state.cardCategories[card.id];
        const category = customCategory || getCardType(card); // getCardType must be stable or defined outside

        if (!newCardsByType[category]) {
          newCardsByType[category] = [];
        }
        newCardsByType[category].push(card);
        newTotalCardCount += (card.quantity || 1);
      });
    }
    return { cardsByType: newCardsByType, totalCardCount: newTotalCardCount };
  }, [state.cards, state.cardCategories]); // Dependencies: state.cards and state.cardCategories
  
  // Action creators
  const setCommander = (commander) => {
    if (commander) {
      cacheCard(commander);
    }
    dispatch({ type: Actions.SET_COMMANDER, payload: commander });
  };
  
  const addCard = (card) => {
    if (card) {
      cacheCard(card);
    }
    dispatch({ type: Actions.ADD_CARD, payload: card });
  };
  
  const removeCard = (cardId) => {
    dispatch({ type: Actions.REMOVE_CARD, payload: cardId });
  };
  
  const updateCardQuantity = (cardId, quantity) => {
    dispatch({ 
      type: Actions.UPDATE_CARD_QUANTITY, 
      payload: { cardId, quantity } 
    });
  };
  
  const clearDeck = () => {
    dispatch({ type: Actions.CLEAR_DECK });
  };
  
  const resetDeckExceptCommander = () => {
    dispatch({ type: Actions.RESET_DECK_EXCEPT_COMMANDER });
  };
  
  const loadDeck = (deck) => {
    dispatch({ type: Actions.LOAD_DECK, payload: deck });
  };
  
  const saveDeck = (name, description) => {
    dispatch({ type: Actions.SAVE_DECK, payload: { name, description } });
  };
  
  const setDeckName = (name) => {
    dispatch({ type: Actions.SET_DECK_NAME, payload: name });
  };
  
  const setDeckDescription = (description) => {
    dispatch({ type: Actions.SET_DECK_DESCRIPTION, payload: description });
  };
  
  const importDeck = (deckData) => {
    dispatch({ type: Actions.IMPORT_DECK, payload: deckData });
  };
  
  // New function for updating card categories
  const updateCardCategory = (cardId, category) => {
    dispatch({
      type: Actions.UPDATE_CARD_CATEGORY,
      payload: { cardId, category }
    });
  };
  
  // New function to save deck to GHL and then locally
  const saveCurrentDeckToGHL = useCallback(async (contactId, commanderNameForGHLInput, localDeckName) => {
    if (!state.commander) {
      console.error("Commander is required to save a deck.");
      dispatch({ type: Actions.SET_ERROR, payload: "Commander is required to save a deck." });
      return false;
    }
    if (!contactId) {
      console.error("Contact ID is required to save a deck to GHL.");
      dispatch({ type: Actions.SET_ERROR, payload: "User not identified. Cannot save deck to cloud."});
      return false;
    }
    
    const commanderNameForGHL = commanderNameForGHLInput.trim();
    if (!commanderNameForGHL || typeof commanderNameForGHL !== 'string' || commanderNameForGHL === '') {
        console.error("Commander name is invalid or empty after trim. Cannot satisfy GHL required property.");
        dispatch({ type: Actions.SAVE_DECK_GHL_ERROR, payload: "Commander name is invalid. Cannot save to cloud." });
        return false;
    }

    dispatch({ type: Actions.SAVE_DECK_START });

    // Construct minimized deck payload
    const minimizedCommander = minimizeCardDataForKeySaving(state.commander);
    if (minimizedCommander && minimizedCommander.q === undefined) {
        minimizedCommander.q = 1; 
    }

    const minimizedMainboard = state.cards.map(card => {
      const minimizedCard = minimizeCardDataForKeySaving(card);
      minimizedCard.ct = state.cardCategories[card.id] || getCardType(card);
      return minimizedCard;
    });

    const deckDataToStoreInGHLField = {
      v: "1.1_shortkeys",
      adn: localDeckName,
      cmd: minimizedCommander,
      mb: minimizedMainboard,
      ls: new Date().toISOString()
    };

    const propertiesForGHLRecord = {
      [GHL_SHORT_DECK_NAME_FIELD_KEY]: commanderNameForGHL,
      [GHL_SHORT_DECK_DATA_FIELD_KEY]: JSON.stringify(deckDataToStoreInGHLField)
    };

    try {
      // console.log('GHL Create Record - Properties being sent:', JSON.stringify(propertiesForGHLRecord, null, 2));
      
      const deckDataStringForLengthCheck = JSON.stringify(deckDataToStoreInGHLField);
      // console.log(`Length of key-shortened deck_data JSON string: ${deckDataStringForLengthCheck.length}`);
      if (deckDataStringForLengthCheck.length > 12000) {
          console.error(`Deck data JSON string is still too long (${deckDataStringForLengthCheck.length} chars), exceeding 12000 limit.`);
          dispatch({ type: Actions.SAVE_DECK_GHL_ERROR, payload: `Deck data is too large (${deckDataStringForLengthCheck.length}/12000 chars). Try removing cards or simplifying further.` });
          return false;
      }

      const createRecordResponse = await fetch(`${GHL_API_BASE_URL}/objects/${GHL_DECK_OBJECT_KEY}/records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          properties: propertiesForGHLRecord 
        })
      });

      if (!createRecordResponse.ok) {
        const errorData = await createRecordResponse.json().catch(() => ({ message: 'Failed to save deck to GHL.' }));
        throw new Error(errorData.message || `GHL Create Record Error: ${createRecordResponse.status} - ${await createRecordResponse.text()}`);
      }
      const recordResult = await createRecordResponse.json();
      const newGHLDeckRecordId = recordResult?.record?.id;

      if (!newGHLDeckRecordId) {
        throw new Error('Failed to get ID from GHL deck record creation.');
      }
      
      dispatch({ type: Actions.SAVE_DECK_GHL_SUCCESS });

      const createAssociationResponse = await fetch(`${GHL_API_BASE_URL}/associations/relations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          associationId: GHL_ASSOCIATION_ID,
          firstRecordId: contactId, 
          secondRecordId: newGHLDeckRecordId
        })
      });

      if (!createAssociationResponse.ok) {
        const errorData = await createAssociationResponse.json().catch(() => ({ message: 'Failed to associate deck with contact.' }));
        console.error("GHL Association Failed. Deck record was created with ID:", newGHLDeckRecordId);
        throw new Error(errorData.message || `GHL Create Association Error: ${createAssociationResponse.status} - ${await createAssociationResponse.text()}`);
      }
      
      dispatch({ 
        type: Actions.SAVE_DECK, 
        payload: { 
          id: newGHLDeckRecordId, 
          name: localDeckName, 
          description: state.deckDescription, 
        }
      });
      return true;

    } catch (error) {
      console.error('Error saving deck to GHL:', error);
      dispatch({ type: Actions.SAVE_DECK_GHL_ERROR, payload: error.message });
      return false;
    }
  }, [state.commander, state.cards, state.cardCategories, state.deckDescription, dispatch]);
  
  const fetchAndSetUserDecks = useCallback(async (contactId) => {
    if (!contactId) {
      dispatch({ type: Actions.FETCH_USER_DECKS_ERROR, payload: "Contact ID is required to fetch decks." });
      return;
    }
    dispatch({ type: Actions.FETCH_USER_DECKS_START });

    try {
      // Step 1: Get relations for the contact
      // The endpoint seems to be /associations/relations/{recordId}
      // We'll use contactId as recordId and filter by our specific associationId for decks
      const relationsResponse = await fetch(`${GHL_API_BASE_URL}/associations/relations/${contactId}?locationId=${GHL_LOCATION_ID}&associationIds[]=${GHL_ASSOCIATION_ID}&limit=100&skip=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${GHL_API_TOKEN}`,
          'Version': GHL_API_VERSION,
          'Accept': 'application/json',
        },
      });

      if (!relationsResponse.ok) {
        const errorData = await relationsResponse.json().catch(() => ({ message: 'Failed to fetch associations for contact.' }));
        throw new Error(errorData.message || `GHL Fetch Associations Error: ${relationsResponse.status} - ${await relationsResponse.text()}`);
      }

      const relationsResult = await relationsResponse.json();
      console.log("GHL Associations Result for contact:", relationsResult);

      let deckRecordIds = [];
      // The exact structure of relationsResult needs to be inspected.
      // Assuming relationsResult.relations is an array, and each item has firstRecordId and secondRecordId
      // And we need to identify which one is the deck based on object keys if provided, or by assuming contact is firstObjectKey
      if (relationsResult && relationsResult.relations && Array.isArray(relationsResult.relations)) {
        deckRecordIds = relationsResult.relations.map(rel => {
          // Assuming the association is defined as contact (first) to deck (second)
          // And the GHL_ASSOCIATION_ID ensures we are looking at the correct type of relation.
          // The firstObjectKey (e.g., "contact") and secondObjectKey (e.g., "custom_objects.decks") might be in the relation item.
          // For now, assuming 'secondRecordId' is the deck if 'firstRecordId' matches our contactId.
          // This might need adjustment based on the actual API response structure from /associations/relations/{recordId}
          if (rel.firstRecordId === contactId && rel.associationId === GHL_ASSOCIATION_ID) {
            return rel.secondRecordId;
          }
          // Or if the association is stored the other way around
          if (rel.secondRecordId === contactId && rel.associationId === GHL_ASSOCIATION_ID) {
            return rel.firstRecordId;
          }
          return null;
        }).filter(id => id !== null);
      } else if (relationsResult && relationsResult.data && Array.isArray(relationsResult.data)) { // Alternative structure based on some GHL patterns
         relationsResult.data.forEach(item => {
            // Example: item might look like { id (relationId), objectId (contactId), associatedObjectId (deckId), associationDefId }
            // This part is speculative based on generic association patterns.
            // We need to inspect the actual relationsResult from console.log("GHL Associations Result for contact:", relationsResult);
            // For now, assuming a simple structure where secondRecordId is what we need
            if (item.secondRecordId) deckRecordIds.push(item.secondRecordId);
         });
      }


      if (deckRecordIds.length === 0) {
        console.log("No associated deck records found for this contact.");
        dispatch({ type: Actions.FETCH_USER_DECKS_SUCCESS, payload: [] });
        return;
      }

      console.log("Found deck record IDs:", deckRecordIds);

      // Step 2: Fetch each deck record by its ID
      const deckPromises = deckRecordIds.map(deckId =>
        fetch(`${GHL_API_BASE_URL}/objects/${GHL_DECK_OBJECT_KEY}/records/${deckId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': GHL_API_VERSION,
            'Accept': 'application/json',
          },
        }).then(res => {
          if (!res.ok) {
            console.error(`Failed to fetch deck record ${deckId}: ${res.status}`);
            return res.json().then(err => { throw new Error(err.message || `GHL Fetch Record Error ${res.status}`) }).catch(() => {throw new Error(`GHL Fetch Record Error ${res.status}`)});
          }
          return res.json();
        })
      );

      const fetchedDeckRecordResults = await Promise.allSettled(deckPromises);
      
      const successfullyFetchedDecks = [];
      fetchedDeckRecordResults.forEach(promiseResult => {
        if (promiseResult.status === 'fulfilled' && promiseResult.value && promiseResult.value.record) {
          successfullyFetchedDecks.push(promiseResult.value.record);
        } else if (promiseResult.status === 'rejected') {
          console.error("Error fetching a deck record:", promiseResult.reason);
        }
      });
      
      console.log("Successfully fetched GHL deck records:", successfullyFetchedDecks);

      if (successfullyFetchedDecks.length > 0) {
        const processedDecks = await Promise.all(successfullyFetchedDecks.map(async (record) => {
          try {
            const deckDataString = record.properties && record.properties[GHL_SHORT_DECK_DATA_FIELD_KEY];
            if (!deckDataString) {
              console.warn(`Deck record ${record.id} is missing deck_data property.`);
              return null;
            }
            
            const parsedDeckGHLData = JSON.parse(deckDataString);
            
            const rehydratedCommander = parsedDeckGHLData.cmd ? await rehydrateCard(parsedDeckGHLData.cmd) : null;
            
            const rehydratedMainboard = parsedDeckGHLData.mb && Array.isArray(parsedDeckGHLData.mb) 
              ? await Promise.all(parsedDeckGHLData.mb.map(card => rehydrateCard(card))) 
              : [];

            const validMainboard = rehydratedMainboard.filter(card => card !== null);
            
            const cardCategories = {};
            if (rehydratedCommander && rehydratedCommander.customCategory) {
                cardCategories[rehydratedCommander.id] = rehydratedCommander.customCategory;
            }
            validMainboard.forEach(card => {
                if (card.customCategory) {
                    cardCategories[card.id] = card.customCategory;
                }
            });

            return {
              id: record.id, 
              name: parsedDeckGHLData.adn || (record.properties && record.properties[GHL_SHORT_DECK_NAME_FIELD_KEY]) || 'Untitled Deck',
              description: parsedDeckGHLData.dsc || '', 
              commander: rehydratedCommander,
              cards: validMainboard,
              cardCategories: cardCategories,
              lastUpdated: parsedDeckGHLData.ls || record.updatedAt,
            };
          } catch (e) {
            console.error(`Error processing GHL deck record ${record.id}: `, e);
            return null;
          }
        }));
        
        const validProcessedDecks = processedDecks.filter(deck => deck !== null);
        dispatch({ type: Actions.FETCH_USER_DECKS_SUCCESS, payload: validProcessedDecks });
      } else {
        console.warn("No deck records successfully fetched after getting IDs.");
        dispatch({ type: Actions.FETCH_USER_DECKS_SUCCESS, payload: [] });
      }

    } catch (error) {
      console.error('Error fetching or processing user decks:', error);
      dispatch({ type: Actions.FETCH_USER_DECKS_ERROR, payload: error.message });
    }
  }, [dispatch]);
  
  // Expose getCardType separately as it's used by other functions and might be needed by components
  // Ensure getCardType is stable if it's a dependency elsewhere or defined outside the component scope if static
  function getCardType(card) { // Moved getCardType to be accessible by useMemo
    const typeLine = card.type_line || '';
    
    if (typeLine.includes('Land')) {
      return 'Lands';
    } else if (typeLine.includes('Creature')) {
      return 'Creatures';
    } else if (typeLine.includes('Artifact')) {
      if (typeLine.includes('Creature')) { // Check if it's an Artifact Creature
        return 'Creatures';
      }
      return 'Artifacts';
    } else if (typeLine.includes('Enchantment')) {
      if (typeLine.includes('Creature')) { // Check if it's an Enchantment Creature
        return 'Creatures';
      }
      return 'Enchantments';
    } else if (typeLine.includes('Planeswalker')) {
      return 'Planeswalkers';
    } else if (typeLine.includes('Instant')) {
      return 'Instants';
    } else if (typeLine.includes('Sorcery')) {
      return 'Sorceries';
    } else {
      return 'Other'; // Default category
    }
  }
  
  // Provide value to consumers
  const value = {
    ...state,
    cardsByType, // Added back
    totalCardCount, // Added back
    setCommander,
    addCard,
    removeCard,
    updateCardQuantity,
    clearDeck,
    resetDeckExceptCommander,
    loadDeck,
    saveDeck, 
    saveCurrentDeckToGHL,
    fetchAndSetUserDecks, 
    setDeckName,
    setDeckDescription,
    importDeck,
    updateCardCategory,
    getCardType, // Exposing getCardType
  };
  
  return (
    <DeckContext.Provider value={value}>
      {children}
    </DeckContext.Provider>
  );
};

// Custom hook to use the deck context
export function useDeck() {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
}

export default DeckContext; 